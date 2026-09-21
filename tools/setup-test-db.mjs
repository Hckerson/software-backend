// Creates the integration-test database and pushes the schema into it.
// Deliberately a separate database from the development one: the cycle suite
// truncates every table between tests, which must never touch dev data.
import { execFileSync, execSync } from 'node:child_process';

const TEST_DB = process.env.TEST_DB_NAME ?? 'meter_test';
const ADMIN_URL =
    process.env.TEST_ADMIN_URL ??
    'postgresql://postgres:postgres@localhost:5432/postgres';

const testUrl = () => {
    const url = new URL(ADMIN_URL);

    url.pathname = `/${TEST_DB}`;
    url.search = 'schema=public';

    return url.toString();
};

const psql = (sql, database = 'postgres') =>
    execFileSync(
        'docker',
        [
            'compose',
            'exec',
            '-T',
            'db',
            'psql',
            '-U',
            'postgres',
            '-d',
            database,
            '-c',
            sql,
        ],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );

const exists = () =>
    psql(`SELECT 1 FROM pg_database WHERE datname = '${TEST_DB}'`).includes(
        '(1 row)',
    );

if (exists()) {
    process.stdout.write(`${TEST_DB} already exists\n`);
} else {
    psql(`CREATE DATABASE "${TEST_DB}"`);
    process.stdout.write(`created ${TEST_DB}\n`);
}

execSync(`npx prisma db push --url "${testUrl()}"`, { stdio: 'inherit' });

// The partial unique index Prisma cannot express; db push does not create it.
psql(
    'DROP INDEX IF EXISTS "Subscription_userId_status_key"; ' +
        'CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_one_active_per_user" ' +
        'ON "Subscription" ("userId") WHERE status = \'ACTIVE\';',
    TEST_DB,
);

process.stdout.write(`${TEST_DB} ready\n`);
