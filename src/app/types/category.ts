import { Product } from './product';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: string;
  children?: Category[];
  status?: 'OK' | 'KO' | 'ERROR';
  products?: string[] | Product[];
  responseTime?: number;
  error?: string;
  fromCache?: boolean;
}

export interface CategoryStats {
  total: number;
  withProducts: number;
  withoutProducts: number;
  errors: number;
  cacheHits?: number;
  cacheMisses?: number;
  executionTime: number;
}