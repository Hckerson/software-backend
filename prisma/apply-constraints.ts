import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const stripComments = (block: string): string =>
    block
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim();

async function main() {
    const sqlPath = join(process.cwd(), 'prisma', 'sql', 'constraints.sql');
    const statements = readFileSync(sqlPath, 'utf8')
        .split(';')
        .map(stripComments)
        .filter((statement) => statement.length > 0);

    for (const statement of statements) {
        await prisma.$executeRawUnsafe(statement);
    }

    process.stdout.write(`applied ${statements.length} constraint statements\n`);
}

main()
    .catch((error) => {
        process.exitCode = 1;
        process.stderr.write(`${String(error)}\n`);
    })
    .finally(() => prisma.$disconnect());
