import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';
import { AUTH_COOKIE, readAuthCookie } from './auth.cookie';

const TOKEN = 'header.payload.signature';

const authService = {
    login: jest.fn(),
    register: jest.fn(),
    resetPassword: jest.fn(),
    onboarding: jest.fn(),
};

type SuperTestTarget = Parameters<typeof request>[0];

const cookieHeader = (response: request.Response): string => {
    const raw: unknown = response.headers['set-cookie'];
    const list: string[] = Array.isArray(raw)
        ? (raw as string[])
        : typeof raw === 'string'
          ? [raw]
          : [];

    return list.find((value) => value.startsWith(`${AUTH_COOKIE}=`)) ?? '';
};

describe('auth session cookie', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: authService }],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleRef.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('issues an httpOnly cookie on login', async () => {
        authService.login.mockResolvedValue({
            user: { id: 'u1', name: 'A', email: 'a@b.c', role: 'USER' },
            accessToken: TOKEN,
        });

        const response = await request(app.getHttpServer() as SuperTestTarget)
            .post('/auth/login')
            .send({ email: 'a@b.c', password: 'password123' })
            .expect(200);

        const cookie = cookieHeader(response);

        expect(cookie).toContain(`${AUTH_COOKIE}=${TOKEN}`);
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('SameSite=Lax');
        expect(cookie).toContain('Path=/');
    });

    it('issues the cookie on register too', async () => {
        authService.register.mockResolvedValue({
            user: { id: 'u1', name: 'A', email: 'a@b.c', role: 'USER' },
            accessToken: TOKEN,
        });

        const response = await request(app.getHttpServer() as SuperTestTarget)
            .post('/auth/register')
            .send({ fullName: 'A', email: 'a@b.c', password: 'password123' })
            .expect(201);

        expect(cookieHeader(response)).toContain('HttpOnly');
    });

    it('clears the cookie on logout', async () => {
        const response = await request(app.getHttpServer() as SuperTestTarget)
            .post('/auth/logout')
            .expect(200);

        const cookie = cookieHeader(response);

        expect(cookie).toContain(`${AUTH_COOKIE}=;`);
        expect(cookie).toContain('Expires=Thu, 01 Jan 1970');
    });
});

describe('readAuthCookie', () => {
    it('finds the token among other cookies', () => {
        expect(
            readAuthCookie(`theme=dark; ${AUTH_COOKIE}=${TOKEN}; other=1`),
        ).toBe(TOKEN);
    });

    it('does not match a cookie whose name merely ends with the token name', () => {
        expect(readAuthCookie(`not_${AUTH_COOKIE}=nope`)).toBeNull();
    });

    it('returns null when the header is absent or has no match', () => {
        expect(readAuthCookie(undefined)).toBeNull();
        expect(readAuthCookie('theme=dark')).toBeNull();
    });
});
