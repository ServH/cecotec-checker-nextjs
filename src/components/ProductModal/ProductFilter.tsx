import React from 'react';
import { ProductFilterProps } from './types';

export const ProductFilter: React.FC<ProductFilterProps> = ({
  activeFilters,
  setActiveFilters,
  resetFilters
}) => {
  return (
    <div className="column is-12 product-filters-panel">
      <div className="box product-filters-container">
        <div className="columns is-multiline">
          {/* Filtro por estado de stock */}
          <div className="column is-12-mobile is-4-tablet">
            <div className="field">
              <label className="label is-small">Estado de stock</label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select 
                    value={activeFilters.stockType}
                    onChange={(e) => setActiveFilters({
                      ...activeFilters, 
                      stockType: e.target.value
                    })}
                  >
                    <option value="all">Todos</option>
                    <option value="in-stock">En stock</option>
                    <option value="low-stock">Stock bajo</option>
                    <option value="out-of-stock">Sin stock</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtro por rango de precio */}
          <div className="column is-12-mobile is-4-tablet">
            <div className="field">
              <label className="label is-small">Rango de precio</label>
              <div className="control">
                <div className="price-range-container">
                  <input 
                    type="number" 
                    className="input is-small" 
                    placeholder="Min €" 
                    min="0"
                    value={activeFilters.minPrice || ''}
                    onChange={(e) => setActiveFilters({
                      ...activeFilters, 
                      minPrice: e.target.value ? parseFloat(e.target.value) : null
                    })}
                  />
                  <span className="px-2">-</span>
                  <input 
                    type="number" 
                    className="input is-small" 
                    placeholder="Max €" 
                    min="0"
                    value={activeFilters.maxPrice || ''}
                    onChange={(e) => setActiveFilters({
                      ...activeFilters, 
                      maxPrice: e.target.value ? parseFloat(e.target.value) : null
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Ordenar por */}
          <div className="column is-12-mobile is-4-tablet">
            <div className="field">
              <label className="label is-small">Ordenar por</label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    value={activeFilters.sortBy}
                    onChange={(e) => setActiveFilters({
                      ...activeFilters, 
                      sortBy: e.target.value
                    })}
                  >
                    <option value="name-asc">Nombre (A-Z)</option>
                    <option value="name-desc">Nombre (Z-A)</option>
                    <option value="price-asc">Precio (menor a mayor)</option>
                    <option value="price-desc">Precio (mayor a menor)</option>
                    <option value="stock-desc">Mayor stock</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Acciones de filtro */}
        <div className="field is-grouped is-grouped-right mt-3">
          <div className="control">
            <button className="button is-light is-small" onClick={resetFilters}>
              <span className="icon is-small">
                <i className="fas fa-undo"></i>
              </span>
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};