'use client'

import { useState } from 'react';
import { fetchCategories } from '@/lib/api-service';
import { Category, CategoryStats } from '@/app/types/category';
import { ActionButton } from '@/components/ActionButton';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { StatsSection } from '@/components/StatsSection';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { CategoryResults } from '@/components/CategoryResults';
import '../styles/styles.css';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OK' | 'KO' | 'ERROR'>('ALL');

  const checkCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchCategories();
      setCategories(response.results);
      setStats(response.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Hero Section (Header) */}
      <section className="hero hero-section has-text-centered has-text-white">
        <div className="hero-body">
          <h1 className="title is-2 app-title has-text-white">🔍 Validador de Categorías Cecotec</h1>
          <p className="subtitle has-text-white-bis">Herramienta para verificar el estado y disponibilidad de productos en todas las categorías de Cecotec</p>
        </div>
      </section>
      
      {/* Action Card (Button Section) */}
      <div className="action-section">
        <div className="card action-card">
          <div className="card-content has-text-centered">
            <p className="mb-4">Inicia el análisis para comprobar qué categorías tienen productos disponibles</p>
            <ActionButton 
              onClick={checkCategories}
              isLoading={isLoading}
              text="Analizar Categorías"
              icon="search"
            />
          </div>
        </div>
      </div>
      
      {/* Loading Indicator */}
      {isLoading && <LoadingIndicator />}
      
      {/* Stats Section */}
      {stats && (
        <StatsSection 
          stats={stats} 
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
      )}
      
      {/* Error Display */}
      {error && (
        <ErrorDisplay 
          message={error}
          onRetry={checkCategories}
        />
      )}
      
      {/* Results Section */}
      {categories.length > 0 && !isLoading && (
        <CategoryResults 
          categories={categories}
          activeFilter={activeFilter}
        />
      )}
    </div>
  );
}