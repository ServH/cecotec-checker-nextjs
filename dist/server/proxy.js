"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/proxy.ts
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const redis_1 = require("redis");
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Configuración CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});
// Cliente axios
const apiClient = axios_1.default.create({
    baseURL: "https://cecotec.es/api/v1",
    timeout: 50000,
    headers: {
        'Accept': 'application/json',
        'User-Agent': 'CecotecValidator/1.0'
    },
    httpAgent: new http_1.default.Agent({ keepAlive: true }),
    httpsAgent: new https_1.default.Agent({ keepAlive: true })
});
// Configuración Redis
const redisClient = (0, redis_1.createClient)({
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
    }
});
// Variables de configuración
const CACHE_TTL = 60 * 60 * 24; // 24 horas
const CONCURRENCY_LIMIT = 5;
const MAX_RETRIES = 2;
// Event listeners de Redis
redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});
redisClient.on('reconnecting', () => {
    console.log('Redis: Intentando reconectar...');
});
redisClient.on('connect', () => {
    console.log('Redis: Conexión establecida');
});
// Inicialización asíncrona de Redis
(async () => {
    try {
        await redisClient.connect();
        console.log('Redis conectado correctamente');
    }
    catch (err) {
        console.error('Error al conectar con Redis:', err);
    }
})();
// Función para hacer peticiones con reintentos
const withRetry = async (requestFn, maxRetries = MAX_RETRIES) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await requestFn();
        }
        catch (error) {
            lastError = error;
            // Si es el último intento, no esperamos
            if (attempt === maxRetries)
                break;
            // Esperar un tiempo exponencial entre reintentos (exponential backoff)
            const delay = Math.pow(2, attempt) * 200;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};
// Función recursiva para aplanar todas las categorías hijas, con caché de Redis
const flattenCategories = async (categories, parentName = "") => {
    var _a;
    let flattened = [];
    for (const category of categories) {
        if (category.children && category.children.length > 0) {
            flattened = flattened.concat(await flattenCategories(category.children, category.name));
        }
        else {
            try {
                // Clave para Redis con prefijo y normalización
                const cacheKey = `category:${category.slug.toLowerCase()}`;
                let categoryData = null;
                // Intentar obtener de caché primero
                try {
                    const cachedData = await redisClient.get(cacheKey);
                    if (cachedData) {
                        // Caché hit: Usar datos de Redis
                        categoryData = JSON.parse(cachedData);
                        categoryData.parent = parentName; // Asegurar que el padre está actualizado
                        categoryData.fromCache = true; // Marcar que viene de caché
                    }
                }
                catch (redisError) {
                    console.warn(`Error al acceder a Redis para ${category.slug}:`, redisError.message);
                    // Continuamos sin usar caché si hay error
                }
                // Si no hay datos en caché, hacer petición a la API
                if (!categoryData) {
                    const startTime = Date.now();
                    // Hacer petición con reintentos
                    const response = await withRetry(() => apiClient.get(`/categories/${category.slug}/`));
                    const hasProducts = ((_a = response.data.products) === null || _a === void 0 ? void 0 : _a.length) > 0;
                    categoryData = {
                        id: category.id,
                        parent: parentName,
                        name: category.name,
                        slug: category.slug,
                        status: hasProducts ? "OK" : "KO",
                        products: response.data.products || [],
                        responseTime: Date.now() - startTime,
                        fromCache: false
                    };
                    // Guardar en Redis con tiempo de expiración
                    try {
                        await redisClient.set(cacheKey, JSON.stringify(categoryData), {
                            EX: CACHE_TTL
                        });
                    }
                    catch (redisError) {
                        console.warn(`Error al guardar en Redis para ${category.slug}:`, redisError.message);
                        // Continuamos incluso si no podemos guardar en caché
                    }
                }
                flattened.push(categoryData);
            }
            catch (error) {
                const responseTime = error.startTime ? Date.now() - error.startTime : 0;
                console.error(`Error checking category ${category.slug}:`, error.message);
                flattened.push({
                    id: category.id,
                    parent: parentName,
                    name: category.name,
                    slug: category.slug,
                    status: "ERROR",
                    error: error.message,
                    responseTime: responseTime
                });
            }
        }
    }
    return flattened;
};
// Procesa categorías con control de concurrencia mejorado
const processWithConcurrencyLimit = async (categories, limit = CONCURRENCY_LIMIT) => {
    const results = [];
    const totalBatches = Math.ceil(categories.length / limit);
    for (let i = 0; i < categories.length; i += limit) {
        const batch = categories.slice(i, i + limit);
        const currentBatch = Math.floor(i / limit) + 1;
        console.log(`Procesando lote ${currentBatch}/${totalBatches} (${batch.length} categorías)`);
        try {
            const batchResults = await Promise.all(batch.map(category => flattenCategories([category])));
            results.push(...batchResults.flat());
            console.log(`Lote ${currentBatch}/${totalBatches} completado`);
        }
        catch (error) {
            console.error(`Error en lote ${currentBatch}:`, error);
            // Continuamos con el siguiente lote incluso si hay error
        }
    }
    return results;
};
// API endpoint optimizado
app.get("/check-all-categories", async (req, res) => {
    const startTime = Date.now();
    try {
        // 1. Intentar obtener categorías principales (con reintentos)
        const mainCategoriesResponse = await withRetry(() => apiClient.get("/categories"));
        // 2. Aplanar todas las categorías hijas con caché
        const allCategories = await flattenCategories(mainCategoriesResponse.data);
        // 3. Verificar categorías con concurrencia controlada
        const results = await processWithConcurrencyLimit(allCategories);
        // 4. Calcular estadísticas
        const cacheHits = results.filter(r => r.fromCache).length;
        const stats = {
            total: results.length,
            withProducts: results.filter(r => r.status === "OK").length,
            withoutProducts: results.filter(r => r.status === "KO").length,
            errors: results.filter(r => r.status === "ERROR").length,
            cacheHits: cacheHits,
            cacheMisses: results.length - cacheHits,
            executionTime: Date.now() - startTime,
        };
        res.json({ stats, results });
    }
    catch (error) {
        console.error("Error en check-all-categories:", error);
        res.status(500).json({
            error: "Error en el servidor",
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
// Endpoint para obtener detalles de un producto específico
app.get("/product-details/:slug", async (req, res) => {
    const productSlug = req.params.slug;
    const forceRefresh = req.query.force === 'true';
    try {
        // Clave para Redis
        const cacheKey = `product:${productSlug}`;
        // Solo buscar en caché si no se solicita una actualización forzada
        if (!forceRefresh) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    const parsedData = JSON.parse(cachedData);
                    return res.json(parsedData);
                }
            }
            catch (redisError) {
                console.warn(`Error al acceder a Redis para ${productSlug}:`, redisError.message);
            }
        }
        else {
            console.log(`Solicitud de actualización forzada para ${productSlug}`);
        }
        // Configurar diferentes endpoints y configuraciones para probar
        const endpoints = [
            {
                url: `https://content.cecotec.es/api/v1/products/${productSlug}/`,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'CecotecValidator/1.0'
                }
            },
            {
                url: `https://cecotec.es/api/v1/products/${productSlug}/`,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'CecotecValidator/1.0'
                }
            },
            {
                url: `https://content.cecotec.es/api/v1/products/${productSlug}/`,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://cecotec.es/',
                    'Origin': 'https://cecotec.es'
                }
            },
            {
                url: `https://cecotec.es/api/v1/products/${productSlug}/`,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://cecotec.es/',
                    'Origin': 'https://cecotec.es'
                }
            }
        ];
        // Variable para almacenar el último error
        let lastError = null;
        // Probar cada endpoint hasta que uno funcione
        for (const endpoint of endpoints) {
            try {
                console.log(`Intentando con URL: ${endpoint.url}`);
                console.log('Headers:', JSON.stringify(endpoint.headers));
                const response = await axios_1.default.get(endpoint.url, {
                    headers: endpoint.headers,
                    timeout: 30000,
                    maxRedirects: 5 // Permitir redirecciones
                });
                if (response.status === 200 && response.data) {
                    console.log(`✅ Éxito con URL: ${endpoint.url}`);
                    // Asegurarse de que tengamos información de stock
                    let productData = response.data;
                    // Normalizar la estructura de datos del stock si existe
                    if (productData.stock !== undefined) {
                        // Si ya existe la propiedad stock, la preservamos
                    }
                    else if (productData.pricing && typeof productData.pricing.isInStock === 'number') {
                        // Si isInStock contiene un número que representa cantidades, lo asignamos a stock
                        productData.stock = productData.pricing.isInStock;
                    }
                    else if (productData.availableStock !== undefined) {
                        // Algunas APIs pueden usar availableStock
                        productData.stock = productData.availableStock;
                    }
                    else {
                        // Si no hay información clara de stock, intentamos extraerla de otros campos
                        // o establecer un valor por defecto basado en si está "en stock" o no
                        if (productData.pricing && productData.pricing.isInStock === true) {
                            productData.stock = 100; // Valor por defecto si solo sabemos que está en stock
                        }
                        else if (productData.pricing && productData.pricing.isInStock === false) {
                            productData.stock = 0;
                        }
                        else {
                            productData.stock = null; // No tenemos información
                        }
                    }
                    // Guardar en Redis (solo si no es una actualización forzada)
                    if (!forceRefresh) {
                        try {
                            await redisClient.set(cacheKey, JSON.stringify(productData), {
                                EX: 3600 // 1 hora de caché
                            });
                        }
                        catch (redisError) {
                            console.warn(`Error al guardar en Redis para ${productSlug}:`, redisError.message);
                        }
                    }
                    // Añadir información sobre qué endpoint funcionó (para diagnóstico)
                    const responseWithMeta = Object.assign(Object.assign({}, productData), { _meta: {
                            source: endpoint.url,
                            fetchedAt: new Date().toISOString(),
                            forced: forceRefresh
                        } });
                    return res.json(responseWithMeta);
                }
            }
            catch (error) {
                console.warn(`❌ Error con URL ${endpoint.url}: ${error.message}`);
                lastError = error;
                // Continuar con el siguiente endpoint
            }
        }
        // Si llegamos aquí, ningún endpoint funcionó
        console.error(`No se pudo obtener el producto ${productSlug} con ninguna configuración`);
        // Intentar resolver con datos de fallback
        try {
            // Buscar productos similares en la lista general (esto requiere tener un endpoint para listar productos)
            console.log(`Buscando productos similares para ${productSlug}...`);
            const categoryMatch = productSlug.split('-')[0]; // Extraer primera parte del slug (nombre del producto)
            const productsListUrl = "https://content.cecotec.es/api/v1/products/?limit=50";
            const productsResponse = await axios_1.default.get(productsListUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            if (productsResponse.status === 200 && productsResponse.data.results) {
                // Buscar un producto similar
                const similarProducts = productsResponse.data.results.filter((p) => p.slug && p.slug.includes(categoryMatch));
                if (similarProducts.length > 0) {
                    console.log(`Encontrados ${similarProducts.length} productos similares`);
                    // Usar el primero como fallback
                    const fallbackProduct = Object.assign(Object.assign({}, similarProducts[0]), { slug: productSlug, stock: similarProducts[0].stock || 0, _meta: {
                            fallback: true,
                            originalSlug: similarProducts[0].slug,
                            message: "Producto original no encontrado. Mostrando datos aproximados.",
                            fetchedAt: new Date().toISOString()
                        } });
                    // Guardar en Redis con tiempo de vida reducido
                    try {
                        await redisClient.set(cacheKey, JSON.stringify(fallbackProduct), {
                            EX: 3600 // 1 hora
                        });
                    }
                    catch (redisError) {
                        console.warn(`Error al guardar fallback en Redis:`, redisError.message);
                    }
                    return res.json(fallbackProduct);
                }
            }
        }
        catch (fallbackError) {
            console.warn(`Error al buscar productos similares:`, fallbackError);
        }
        // Si no se encuentran datos, devolver un objeto de error con formato consistente
        const formattedProductName = productSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        const errorData = {
            error: true,
            message: lastError ? `No se pudo obtener el producto: ${lastError.message}` : "Producto no encontrado",
            slug: productSlug,
            name: formattedProductName,
            timestamp: Date.now(),
            stock: 0, // Establecer stock en 0 para productos no encontrados
            pricing: {
                originalPrice: null,
                isInStock: 0 // Producto no encontrado = sin stock
            },
            media: {
                mainImages: [] // Array vacío para evitar errores en el frontend
            },
            _meta: {
                triedEndpoints: endpoints.map(e => e.url),
                lastError: lastError ? lastError.message : null
            }
        };
        // Guardar el error en Redis para evitar intentos repetidos
        try {
            await redisClient.set(cacheKey, JSON.stringify(errorData), {
                EX: 1800 // 30 minutos para los errores
            });
        }
        catch (redisError) {
            console.warn(`Error al guardar error en Redis:`, redisError);
        }
        // Devolver error pero con código 200 para que el frontend lo maneje adecuadamente
        return res.status(200).json(errorData);
    }
    catch (error) {
        console.error(`Error general obteniendo detalles del producto ${productSlug}:`, error.message);
        // Devolver un objeto de error con formato consistente
        res.status(200).json({
            error: true,
            message: `Error del servidor: ${error.message}`,
            slug: productSlug,
            name: productSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            timestamp: Date.now(),
            stock: 0, // Añadir propiedad de stock
            pricing: {
                originalPrice: null,
                isInStock: 0
            },
            media: {
                mainImages: []
            }
        });
    }
});
// Endpoint para verificar el estado de Redis
app.get("/health", async (req, res) => {
    try {
        // Comprobar Redis
        const redisStatus = await redisClient.ping();
        res.json({
            status: "UP",
            redis: redisStatus === 'PONG' ? "Connected" : "Disconnected",
            uptime: process.uptime(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: "DEGRADED",
            redis: "Error",
            error: error.message
        });
    }
});
// Iniciar servidor
app.listen(PORT, () => {
    console.log("=====================================================");
    console.log(`🚀 Proxy activo en http://localhost:${PORT}`);
    console.log(`📊 Comprobación de categorías: http://localhost:${PORT}/check-all-categories`);
    console.log(`🔄 Estado del servicio: http://localhost:${PORT}/health`);
    console.log("=====================================================");
});
// Manejo de señal de terminación
process.on('SIGTERM', async () => {
    console.log('Cerrando servidor y conexiones...');
    await redisClient.quit();
    process.exit(0);
});
