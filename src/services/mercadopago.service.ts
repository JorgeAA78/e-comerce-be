import { preferenceClient } from '../config/mercadopago';

export interface CreatePreferenceInput {
    orderId: string;
    productId: string;
    productName: string;
    price: number;
    userEmail: string;
}

export const createMercadoPagoPreference = async (input: CreatePreferenceInput) => {
    // Usamos variables separadas para Backend y Frontend
    const backendUrl = process.env.BACKEND_URL || 'https://e-comerce-be-production.up.railway.app';
    const frontendUrl = process.env.FRONTEND_URL || 'https://ecommerce-mirasoles.vercel.app';

    const preference = await preferenceClient.create({
        body: {
            items: [
                {
                    id: input.productId,
                    title: input.productName,
                    quantity: 1,
                    unit_price: input.price,
                    currency_id: 'ARS',
                },
            ],
            payer: {
                email: input.userEmail,
            },
            external_reference: input.orderId,
            // 1. El Webhook va al Backend:
            notification_url: `${backendUrl}/ipn/mercadopago`,
            // 2. El usuario regresa a la pantalla de /thanks del Frontend:
            back_urls: {
                success: `${frontendUrl}/thanks?status=approved`,
                failure: `${frontendUrl}/thanks?status=failure`,
                pending: `${frontendUrl}/thanks?status=pending`,
            },
            metadata: {
                orderId: input.orderId,
            },
        },
    });

    return {
        preferenceId: preference.id,
        initPoint: preference.init_point,      // URL para producción
        sandboxInitPoint: preference.sandbox_init_point, // URL para sandbox/prueba
    };
};
