import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { sendAuthEmail } from '../services/email.service';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { addMinutes, isBefore } from 'date-fns';
import * as randomSeed from 'random-seed';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key';

const emailSchema = z.object({
    email: z.string().email({ message: 'Email inválido' }),
});

const tokenSchema = z.object({
    email: z.string().email({ message: 'Email inválido' }),
    code: z.string().length(6, { message: 'El código debe tener 6 dígitos' }),
});

// ────────────────────────────────────────────────────────────────────
// POST /auth — Encuentra/crea usuario y envía código por email
// ────────────────────────────────────────────────────────────────────
export const requestAuthCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = emailSchema.parse(req.body);

        // Buscar o crear usuario
        let userId: string;
        const usersRef = db.collection('users');
        const q = await usersRef.where('email', '==', email).limit(1).get();

        if (q.empty) {
            const newUser = await usersRef.add({
                email,
                name: '',
                phone: '',
                address: null,
                createdAt: new Date(),
            });
            userId = newUser.id;
            console.log(`👤 Nuevo usuario creado: ${email}`);
        } else {
            userId = q.docs[0].id;
        }

        // Generar código de 6 dígitos
        const seed = randomSeed.create();
        const code = seed.intBetween(100000, 999999).toString();
        const expiration = addMinutes(new Date(), 15);

        // Borrar códigos anteriores del mismo email (limpieza)
        const oldCodes = await db.collection('auth').where('email', '==', email).get();
        const batch = db.batch();
        oldCodes.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();

        // Guardar nuevo código
        await db.collection('auth').add({
            email,
            code,
            expiresAt: expiration,
            userId,
        });

        // Enviar email
        await sendAuthEmail(email, code);

        // En desarrollo, incluir el código en la respuesta para facilitar pruebas
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(200).json({
            message: 'Código enviado exitosamente al email',
            ...(isDev && { code }),
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.flatten().fieldErrors });
        } else {
            console.error('❌ Error en requestAuthCode:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

// ────────────────────────────────────────────────────────────────────
// POST /auth/token — Valida código y devuelve JWT
// ────────────────────────────────────────────────────────────────────
export const verifyAuthCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code } = tokenSchema.parse(req.body);

        const authRef = db.collection('auth');
        const q = await authRef
            .where('email', '==', email)
            .where('code', '==', code)
            .limit(1)
            .get();

        if (q.empty) {

            res.status(401).json({ error: 'Código o email inválido' });
            return;
        }

        const authDoc = q.docs[0];
        const authData = authDoc.data();

        // Verificar expiración
        if (isBefore(authData.expiresAt.toDate(), new Date())) {
            await authDoc.ref.delete();
            res.status(401).json({ error: 'El código ha expirado. Solicitá uno nuevo.' });
            return;
        }

        // Código válido → generar JWT y eliminar código (uso único)
        const token = jwt.sign(
            { userId: authData.userId, email: authData.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        await authDoc.ref.delete();

        res.status(200).json({ token });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.flatten().fieldErrors });
        } else {
            console.error('❌ Error en verifyAuthCode:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};
