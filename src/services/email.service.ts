import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;

if (apiKey) {
    sgMail.setApiKey(apiKey);
} else {
    console.warn('⚠️ SENDGRID_API_KEY no encontrada. Los correos no se enviarán.');
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';

// ────────────────────────────────────────────────────────────────────
// Email de código de autenticación
// ────────────────────────────────────────────────────────────────────
export const sendAuthEmail = async (to: string, code: string): Promise<void> => {
    const msg = {
        to,
        from: FROM_EMAIL,
        subject: '🔑 Tu código de acceso',
        text: `Tu código de acceso es: ${code}. Expira en 15 minutos.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
                <h2 style="color:#333;">Tu código de acceso</h2>
                <p>Usá este código para ingresar a tu cuenta:</p>
                <div style="background:#f4f4f4; padding:20px; text-align:center; font-size:32px; font-weight:bold; letter-spacing:8px; border-radius:8px;">
                    ${code}
                </div>
                <p style="color:#888; font-size:12px; margin-top:16px;">Este código expira en 15 minutos. Si no lo solicitaste, ignorá este email.</p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log(`📧 Email de auth enviado a ${to}`);
    } catch (error) {
        console.error('❌ Error enviando email de auth:', error);
        if ((error as any).response) {
            console.error((error as any).response.body);
        }
    }
};

// ────────────────────────────────────────────────────────────────────
// Email de confirmación de pago al usuario
// ────────────────────────────────────────────────────────────────────
export const sendPaymentConfirmationEmail = async (
    to: string,
    orderData: {
        orderId: string;
        productName: string;
        price: number;
    }
): Promise<void> => {
    const priceFormatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(orderData.price);

    const msg = {
        to,
        from: FROM_EMAIL,
        subject: '✅ Pago confirmado — Tu compra está en proceso',
        text: `¡Tu pago fue confirmado! Orden #${orderData.orderId} — ${orderData.productName} por ${priceFormatted}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
                <h2 style="color:#28a745;">¡Pago confirmado! 🎉</h2>
                <p>Hola! Tu compra fue procesada exitosamente.</p>
                <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
                    <tr style="background:#f9f9f9;">
                        <td style="padding:8px; border:1px solid #ddd;"><strong>Orden #</strong></td>
                        <td style="padding:8px; border:1px solid #ddd;">${orderData.orderId}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; border:1px solid #ddd;"><strong>Producto</strong></td>
                        <td style="padding:8px; border:1px solid #ddd;">${orderData.productName}</td>
                    </tr>
                    <tr style="background:#f9f9f9;">
                        <td style="padding:8px; border:1px solid #ddd;"><strong>Total</strong></td>
                        <td style="padding:8px; border:1px solid #ddd;">${priceFormatted}</td>
                    </tr>
                </table>
                <p>Nos pondremos en contacto para coordinar el envío. ¡Gracias por tu compra!</p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log(`📧 Email de confirmación enviado a ${to}`);
    } catch (error) {
        console.error('❌ Error enviando email de confirmación de pago:', error);
        if ((error as any).response) {
            console.error((error as any).response.body);
        }
    }
};

// ────────────────────────────────────────────────────────────────────
// Email de notificación interna (admin)
// ────────────────────────────────────────────────────────────────────
export const sendAdminNotificationEmail = async (orderData: {
    orderId: string;
    userEmail: string;
    productName: string;
    price: number;
    mpPaymentId: string;
}): Promise<void> => {
    const adminEmail = process.env.ADMIN_EMAIL || FROM_EMAIL;
    const priceFormatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(orderData.price);

    const msg = {
        to: adminEmail,
        from: FROM_EMAIL,
        subject: `🛒 Nueva venta confirmada — Orden #${orderData.orderId}`,
        text: `Nueva venta! Orden #${orderData.orderId} - ${orderData.productName} por ${priceFormatted} - Cliente: ${orderData.userEmail}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
                <h2 style="color:#007bff;">🛒 Nueva venta confirmada</h2>
                <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
                    <tr style="background:#f9f9f9;">
                        <td style="padding:8px; border:1px solid #ddd;"><strong>Orden #</strong></td>
                        <td style="padding:8px; border:1px solid #ddd;">${orderData.orderId}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; border:1px solid #ddd;"><strong>Cliente</strong></td>
                        <td style="padding:8px; border:1px solid #ddd;">${orderData.userEmail}</td>
                    </tr>
                    <tr style="background:#f9f9f9;">
                        <td style="padding:8px; border:1px solid #ddd;"><strong>Producto</strong></td>
                        <td style="padding:8px; border:1px solid #ddd;">${orderData.productName}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px; border:1px solid #ddd;"><strong>Total</strong></td>
                        <td style="padding:8px; border:1px solid #ddd;">${priceFormatted}</td>
                    </tr>
                    <tr style="background:#f9f9f9;">
                        <td style="padding:8px; border:1px solid #ddd;"><strong>MP Payment ID</strong></td>
                        <td style="padding:8px; border:1px solid #ddd;">${orderData.mpPaymentId}</td>
                    </tr>
                </table>
                <p>Por favor procesá el pedido a la brevedad.</p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log(`📧 Email de notificación admin enviado a ${adminEmail}`);
    } catch (error) {
        console.error('❌ Error enviando email de notificación admin:', error);
        if ((error as any).response) {
            console.error((error as any).response.body);
        }
    }
};
