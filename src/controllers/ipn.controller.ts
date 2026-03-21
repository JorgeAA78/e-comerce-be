import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { paymentClient } from '../config/mercadopago';
import {
    sendPaymentConfirmationEmail,
    sendAdminNotificationEmail,
} from '../services/email.service';

// ────────────────────────────────────────────────────────────────────
// POST /ipn/mercadopago — Webhook de MercadoPago
// ────────────────────────────────────────────────────────────────────
export const mercadoPagoIPN = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, data } = req.body;

        console.log('📬 IPN MercadoPago recibido:', JSON.stringify(req.body, null, 2));

        // Solo procesar notificaciones de tipo "payment"
        if (type !== 'payment' || !data?.id) {
            // También puede venir como query param (método antiguo)
            const paymentId = req.query['data.id'] || req.query.id;
            if (!paymentId) {
                res.status(200).json({ message: 'Notificación recibida (no es pago)' });
                return;
            }
        }

        const paymentId = data?.id || req.query['data.id'] || req.query.id;

        if (!paymentId) {
            res.status(200).json({ message: 'Sin payment_id' });
            return;
        }

        // Obtener el pago de MercadoPago
        const payment = await paymentClient.get({ id: String(paymentId) });

        console.log(`💳 Estado del pago ${paymentId}: ${payment.status}`);

        // Solo procesar pagos aprobados
        if (payment.status !== 'approved') {
            res.status(200).json({ message: `Estado del pago: ${payment.status}` });
            return;
        }

        // Obtener el orderId desde external_reference
        const orderId = payment.external_reference;

        if (!orderId) {
            console.error('❌ No se encontró external_reference en el pago');
            res.status(200).json({ message: 'Sin external_reference' });
            return;
        }

        // Verificar que la orden existe
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            console.error(`❌ Orden ${orderId} no encontrada`);
            res.status(200).json({ message: 'Orden no encontrada' });
            return;
        }

        const order = orderDoc.data()!;

        // Si ya estaba pagada, no procesar de nuevo (idempotencia)
        if (order.status === 'paid') {
            res.status(200).json({ message: 'Orden ya procesada' });
            return;
        }

        // ── Actualizar orden a "paid" ──
        await orderRef.update({
            status: 'paid',
            mpPaymentId: String(paymentId),
            updatedAt: new Date(),
        });

        // ── Descontar stock del producto ──
        const productRef = db.collection('products').doc(order.productId);
        const productDoc = await productRef.get();
        if (productDoc.exists) {
            const currentStock = productDoc.data()?.stock ?? 0;
            await productRef.update({
                stock: Math.max(0, currentStock - 1),
                updatedAt: new Date(),
            });
        }

        // ── Enviar email de confirmación al usuario ──
        await sendPaymentConfirmationEmail(order.userEmail, {
            orderId,
            productName: order.productName,
            price: order.price,
        });

        // ── Notificación interna al admin ──
        await sendAdminNotificationEmail({
            orderId,
            userEmail: order.userEmail,
            productName: order.productName,
            price: order.price,
            mpPaymentId: String(paymentId),
        });

        console.log(`✅ Orden ${orderId} marcada como PAID`);
        res.status(200).json({ message: 'Pago procesado correctamente' });
    } catch (error) {
        console.error('❌ Error en mercadoPagoIPN:', error);
        // Siempre devolver 200 a MercadoPago para que no reintente
        res.status(200).json({ message: 'Error procesado' });
    }
};
