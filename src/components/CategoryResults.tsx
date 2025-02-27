import React from 'react';
import { Category } from '@/app/types/category';
import { CategoryCard } from './CategoryCard';

interface CategoryResultsProps {
  categories: Category[];
  activeFilter: 'ALL' | 'OK' | 'KO' | 'ERROR';
}

export const CategoryResults: React.FC<CategoryResultsProps> = ({
  categories,
  activeFilter,
}) => {
  // Filtrar categorías según el filtro activo
  const filteredCategories = categories.filter(
    cat => activeFilter === 'ALL' || cat.status === activeFilter
  );

  return (
    <div className="columns is-multiline results-container">
      {filteredCategories.map(category => (
        <CategoryCard key={category.slug} category={category} />
      ))}
    </div>
  );
};