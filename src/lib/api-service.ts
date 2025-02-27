// En src/lib/api-service.ts
import axios from 'axios';
import { Category } from '@/app/types/category';
import { Product } from '@/app/types/product';

// Caché local para productos
const productCache: Record<string, { data: Product, timestamp: number }> = {};
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutos

// Función para obtener todas las categorías
export async function fetchCategories(): Promise<{
  results: Category[];
  stats: any;
}> {
  try {
    const response = await axios.get('/api/check-all-categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Función para obtener los detalles de un producto
export async function fetchProductDetails(slug: string, force: boolean = false): Promise<Product> {
  try {
    // Verificar caché si no estamos forzando la recarga
    if (!force && productCache[slug] && (Date.now() - productCache[slug].timestamp < CACHE_EXPIRY)) {
      console.log(`Using cached data for product ${slug}`);
      return productCache[slug].data;
    }
    
    console.log(`Fetching product details for ${slug}`);
    const url = force 
      ? `/api/product-details/${slug}?force=true`
      : `/api/product-details/${slug}`;
    
    const response = await axios.get(url, { 
      timeout: 60000,
      timeoutErrorMessage: `Timeout al cargar el producto ${slug}` 
    });
    
    console.log(`Successfully fetched product ${slug}`);
    
    // Guardar en caché
    productCache[slug] = {
      data: response.data,
      timestamp: Date.now()
    };
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${slug}:`, error);
    
    // Devolver un producto de error para que la UI pueda mostrarlo
    const formattedName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      name: formattedName,
      slug,
      error: true,
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}