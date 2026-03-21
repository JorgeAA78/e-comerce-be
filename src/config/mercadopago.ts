import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

const accessToken = process.env.MP_ACCESS_TOKEN || '';

export const mpClient = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000 },
});

export const preferenceClient = new Preference(mpClient);
export const paymentClient = new Payment(mpClient);
