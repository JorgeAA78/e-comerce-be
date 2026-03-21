import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/firebase';
import { productsIndex } from '../config/algolia';

const products = [
    {
        name: 'Remera Oversize Negra',
        description: 'Remera oversize de algodón 100% premium. Ideal para uso casual.',
        price: 15000,
        stock: 50,
        category: 'ropa',
        imageUrl: 'https://via.placeholder.com/400x400?text=Remera+Oversize',
        brand: 'UrbanStyle',
    },
    {
        name: 'Zapatillas Running Pro',
        description: 'Zapatillas de running con tecnología de amortiguación avanzada.',
        price: 89000,
        stock: 20,
        category: 'calzado',
        imageUrl: 'https://via.placeholder.com/400x400?text=Zapatillas+Running',
        brand: 'SpeedRun',
    },
    {
        name: 'Hoodie Clásico Gris',
        description: 'Buzo con capucha de felpa. Abrigo y estilo en uno.',
        price: 27000,
        stock: 35,
        category: 'ropa',
        imageUrl: 'https://via.placeholder.com/400x400?text=Hoodie+Clasico',
        brand: 'UrbanStyle',
    },
    {
        name: 'Mochila Urbana 25L',
        description: 'Mochila resistente al agua con compartimiento para laptop 15".',
        price: 42000,
        stock: 15,
        category: 'accesorios',
        imageUrl: 'https://via.placeholder.com/400x400?text=Mochila+Urbana',
        brand: 'TravelGear',
    },
    {
        name: 'Gorra Snapback Logo',
        description: 'Gorra con visera plana y ajuste de snapback. Talla única.',
        price: 8500,
        stock: 60,
        category: 'accesorios',
        imageUrl: 'https://via.placeholder.com/400x400?text=Gorra+Snapback',
        brand: 'UrbanStyle',
    },
    {
        name: 'Pantalón Cargo Beige',
        description: 'Pantalón cargo estilo militar con multipockets. Tela resistente.',
        price: 32000,
        stock: 25,
        category: 'ropa',
        imageUrl: 'https://via.placeholder.com/400x400?text=Pantalon+Cargo',
        brand: 'Urban Tactical',
    },
    {
        name: 'Auriculares Bluetooth XB500',
        description: 'Auriculares over-ear con cancelación de ruido y 30hs de batería.',
        price: 65000,
        stock: 10,
        category: 'electronica',
        imageUrl: 'https://via.placeholder.com/400x400?text=Auriculares+BT',
        brand: 'SoundMax',
    },
    {
        name: 'Cinturón Cuero Marrón',
        description: 'Cinturón de cuero genuino con hebilla metálica dorada.',
        price: 12000,
        stock: 40,
        category: 'accesorios',
        imageUrl: 'https://via.placeholder.com/400x400?text=Cinturon+Cuero',
        brand: 'LeatherCo',
    },
];

const deleteCollection = async (collectionName: string) => {
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) return;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`🗑️  Colección '${collectionName}' limpiada (${snapshot.size} docs eliminados)`);
};

const seedProducts = async () => {
    console.log('🌱 Iniciando seed de productos...');

    // Limpiar colección existente para evitar duplicados
    await deleteCollection('products');

    const algoliaObjects: any[] = [];

    for (const product of products) {
        // Guardar en Firestore
        const docRef = await db.collection('products').add({
            ...product,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log(`✅ Producto creado en Firestore: ${product.name} (ID: ${docRef.id})`);

        // Preparar objeto para Algolia (con objectID = Firestore ID)
        algoliaObjects.push({
            objectID: docRef.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            brand: product.brand,
            imageUrl: product.imageUrl,
        });
    }

    // Indexar todos en Algolia de una sola vez
    await productsIndex.saveObjects(algoliaObjects);
    console.log(`✅ ${algoliaObjects.length} productos indexados en Algolia`);

    console.log('🎉 Seed completado exitosamente!');
    process.exit(0);
};

seedProducts().catch((err) => {
    console.error('❌ Error en seed:', err);
    process.exit(1);
});
