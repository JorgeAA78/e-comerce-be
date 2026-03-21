import { Response } from 'express';
import { db } from '../config/firebase';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    avatar: z.string().url().optional(),
}).strict();

const addressSchema = z.object({
    street: z.string().min(1, 'La calle es requerida'),
    city: z.string().min(1, 'La ciudad es requerida'),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
});

// ────────────────────────────────────────────────────────────────────
// GET /me — Devuelve info del usuario autenticado
// ────────────────────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.user!;

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }

        res.status(200).json({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
        console.error('❌ Error en getMe:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ────────────────────────────────────────────────────────────────────
// PATCH /me — Modifica datos del usuario
// ────────────────────────────────────────────────────────────────────
export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.user!;
        const data = updateUserSchema.parse(req.body);

        if (Object.keys(data).length === 0) {
            res.status(400).json({ error: 'No se enviaron campos para actualizar' });
            return;
        }

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }

        await userRef.update({ ...data, updatedAt: new Date() });

        const updated = await userRef.get();
        res.status(200).json({ id: updated.id, ...updated.data() });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.flatten().fieldErrors });
        } else {
            console.error('❌ Error en updateMe:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

// ────────────────────────────────────────────────────────────────────
// PATCH /me/address — Modifica la dirección del usuario
// ────────────────────────────────────────────────────────────────────
export const updateMyAddress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.user!;
        const address = addressSchema.parse(req.body);

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }

        await userRef.update({ address, updatedAt: new Date() });

        const updated = await userRef.get();
        res.status(200).json({ id: updated.id, ...updated.data() });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.flatten().fieldErrors });
        } else {
            console.error('❌ Error en updateMyAddress:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};
