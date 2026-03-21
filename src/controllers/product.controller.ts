import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { productsIndex } from '../config/algolia';

// ────────────────────────────────────────────────────────────────────
// GET /search?q=query&offset=0&limit=10
// Busca productos usando Algolia (técnica Airtable+Algolia)
// ────────────────────────────────────────────────────────────────────
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const q = (req.query.q as string) || '';
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

        // Buscar en Algolia
        const algoliaResult = await productsIndex.search(q, {
            offset,
            length: limit,
            filters: 'stock > 0',  // Solo productos con stock
        });

        // Obtener IDs de Algolia y enricher con data fresca de Firestore
        const objectIDs: string[] = algoliaResult.hits.map((hit: any) => hit.objectID);

        // Si hay resultados, hidratar desde Firestore para garantizar datos actualizados
        let products: any[] = [];
        if (objectIDs.length > 0) {
            const firestoreDocs = await Promise.all(
                objectIDs.map((id) => db.collection('products').doc(id).get())
            );
            products = firestoreDocs
                .filter((doc) => doc.exists && (doc.data()?.stock ?? 0) > 0)
                .map((doc) => ({ id: doc.id, ...doc.data() }));
        }

        res.status(200).json({
            hits: products,
            total: algoliaResult.nbHits,
            offset,
            limit,
        });
    } catch (error) {
        console.error('❌ Error en searchProducts:', error);
        res.status(500).json({ error: 'Error al buscar productos' });
    }
};

// ────────────────────────────────────────────────────────────────────
// GET /products/:id — Obtiene un producto por ID de Firestore
// ────────────────────────────────────────────────────────────────────
export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const productDoc = await db.collection('products').doc(id).get();

        if (!productDoc.exists) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }

        const product = { id: productDoc.id, ...productDoc.data() };
        res.status(200).json(product);
    } catch (error) {
        console.error('❌ Error en getProductById:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
