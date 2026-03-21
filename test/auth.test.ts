import test from 'ava';
import request from 'supertest';
import app from '../src/index';

// ─── Tests de Autenticación ─────────────────────────────────────────

test('POST /auth - devuelve 400 si no se envía email', async (t) => {
    const res = await request(app)
        .post('/auth')
        .send({});
    t.is(res.status, 400);
});

test('POST /auth - devuelve 400 con email inválido', async (t) => {
    const res = await request(app)
        .post('/auth')
        .send({ email: 'no-es-un-email' });
    t.is(res.status, 400);
});

test('POST /auth/token - devuelve 400 si no se envía código', async (t) => {
    const res = await request(app)
        .post('/auth/token')
        .send({ email: 'test@example.com' });
    t.is(res.status, 400);
});

test('POST /auth/token - devuelve 401 con código inválido', async (t) => {
    const res = await request(app)
        .post('/auth/token')
        .send({ email: 'test@example.com', code: '000000' });
    t.is(res.status, 401);
});

test('GET /me - devuelve 401 sin token', async (t) => {
    const res = await request(app).get('/me');
    t.is(res.status, 401);
});

test('PATCH /me - devuelve 401 sin token', async (t) => {
    const res = await request(app).patch('/me').send({ name: 'Jorge' });
    t.is(res.status, 401);
});

test('GET /health - devuelve 200 con status ok', async (t) => {
    const res = await request(app).get('/health');
    t.is(res.status, 200);
    t.is(res.body.status, 'ok');
});
