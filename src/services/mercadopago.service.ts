import { preferenceClient } from '../config/mercadopago';

export interface CreatePreferenceInput {
    orderId: string;
    productId: string;
    productName: string;
    price: number;
    userEmail: string;
}

export const createMercadoPagoPreference = async (input: CreatePreferenceInput) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

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
            notification_url: `${baseUrl}/ipn/mercadopago`,
            back_urls: {
                success: `${baseUrl}/order/${input.orderId}`,
                failure: `${baseUrl}/order/${input.orderId}`,
                pending: `${baseUrl}/order/${input.orderId}`,
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
