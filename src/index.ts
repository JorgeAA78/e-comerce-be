import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import ipnRoutes from './routes/ipn.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globales ───────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health check ───────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Rutas ──────────────────────────────────────────────────────────
app.use('/', authRoutes);    // POST /auth, POST /auth/token
app.use('/', userRoutes);    // GET /me, PATCH /me, PATCH /me/address
app.use('/', productRoutes); // GET /search, GET /products/:id
app.use('/', orderRoutes);   // POST /order, GET /me/orders, GET /order/:orderId
app.use('/', ipnRoutes);     // POST /ipn/mercadopago

// ─── 404 handler ────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// ─── Error handler global ───────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('❌ Error no manejado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// ─── Start server ───────────────────────────────────────────────────
if (process.env.TESTING !== 'true') {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}

export default app;
