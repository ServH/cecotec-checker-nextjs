import { Product } from '@/app/types/product';

export const loadSavedOrder = (
  products: Product[], 
  categorySlug: string
): Product[] => {
  try {
    const savedOrder = localStorage.getItem(`productOrder_${categorySlug}`);
    if (!savedOrder) return products;
    
    const orderSlugs = JSON.parse(savedOrder) as string[];
    
    // Verificar si los slugs guardados coinciden con los productos cargados
    const allSlugsExist = orderSlugs.every(slug => 
      products.some(p => p.slug === slug)
    );
    
    if (!allSlugsExist) return products;
    
    // Crear una copia ordenada de los productos
    const orderedProducts = [...products];
    
    // Crear un mapa de posiciones
    const slugPositions: {[key: string]: number} = {};
    orderSlugs.forEach((slug, index) => {
      slugPositions[slug] = index;
    });
    
    // Ordenar el array según las posiciones guardadas
    orderedProducts.sort((a, b) => {
      const posA = slugPositions[a.slug] ?? Number.MAX_SAFE_INTEGER;
      const posB = slugPositions[b.slug] ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });
    
    // Retornar solo si el orden es diferente
    if (JSON.stringify(orderedProducts.map(p => p.slug)) !== 
        JSON.stringify(products.map(p => p.slug))) {
      return orderedProducts;
    }
  } catch (e) {
    console.warn('Error al cargar orden guardado:', e);
  }
  
  return products;
};

export const getDragHintDismissed = (): boolean => {
  try {
    return localStorage.getItem('dragDropHintDismissed') === 'true';
  } catch (e) {
    console.warn('Error accediendo a localStorage:', e);
    return false;
  }
};

export const setDragHintDismissed = (dismissed: boolean): void => {
  try {
    localStorage.setItem('dragDropHintDismissed', dismissed ? 'true' : 'false');
  } catch (e) {
    console.warn('Error guardando preferencia:', e);
  }
};