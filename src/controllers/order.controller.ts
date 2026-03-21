import { Response } from 'express';
import { db } from '../config/firebase';
import { AuthRequest } from '../middleware/auth.middleware';
import { createMercadoPagoPreference } from '../services/mercadopago.service';

// ────────────────────────────────────────────────────────────────────
// POST /order?productId={id} — Crea orden y genera preferencia MP
// ────────────────────────────────────────────────────────────────────
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, email } = req.user!;
        const { productId } = req.query;

        if (!productId || typeof productId !== 'string') {
            res.status(400).json({ error: 'El parámetro productId es requerido' });
            return;
        }

        // Verificar que el producto existe y tiene stock
        const productDoc = await db.collection('products').doc(productId).get();

        if (!productDoc.exists) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }

        const product = productDoc.data()!;

        if (product.stock <= 0) {
            res.status(400).json({ error: 'El producto no tiene stock disponible' });
            return;
        }

        // Crear la orden en Firestore con estado "pending"
        const orderRef = await db.collection('orders').add({
            userId,
            userEmail: email,
            productId,
            productName: product.name,
            productImage: product.imageUrl || '',
            price: product.price,
            status: 'pending',
            mpPreferenceId: null,
            mpPaymentId: null,
            mpInitPoint: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const orderId = orderRef.id;

        // Crear preferencia en MercadoPago
        const mpResult = await createMercadoPagoPreference({
            orderId,
            productId,
            productName: product.name,
            price: product.price,
            userEmail: email,
        });

        // Actualizar la orden con datos de MP
        await orderRef.update({
            mpPreferenceId: mpResult.preferenceId,
            mpInitPoint: mpResult.sandboxInitPoint || mpResult.initPoint,
            updatedAt: new Date(),
        });

        res.status(201).json({
            orderId,
            initPoint: mpResult.sandboxInitPoint || mpResult.initPoint,
        });
    } catch (error) {
        console.error('❌ Error en createOrder:', error);
        res.status(500).json({ error: 'Error al crear la orden' });
    }
};

// ────────────────────────────────────────────────────────────────────
// GET /me/orders — Devuelve todas las órdenes del usuario
// ────────────────────────────────────────────────────────────────────
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.user!;

        const ordersSnap = await db
            .collection('orders')
            .where('userId', '==', userId)
            .get();

        const orders = ordersSnap.docs
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            }))
            .sort((a, b) => {
                const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                return bTime - aTime; // desc
            });

        res.status(200).json(orders);
    } catch (error) {
        console.error('❌ Error en getMyOrders:', error);
        res.status(500).json({ error: 'Error al obtener órdenes' });
    }
};


// ────────────────────────────────────────────────────────────────────
// GET /order/:orderId — Devuelve el detalle de una orden
// ────────────────────────────────────────────────────────────────────
export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.user!;
        const { orderId } = req.params;

        const orderDoc = await db.collection('orders').doc(orderId).get();

        if (!orderDoc.exists) {
            res.status(404).json({ error: 'Orden no encontrada' });
            return;
        }

        const order = orderDoc.data()!;

        // Solo el dueño puede ver su orden
        if (order.userId !== userId) {
            res.status(403).json({ error: 'No tenés permiso para ver esta orden' });
            return;
        }

        res.status(200).json({
            id: orderDoc.id,
            ...order,
            createdAt: order.createdAt?.toDate(),
            updatedAt: order.updatedAt?.toDate(),
        });
    } catch (error) {
        console.error('❌ Error en getOrderById:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
