'use client'

import React, { useState } from 'react';
import { Category } from '@/app/types/category';
import { ProductModal } from './ProductModal';

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determinar clases y textos según el estado
  const statusClass = `status-${category.status?.toLowerCase() || 'error'}`;
  
  let statusText = '';
  if (category.status === 'OK') {
    statusText = `✅ ${Array.isArray(category.products) ? category.products.length : 0} Productos`;
  } else if (category.status === 'KO') {
    statusText = '❌ Sin productos';
  } else {
    statusText = `⚠️ ${category.error || 'Error'}`;
  }

  const isSlowResponse = category.responseTime && category.responseTime > 500;
  
  // Obtener slugs de productos
  const productSlugs = Array.isArray(category.products) 
    ? category.products.map(p => typeof p === 'string' ? p : p.slug)
    : [];

  return (
    <>
      <div className="column is-3">
        <div className="card">
          <header className={`card-header ${statusClass}`}>
            <p className="card-header-title">{category.name}</p>
          </header>
          <div className="card-content">
            <div className="content">
              <p><strong>Categoría padre:</strong> {category.parent || 'N/A'}</p>
              <p><strong>Slug:</strong> {category.slug}</p>
              <p><strong>Estado:</strong> {statusText}</p>
              <p>
                <strong>Tiempo:</strong> 
                <span className={isSlowResponse ? 'has-text-danger' : ''}>
                  {category.responseTime}ms
                </span> 
                {isSlowResponse && (
                  <span className="icon is-small has-text-danger">
                    <i className="fas fa-exclamation-circle"></i>
                  </span>
                )}
              </p>
            </div>
          </div>
          {category.status === 'OK' && productSlugs.length > 0 && (
            <div className="card-footer">
              <a 
                className="card-footer-item view-products"
                onClick={() => setIsModalOpen(true)}
              >
                <span className="icon is-small mr-1">
                  <i className="fas fa-box-open"></i>
                </span>
                Ver {productSlugs.length} productos
              </a>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de productos */}
      <ProductModal
        isActive={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categorySlug={category.slug}
        categoryName={category.name}
        productSlugs={productSlugs}
      />
    </>
  );
};