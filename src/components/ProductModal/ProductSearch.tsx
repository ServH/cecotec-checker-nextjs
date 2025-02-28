import React from 'react';
import { ProductSearchProps } from './types';

export const ProductSearch: React.FC<ProductSearchProps & { 
  onToggleFilters: () => void
}> = ({
  searchTerm,
  setSearchTerm,
  onToggleFilters
}) => {
  return (
    <div className="is-flex is-flex-direction-row">
      <div className="field has-addons mr-2">
        <div className="control has-icons-left">
          <input 
            className="input" 
            type="text" 
            placeholder="Buscar productos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="icon is-small is-left">
            <i className="fas fa-search"></i>
          </span>
        </div>
        <div className="control">
          <button className="button is-primary">
            Buscar
          </button>
        </div>
      </div>
      <button 
        className="button is-light" 
        onClick={onToggleFilters}
      >
        <span className="icon">
          <i className="fas fa-filter"></i>
        </span>
        <span>Filtros</span>
      </button>
    </div>
  );
};