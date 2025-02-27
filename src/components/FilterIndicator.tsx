// src/components/FilterIndicator.tsx
import React from 'react';

interface FilterIndicatorProps {
  filter: 'ALL' | 'OK' | 'KO' | 'ERROR';
  label: string;
  icon: string;
  onClear: () => void;
}

export const FilterIndicator: React.FC<FilterIndicatorProps> = ({
  filter,
  label,
  icon,
  onClear,
}) => {
  // Determinar la clase de color según el filtro
  const colorClass = {
    'OK': 'is-success',
    'KO': 'is-warning',
    'ERROR': 'is-danger',
    'ALL': 'is-info'
  }[filter];

  return (
    <div className={`notification ${colorClass} is-light filter-message`}>
      <div>
        <span className="icon">
          <i className={`fas fa-${icon}`}></i>
        </span>
        <span>Mostrando: <strong>{label}</strong></span>
      </div>
      <button 
        className={`button is-small ${colorClass} is-inverted`}
        onClick={onClear}
      >
        <span className="icon is-small">
          <i className="fas fa-times"></i>
        </span>
        <span>Quitar filtro</span>
      </button>
    </div>
  );
};