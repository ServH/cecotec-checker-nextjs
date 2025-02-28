import { Product } from '@/app/types/product';

export interface ProductModalProps {
  isActive: boolean;
  onClose: () => void;
  categorySlug: string;
  categoryName: string;
  productSlugs: string[];
}

export interface ProductCardProps {
  product: Product;
  expanded: boolean;
}

export interface ProductFilterProps {
  activeFilters: {
    stockType: string;
    minPrice: number | null;
    maxPrice: number | null;
    sortBy: string;
  };
  setActiveFilters: (filters: {
    stockType: string;
    minPrice: number | null;
    maxPrice: number | null;
    sortBy: string;
  }) => void;
  resetFilters: () => void;
}

export interface ProductSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export interface DragHintProps {
  show: boolean;
  onDismiss: () => void;
}

export interface LoadMoreProps {
  isLoading: boolean;
  hasMore: boolean;
  loaderRef: React.RefObject<HTMLDivElement>;
}