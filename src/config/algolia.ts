import algoliasearch from 'algoliasearch';
import dotenv from 'dotenv';

dotenv.config();

const appId = process.env.ALGOLIA_APP_ID || '';
const apiKey = process.env.ALGOLIA_API_KEY || '';
const indexName = process.env.ALGOLIA_INDEX_NAME || 'products';

// Cliente admin (para indexar/escribir)
export const algoliaClient = algoliasearch(appId, apiKey);
export const productsIndex = algoliaClient.initIndex(indexName);

// Search key para búsquedas públicas
export const searchKey = process.env.ALGOLIA_SEARCH_KEY || '';
export const algoliaAppId = appId;
export { indexName };
