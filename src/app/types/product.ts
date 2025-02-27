export interface Product {
    id?: string;
    name: string;
    slug: string;
    title?: string;
    reference?: string;
    upc?: string;
    sku?: string;
    price?: number;
    stock?: number | null;
    availableStock?: number | null;
    pricing?: {
      originalPrice?: number;
      isInStock?: number | boolean;
    };
    media?: {
      mainImages?: string[];
    };
    images?: string[];
    image?: string;
    error?: boolean;
    message?: string;
    fallback?: boolean;
    fallbackMessage?: string;
  }