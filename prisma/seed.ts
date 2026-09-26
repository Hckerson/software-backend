import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { Day, Month, UserRole } from '../generated/prisma/enums';
import { PasswordUtil } from '../src/modules/core/auth/utils/password.util';

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DAYS = [Day.SUN, Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI, Day.SAT];
const MONTHS = [
    Month.JAN,
    Month.FEB,
    Month.MAR,
    Month.APR,
    Month.MAY,
    Month.JUN,
    Month.JUL,
    Month.AUG,
    Month.SEP,
    Month.OCT,
    Month.NOV,
    Month.DEC,
];

const stamp = (date: Date) => ({
    year: date.getFullYear(),
    day: DAYS[date.getDay()],
    month: MONTHS[date.getMonth()],
});

const shiftMonths = (date: Date, months: number): Date => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
};

const periodKey = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const PLANS = [
    {
        name: 'Free',
        planType: 'FREE' as const,
        priceUSD: 0,
        description: 'For trying things out.',
        limits: { API_CALLS: 10_000, STORAGE_GB: 1, SEATS: 1 },
        overageRates: {},
        features: { emailSupport: true, sla: false },
    },
    {
        name: 'Pro',
        planType: 'PRO' as const,
        priceUSD: 49,
        description: 'For teams shipping to production.',
        limits: { API_CALLS: 500_000, STORAGE_GB: 100, SEATS: 10 },
        overageRates: { API_CALLS: 0.0002, STORAGE_GB: 0.5 },
        features: { emailSupport: true, prioritySupport: true, sla: '99.9%' },
    },
    {
        name: 'Enterprise',
        planType: 'ENTERPRISE' as const,
        priceUSD: 499,
        description: 'Unlimited scale with a support contract.',
        limits: {},
        overageRates: {},
        features: {
            emailSupport: true,
            prioritySupport: true,
            sla: '99.99%',
            sso: true,
        },
    },
];

async function main() {
    const now = new Date();
    const passwordHash = await PasswordUtil.hash('password123');

    await prisma.usageLog.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.billingAudit.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.paymentMethod.deleteMany();
    await prisma.subscriptionPlan.deleteMany();
    await prisma.user.deleteMany();

    const plans = await Promise.all(
        PLANS.map((plan) => prisma.subscriptionPlan.create({ data: plan })),
    );

    const admin = await prisma.user.create({
        data: {
            fullName: 'Ada Admin',
            email: 'admin@meter.test',
            passwordHash,
            role: UserRole.ADMIN,
            ...stamp(now),
        },
    });

    const customer = await prisma.user.create({
        data: {
            fullName: 'Casey Customer',
            email: 'customer@meter.test',
            passwordHash,
            role: UserRole.USER,
            phoneNumber: '+1 555 0100',
            ...stamp(now),
        },
    });

    const pro = plans[1];
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = shiftMonths(periodStart, 1);

    const subscription = await prisma.subscription.create({
        data: {
            userId: customer.id,
            planId: pro.id,
            startDate: shiftMonths(periodStart, -2),
            renewalDate: periodEnd,
            currentBillingPeriodStart: periodStart,
            currentBillingPeriodEnd: periodEnd,
        },
    });

    await prisma.paymentMethod.create({
        data: {
            userId: customer.id,
            stripeToken: 'tok_seed_visa',
            last4Digits: '4242',
            expiryMonth: 12,
            expiryYear: now.getFullYear() + 2,
        },
    });

    await prisma.usageLog.createMany({
        data: [
            {
                subscriptionId: subscription.id,
                metricType: 'API_CALLS',
                amount: 412_500,
                period: periodKey(periodStart),
            },
            {
                subscriptionId: subscription.id,
                metricType: 'STORAGE_GB',
                amount: 78,
                period: periodKey(periodStart),
            },
            {
                subscriptionId: subscription.id,
                metricType: 'SEATS',
                amount: 10,
                period: periodKey(periodStart),
            },
            {
                subscriptionId: subscription.id,
                metricType: 'API_CALLS',
                amount: 288_000,
                period: periodKey(shiftMonths(periodStart, -1)),
            },
            {
                subscriptionId: subscription.id,
                metricType: 'STORAGE_GB',
                amount: 61,
                period: periodKey(shiftMonths(periodStart, -1)),
            },
        ],
    });

    await prisma.invoice.createMany({
        data: [
            {
                subscriptionId: subscription.id,
                userId: customer.id,
                amount: 49,
                billingPeriodStart: shiftMonths(periodStart, -2),
                billingPeriodEnd: shiftMonths(periodStart, -1),
                dueDate: shiftMonths(periodStart, -1),
                paidDate: shiftMonths(periodStart, -1),
                status: 'PAID',
            },
            {
                subscriptionId: subscription.id,
                userId: customer.id,
                amount: 49,
                billingPeriodStart: shiftMonths(periodStart, -1),
                billingPeriodEnd: periodStart,
                dueDate: periodStart,
                status: 'OVERDUE',
            },
        ],
    });

    process.stdout.write(
        [
            `plans:         ${plans.length}`,
            `users:         2  (${admin.email} / ${customer.email}, password123)`,
            `subscriptions: 1  (Casey on Pro)`,
            `usage logs:    5`,
            `invoices:      2  (1 paid, 1 overdue)`,
            '',
        ].join('\n'),
    );
}

main()
    .catch((error) => {
        process.exitCode = 1;
        process.stderr.write(`${String(error)}\n`);
    })
    .finally(() => prisma.$disconnect());
