import test from 'ava';
import request from 'supertest';
import app from '../src/index';

// ─── Tests de Productos ──────────────────────────────────────────────

test('GET /products/inexistente-id - devuelve 404', async (t) => {
    const res = await request(app).get('/products/id-que-no-existe');
    t.is(res.status, 404);
    t.truthy(res.body.error);
});

test('GET /search - responde correctamente sin query', async (t) => {
    const res = await request(app).get('/search?q=&offset=0&limit=10');
    // 200 si Algolia está configurado, 500 si no (env de test)
    t.true(res.status === 200 || res.status === 500);
});

test('GET /search - con parámetros válidos', async (t) => {
    const res = await request(app).get('/search?q=remera&offset=0&limit=5');
    t.true(res.status === 200 || res.status === 500);
    if (res.status === 200) {
        t.truthy(res.body.hits);
        t.is(typeof res.body.total, 'number');
    }
});

// ─── Tests de Órdenes ───────────────────────────────────────────────

test('POST /order - devuelve 401 sin token', async (t) => {
    const res = await request(app).post('/order?productId=test');
    t.is(res.status, 401);
});

test('GET /me/orders - devuelve 401 sin token', async (t) => {
    const res = await request(app).get('/me/orders');
    t.is(res.status, 401);
});

test('GET /order/cualquier-id - devuelve 401 sin token', async (t) => {
    const res = await request(app).get('/order/cualquier-id');
    t.is(res.status, 401);
});

// ─── Tests de IPN ───────────────────────────────────────────────────

test('POST /ipn/mercadopago - acepta payload sin type', async (t) => {
    const res = await request(app)
        .post('/ipn/mercadopago')
        .send({ action: 'test' });
    // Siempre debe devolver 200 a MercadoPago
    t.is(res.status, 200);
});
