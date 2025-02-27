import React from 'react';
import { CategoryStats } from "@/app/types/category";
import { StatCard } from './StatCard';
import { FilterIndicator } from './FilterIndicator';

interface StatsSectionProps {
  stats: CategoryStats;
  activeFilter: 'ALL' | 'OK' | 'KO' | 'ERROR';
  setActiveFilter: (filter: 'ALL' | 'OK' | 'KO' | 'ERROR') => void;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ 
  stats, 
  activeFilter, 
  setActiveFilter 
}) => {
  const statCards = [
    { 
      id: 'statTotalCard', 
      status: 'ALL' as const, 
      label: 'Todas las categorías', 
      icon: 'tags', 
      value: stats.total, 
      color: 'has-background-primary has-text-white' 
    },
    { 
      id: 'statProductsCard', 
      status: 'OK' as const, 
      label: 'Con productos', 
      icon: 'check-circle', 
      value: stats.withProducts, 
      color: 'has-background-success has-text-white' 
    },
    { 
      id: 'statEmptyCard', 
      status: 'KO' as const, 
      label: 'Sin productos', 
      icon: 'exclamation-triangle', 
      value: stats.withoutProducts, 
      color: 'has-background-warning' 
    },
    { 
      id: 'statErrorsCard', 
      status: 'ERROR' as const, 
      label: 'Con errores', 
      icon: 'times-circle', 
      value: stats.errors, 
      color: 'has-background-danger has-text-white' 
    }
  ];

  return (
    <div id="statsSection" className="mb-5">
      <div className="is-flex is-justify-content-space-between is-align-items-center mb-3">
        <h3 className="title is-4 mb-0">Resumen de Categorías</h3>
        <div className="tags has-addons">
          <span className="tag is-dark">
            <span className="icon"><i className="fas fa-clock"></i></span>
          </span>
          <span className="tag is-info" id="executionTime">{stats.executionTime}ms</span>
        </div>
      </div>
      <p className="mb-4 is-size-6 has-text-grey">Haz clic en cualquier tarjeta para filtrar los resultados</p>
      
      <div className="columns">
        {statCards.map((card) => (
          <StatCard 
            key={card.id}
            id={card.id}
            status={card.status}
            label={card.label}
            icon={card.icon}
            value={card.value}
            color={card.color}
            isActive={activeFilter === card.status}
            onClick={() => setActiveFilter(card.status)}
          />
        ))}
      </div>
      
      {activeFilter !== 'ALL' && (
        <FilterIndicator 
          filter={activeFilter}
          label={statCards.find(c => c.status === activeFilter)?.label || ''}
          icon={statCards.find(c => c.status === activeFilter)?.icon || ''}
          onClear={() => setActiveFilter('ALL')}
        />
      )}
    </div>
  );
};