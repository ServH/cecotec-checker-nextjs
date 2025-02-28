import { Product } from '@/app/types/product';

export interface Filters {
  stockType: string;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: string;
}

export const filterProducts = (
  products: Product[],
  searchTerm: string,
  filters: Filters
): Product[] => {
  return products.filter(product => {
    // Filtrar por término de búsqueda
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtrar por stock
    if (filters.stockType !== 'all') {
      const stockQuantity = product.stock ?? 
                          (product.pricing?.isInStock as number) ?? 
                          product.availableStock;
      
      const isLowStock = stockQuantity !== null && stockQuantity > 0 && stockQuantity < 50;
      const isInStock = stockQuantity !== null && stockQuantity > 0 && !isLowStock;
      const isOutOfStock = stockQuantity !== null && stockQuantity <= 0;
      
      if (filters.stockType === 'in-stock' && !isInStock) return false;
      if (filters.stockType === 'low-stock' && !isLowStock) return false;
      if (filters.stockType === 'out-of-stock' && !isOutOfStock) return false;
    }
    
    // Filtrar por precio
    if (filters.minPrice !== null || filters.maxPrice !== null) {
      const price = product.pricing?.originalPrice ?? product.price;
      
      if (typeof price === 'number' || typeof price === 'string') {
        const numericPrice = typeof price === 'string' 
          ? parseFloat(price) 
          : price;
        
        if (filters.minPrice !== null && numericPrice < filters.minPrice) {
          return false;
        }
        
        if (filters.maxPrice !== null && numericPrice > filters.maxPrice) {
          return false;
        }
      }
    }
    
    return true;
  });
};

export const sortProducts = (products: Product[], sortBy: string): Product[] => {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'price-asc':
    case 'price-desc':
      sorted.sort((a, b) => {
        const priceA = a.pricing?.originalPrice ?? a.price ?? 0;
        const priceB = b.pricing?.originalPrice ?? b.price ?? 0;
        
        const numericPriceA = typeof priceA === 'string' ? parseFloat(priceA) : priceA;
        const numericPriceB = typeof priceB === 'string' ? parseFloat(priceB) : priceB;
        
        return sortBy === 'price-asc' 
          ? numericPriceA - numericPriceB 
          : numericPriceB - numericPriceA;
      });
      break;
    case 'stock-desc':
      sorted.sort((a, b) => {
        const stockA = a.stock ?? (a.pricing?.isInStock as number) ?? a.availableStock ?? 0;
        const stockB = b.stock ?? (b.pricing?.isInStock as number) ?? b.availableStock ?? 0;
        
        return stockB - stockA;
      });
      break;
  }
  
  return sorted;
};