import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
    Day,
    InvoiceStatus,
    Month,
    PlanType,
    PrismaClient,
    SubscriptionStatus,
    UserRole,
} from '../generated/prisma/client';
import { CycleService } from '../src/modules/core/cycle/cycle.service';
import { CycleModule } from '../src/modules/core/cycle/cycle.module';
import { RepoModule } from '../src/common/repos/repo.module';
import { PrismaModule } from '../src/common/database/prisma.module';
import { PrismaService } from '../src/common/database/prisma.service';

const TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/meter_test?schema=public';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-09-20T12:00:00.000Z');
const PLAN_PRICE = 49;

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL }),
});

const daysFrom = (base: Date, days: number): Date =>
    new Date(base.getTime() + days * DAY);

const makeUser = (email: string) =>
    prisma.user.create({
        data: {
            email,
            fullName: 'Test Customer',
            passwordHash: 'not-a-real-hash',
            year: 2026,
            day: Day.MON,
            month: Month.SEP,
            role: UserRole.USER,
        },
    });

const makePlan = (name: string, overageRates: Record<string, number> = {}) =>
    prisma.subscriptionPlan.create({
        data: {
            name,
            priceUSD: '49.00',
            planType: PlanType.PRO,
            features: {},
            limits: { API_CALLS: 500000 },
            overageRates,
        },
    });

describe('billing cycle (integration)', () => {
    let cycle: CycleService;

    beforeAll(async () => {
        process.env.DATABASE_URL = TEST_DATABASE_URL;

        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                PrismaModule,
                RepoModule,
                CycleModule,
            ],
        })
            .overrideProvider(PrismaService)
            .useValue(prisma)
            .compile();

        cycle = moduleRef.get(CycleService);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await prisma.billingAudit.deleteMany();
        await prisma.usageLog.deleteMany();
        await prisma.invoice.deleteMany();
        await prisma.subscription.deleteMany();
        await prisma.subscriptionPlan.deleteMany();
        await prisma.user.deleteMany();
    });

    const seedSubscription = async (
        email: string,
        periodEnd: Date,
        status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
        overageRates: Record<string, number> = {},
    ) => {
        const user = await makeUser(email);
        const plan = await makePlan(`plan-${email}`, overageRates);

        return prisma.subscription.create({
            data: {
                userId: user.id,
                planId: plan.id,
                status,
                renewalDate: periodEnd,
                currentBillingPeriodStart: daysFrom(periodEnd, -30),
                currentBillingPeriodEnd: periodEnd,
            },
        });
    };

    const seedSentInvoice = async (email: string, dueDate: Date) => {
        const sub = await seedSubscription(email, daysFrom(NOW, 10));

        const invoice = await prisma.invoice.create({
            data: {
                subscriptionId: sub.id,
                userId: sub.userId,
                amount: '49.00',
                status: InvoiceStatus.SENT,
                dueDate,
                billingPeriodStart: daysFrom(dueDate, -30),
                billingPeriodEnd: daysFrom(dueDate, -1),
            },
        });

        return { sub, invoice };
    };

    describe('issueInvoiceForPeriod', () => {
        it('issues one invoice for the current period', async () => {
            const sub = await seedSubscription(
                'one@test.io',
                daysFrom(NOW, -1),
            );

            const invoice = await cycle.issueInvoiceForPeriod(sub.id);

            expect(invoice.status).toBe(InvoiceStatus.SENT);
            expect(Number(invoice.amount)).toBe(PLAN_PRICE);
            expect(invoice.billingPeriodStart).toEqual(
                sub.currentBillingPeriodStart,
            );
        });

        it('is idempotent: issuing the same period three times yields one invoice', async () => {
            const sub = await seedSubscription(
                'idem@test.io',
                daysFrom(NOW, -1),
            );

            const first = await cycle.issueInvoiceForPeriod(sub.id);
            const second = await cycle.issueInvoiceForPeriod(sub.id);
            const third = await cycle.issueInvoiceForPeriod(sub.id);

            expect(second.id).toBe(first.id);
            expect(third.id).toBe(first.id);
            expect(await prisma.invoice.count()).toBe(1);
        });

        it('writes an audit row naming the invoice', async () => {
            const sub = await seedSubscription(
                'audit@test.io',
                daysFrom(NOW, -1),
            );

            const invoice = await cycle.issueInvoiceForPeriod(sub.id);
            const audits = await prisma.billingAudit.findMany({
                where: { action: 'invoice_issued' },
            });

            expect(audits).toHaveLength(1);
            expect(audits[0].newValue).toMatchObject({ invoiceId: invoice.id });
        });

        it('refuses a subscription that does not exist', async () => {
            await expect(
                cycle.issueInvoiceForPeriod('no-such-subscription'),
            ).rejects.toThrow(/not found/i);
        });
    });

    describe('overage billing', () => {
        const RATE = 0.0002;
        const LIMIT = 500000;

        const seedUsage = (subscriptionId: string, amount: number) =>
            prisma.usageLog.create({
                data: {
                    subscriptionId,
                    metricType: 'API_CALLS',
                    amount,
                    period: '2026-08',
                },
            });

        const seedBillable = (email: string) =>
            seedSubscription(
                email,
                daysFrom(NOW, -1),
                SubscriptionStatus.ACTIVE,
                { API_CALLS: RATE },
            );

        it('adds the priced excess to the invoice', async () => {
            const sub = await seedBillable('over@test.io');

            await prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    currentBillingPeriodStart: new Date('2026-08-01T00:00:00Z'),
                },
            });
            await seedUsage(sub.id, LIMIT + 12500);

            const invoice = await cycle.issueInvoiceForPeriod(sub.id);

            expect(Number(invoice.amount)).toBeCloseTo(PLAN_PRICE + 2.5);
        });

        it('charges nothing while usage is within the limit', async () => {
            const sub = await seedBillable('under@test.io');

            await prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    currentBillingPeriodStart: new Date('2026-08-01T00:00:00Z'),
                },
            });
            await seedUsage(sub.id, LIMIT - 1);

            const invoice = await cycle.issueInvoiceForPeriod(sub.id);

            expect(Number(invoice.amount)).toBe(PLAN_PRICE);
        });

        it('charges nothing when the metric has no rate, so a hard cap bills flat', async () => {
            const sub = await seedSubscription(
                'capped@test.io',
                daysFrom(NOW, -1),
            );

            await prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    currentBillingPeriodStart: new Date('2026-08-01T00:00:00Z'),
                },
            });
            await seedUsage(sub.id, LIMIT + 999999);

            const invoice = await cycle.issueInvoiceForPeriod(sub.id);

            expect(Number(invoice.amount)).toBe(PLAN_PRICE);
        });
    });

    describe('renewDueSubscriptions', () => {
        it('renews a subscription past its period end and rolls the period forward', async () => {
            const sub = await seedSubscription(
                'due@test.io',
                daysFrom(NOW, -1),
            );

            const summary = await cycle.renewDueSubscriptions(NOW);
            const renewed = await prisma.subscription.findUniqueOrThrow({
                where: { id: sub.id },
            });

            expect(summary).toMatchObject({ examined: 1, changed: 1 });
            expect(renewed.currentBillingPeriodStart).toEqual(
                sub.currentBillingPeriodEnd,
            );
            expect(renewed.currentBillingPeriodEnd.getTime()).toBeGreaterThan(
                sub.currentBillingPeriodEnd.getTime(),
            );
            expect(await prisma.invoice.count()).toBe(1);
        });

        it('leaves a subscription inside its period alone', async () => {
            await seedSubscription('future@test.io', daysFrom(NOW, 10));

            const summary = await cycle.renewDueSubscriptions(NOW);

            expect(summary).toMatchObject({ examined: 0, changed: 0 });
            expect(await prisma.invoice.count()).toBe(0);
        });

        it('ignores a canceled subscription even when it is past due', async () => {
            await seedSubscription(
                'canceled@test.io',
                daysFrom(NOW, -1),
                SubscriptionStatus.CANCELED,
            );

            const summary = await cycle.renewDueSubscriptions(NOW);

            expect(summary.examined).toBe(0);
        });

        it('is safe to run twice: the second run has nothing left to renew', async () => {
            await seedSubscription('twice@test.io', daysFrom(NOW, -1));

            const first = await cycle.renewDueSubscriptions(NOW);
            const second = await cycle.renewDueSubscriptions(NOW);

            expect(first.changed).toBe(1);
            expect(second.changed).toBe(0);
            expect(await prisma.invoice.count()).toBe(1);
        });

        it('records the renewal in the audit trail', async () => {
            await seedSubscription('trail@test.io', daysFrom(NOW, -1));

            await cycle.renewDueSubscriptions(NOW);

            const actions = (
                await prisma.billingAudit.findMany({ select: { action: true } })
            ).map((row) => row.action);

            expect(actions).toContain('subscription_renewed');
            expect(actions).toContain('invoice_issued');
        });
    });

    describe('markOverdueInvoices', () => {
        it('marks a past-due invoice overdue and its subscription past due', async () => {
            const { sub, invoice } = await seedSentInvoice(
                'late@test.io',
                daysFrom(NOW, -1),
            );

            const summary = await cycle.markOverdueInvoices(NOW);

            const settled = await prisma.invoice.findUniqueOrThrow({
                where: { id: invoice.id },
            });
            const owner = await prisma.subscription.findUniqueOrThrow({
                where: { id: sub.id },
            });

            expect(summary).toMatchObject({ examined: 1, changed: 1 });
            expect(settled.status).toBe(InvoiceStatus.OVERDUE);
            expect(owner.status).toBe(SubscriptionStatus.PAST_DUE);
        });

        it('leaves an invoice still within its due date alone', async () => {
            await seedSentInvoice('ontime@test.io', daysFrom(NOW, 5));

            const summary = await cycle.markOverdueInvoices(NOW);

            expect(summary).toMatchObject({ examined: 0, changed: 0 });
        });

        it('is safe to run twice: the second run finds nothing still sent', async () => {
            await seedSentInvoice('again@test.io', daysFrom(NOW, -1));

            const first = await cycle.markOverdueInvoices(NOW);
            const second = await cycle.markOverdueInvoices(NOW);

            expect(first.changed).toBe(1);
            expect(second.changed).toBe(0);
        });

        it('records the transition in the audit trail', async () => {
            await seedSentInvoice('overdue-audit@test.io', daysFrom(NOW, -1));

            await cycle.markOverdueInvoices(NOW);

            const audits = await prisma.billingAudit.findMany({
                where: { action: 'invoice_overdue' },
            });

            expect(audits).toHaveLength(1);
        });
    });

    describe('runAll', () => {
        it('renews and sweeps in one pass', async () => {
            await seedSubscription('runall-due@test.io', daysFrom(NOW, -1));
            const other = await seedSubscription(
                'runall-late@test.io',
                daysFrom(NOW, 10),
            );

            await prisma.invoice.create({
                data: {
                    subscriptionId: other.id,
                    userId: other.userId,
                    amount: '49.00',
                    status: InvoiceStatus.SENT,
                    dueDate: daysFrom(NOW, -2),
                    billingPeriodStart: daysFrom(NOW, -32),
                    billingPeriodEnd: daysFrom(NOW, -2),
                },
            });

            const { renewal, overdue } = await cycle.runAll(NOW);

            expect(renewal.changed).toBe(1);
            expect(overdue.changed).toBe(1);
        });

        it('does not mark the invoice it just issued as overdue', async () => {
            await seedSubscription('fresh@test.io', daysFrom(NOW, -1));

            const { renewal, overdue } = await cycle.runAll(NOW);

            expect(renewal.changed).toBe(1);
            expect(overdue.changed).toBe(0);
        });
    });
});
