'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { fetchProductDetails } from '@/lib/api-service';
import { Product } from '@/app/types/product';
import { ProductCard } from './ProductCard';
import { ProductFilter } from './ProductFilter';
import { ProductSearch } from './ProductSearch';
import { ProductDragHint } from './ProductDragHint';
import { LoadMoreIndicator } from './LoadMoreIndicator';
import { ProductSkeleton } from './ProductSkeleton';
import { ProductModalProps } from './types';
import { initSortable, saveProductOrder, showOrderSuccessMessage } from './utils/sortable';
import { filterProducts, sortProducts } from './utils/filters';
import { loadSavedOrder, getDragHintDismissed, setDragHintDismissed } from './utils/storage';

export const ProductModal: React.FC<ProductModalProps> = ({
  isActive,
  onClose,
  categorySlug,
  categoryName,
  productSlugs
}) => {
  // Estado
  const [isExpanded, setIsExpanded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDragHint, setShowDragHint] = useState(true);
  const [activeFilters, setActiveFilters] = useState({
    stockType: 'all',
    minPrice: null as number | null,
    maxPrice: null as number | null,
    sortBy: 'name-asc'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Referencias
  const loaderRef = useRef<HTMLDivElement>(null);
  const productsContainerRef = useRef<HTMLDivElement>(null);
  const sortableInstance = useRef<Sortable | null>(null);
  const productsPerPage = 10;

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return (
      activeFilters.stockType !== 'all' ||
      activeFilters.minPrice !== null ||
      activeFilters.maxPrice !== null ||
      activeFilters.sortBy !== 'name-asc'
    );
  }, [activeFilters]);

  // Reset estado cuando cambia el modal o categoría
  useEffect(() => {
    if (isActive) {
      setHasMore(true);
      setPage(0);
      setProducts([]);
      setError(null);
      setIsLoading(false);
      setSearchTerm('');
      setActiveFilters({
        stockType: 'all',
        minPrice: null,
        maxPrice: null,
        sortBy: 'name-asc'
      });
      
      // Verificar si debemos mostrar la pista de drag & drop
      setShowDragHint(!getDragHintDismissed());
    }
  }, [isActive, categorySlug]);

  // Cargar productos iniciales cuando se abre el modal
  useEffect(() => {
    if (isActive && productSlugs.length > 0 && products.length === 0) {
      loadMoreProducts();
    }
  }, [isActive, productSlugs, products.length]);

  // Función para cargar más productos
  const loadMoreProducts = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    const start = page * productsPerPage;
    const end = start + productsPerPage;
    
    // No hay más productos para cargar
    if (start >= productSlugs.length) {
      setHasMore(false);
      return;
    }
    
    const slugsToLoad = productSlugs.slice(start, end);
    if (slugsToLoad.length === 0) {
      setHasMore(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Cargando productos ${start} a ${end}`);
      
      const loadedProducts = await Promise.all(
        slugsToLoad.map(async (slug) => {
          try {
            return await fetchProductDetails(slug);
          } catch (err) {
            console.error(`Error al cargar el producto ${slug}:`, err);
            return {
              name: slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
              slug,
              error: true,
              message: err instanceof Error ? err.message : 'Error desconocido'
            };
          }
        })
      );
      
      setProducts(prev => [...prev, ...loadedProducts]);
      setPage(prevPage => prevPage + 1);
      
      // Verificar si hay más productos para cargar
      setHasMore(end < productSlugs.length);
      
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, productSlugs, productsPerPage]);

  // Inicializar Sortable.js cuando se carguen productos
  useEffect(() => {
    if (isActive && productsContainerRef.current && products.length > 0 && !searchTerm) {
      // Destruir instancia previa si existe
      if (sortableInstance.current) {
        sortableInstance.current.destroy();
      }
      
      // Inicializar sortable
      sortableInstance.current = initSortable(
        productsContainerRef.current, 
        () => {
          setIsDragging(true);
          document.body.classList.add('dragging-active');
        },
        () => {
          setIsDragging(false);
          document.body.classList.remove('dragging-active');
          
          // Guardar el nuevo orden
          if (productsContainerRef.current) {
            saveProductOrder(
              productsContainerRef.current, 
              products, 
              categorySlug, 
              setProducts
            );
            showOrderSuccessMessage();
          }
        },
        searchTerm.length > 0
      );
    }
    
    return () => {
      // Limpieza cuando el componente se desmonta
      if (sortableInstance.current) {
        sortableInstance.current.destroy();
        sortableInstance.current = null;
      }
    };
  }, [isActive, products, searchTerm, categorySlug]);

  // Configuración del Intersection Observer para el scroll infinito
  useEffect(() => {
    if (!isActive) return;
    
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading && hasMore) {
        loadMoreProducts();
      }
    }, options);
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [isActive, isLoading, hasMore, loadMoreProducts]);

  // Cargar orden guardado si existe
  useEffect(() => {
    if (isActive && products.length > 0 && !isLoading) {
      const orderedProducts = loadSavedOrder(products, categorySlug);
      if (orderedProducts !== products) {
        setProducts(orderedProducts);
      }
    }
  }, [isActive, products.length, isLoading, categorySlug, products]);

  // Obtener productos filtrados y ordenados
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = filterProducts(products, searchTerm, activeFilters);
    return sortProducts(filtered, activeFilters.sortBy);
  }, [products, searchTerm, activeFilters]);

  // Resetear filtros
  const resetFilters = () => {
    setActiveFilters({
      stockType: 'all',
      minPrice: null,
      maxPrice: null,
      sortBy: 'name-asc'
    });
  };

  // Cerrar el mensaje de instrucciones de drag & drop
  const dismissDragHint = () => {
    setShowDragHint(false);
    setDragHintDismissed(true);
  };

  // Manejar cierre del modal con tecla ESC
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        onClose();
      }
      
      // Cambiar tamaño con tecla E
      if ((e.key === 'e' || e.key === 'E') && isActive) {
        setIsExpanded(!isExpanded);
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isActive, isExpanded, onClose]);

  if (!isActive) return null;

  return (
    <div className={`modal ${isActive ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card" style={{
        width: isExpanded ? '95%' : '90%',
        maxWidth: isExpanded ? '1400px' : '900px'
      }}>
        <header className="modal-card-head">
          <p className="modal-card-title">Productos de <span>{categoryName}</span></p>
          <div className="is-flex">
            <button 
              className="button is-white is-small mr-2" 
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Reducir tamaño' : 'Ampliar tamaño'}
            >
              <span className="icon">
                <i className={`fa-solid ${isExpanded ? 'fa-compress' : 'fa-expand'}`}></i>
              </span>
            </button>
            <button className="delete" aria-label="close" onClick={onClose}></button>
          </div>
        </header>
        <section className="modal-card-body">
          {/* Cabecera con búsqueda */}
          <div className="column is-12 product-list-header">
            <p className="is-size-5">
              <span className="icon is-small mr-2"><i className="fas fa-boxes"></i></span>
              <strong>{productSlugs.length}</strong> productos encontrados
            </p>
            <ProductSearch 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm}
              onToggleFilters={() => setShowFilters(!showFilters)}
            />
          </div>
          
          {/* Panel de filtros */}
          {showFilters && (
            <ProductFilter 
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
              resetFilters={resetFilters}
            />
          )}
          
          {/* Mensaje instrucciones de drag & drop */}
          <ProductDragHint 
            show={showDragHint && products.length > 0 && !isLoading && searchTerm === ''}
            onDismiss={dismissDragHint}
          />
          
          {/* Productos o estados de carga */}
          <div 
            ref={productsContainerRef}
            className={`columns is-multiline ${isDragging ? 'is-dragging' : ''}`}
          >
            {/* Mostrar productos */}
            {filteredAndSortedProducts.map(product => (
              <ProductCard key={product.slug} product={product} expanded={isExpanded} />
            ))}
            
            {/* Mostrar mensaje si no hay resultados de la búsqueda */}
            {filteredAndSortedProducts.length === 0 && !isLoading && products.length > 0 && (
              <div className="column is-12 has-text-centered mt-4">
                <div className="notification is-warning is-light">
                  <p>No se encontraron productos que coincidan con los criterios de búsqueda.</p>
                  <button 
                    className="button is-warning is-small is-light mt-2"
                    onClick={() => {
                      setSearchTerm('');
                      resetFilters();
                    }}
                  >
                    <span className="icon is-small">
                      <i className="fas fa-times"></i>
                    </span>
                    <span>Limpiar filtros</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Error al cargar productos */}
            {error && (
              <div className="column is-12">
                <div className="notification is-danger is-light">
                  <p>{error}</p>
                  <button 
                    className="button is-danger is-small is-outlined mt-2"
                    onClick={() => {
                      setError(null);
                      setPage(0);
                      setProducts([]);
                      loadMoreProducts();
                    }}
                  >
                    <span className="icon is-small">
                      <i className="fas fa-sync-alt"></i>
                    </span>
                    <span>Reintentar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Loader para scroll infinito */}
          <LoadMoreIndicator
            isLoading={isLoading}
            hasMore={hasMore}
            loaderRef={loaderRef}
          />
          
          {/* Mensaje cuando se han cargado todos los productos */}
          {!hasMore && products.length > 0 && (
            <div className="column is-12 has-text-centered mt-4 mb-4">
              <div className="notification is-success is-light">
                <p>Has visto todos los productos ({products.length} de {productSlugs.length})</p>
              </div>
            </div>
          )}
          
          {/* Loader para carga inicial */}
          {isLoading && products.length === 0 && (
            <ProductSkeleton count={8} />
          )}
        </section>
        <footer className="modal-card-foot is-justify-content-flex-end">
          <div className="is-flex is-align-items-center">
            <span className="keyboard-hint has-text-grey is-size-7 mr-3">
              <span className="icon is-small mr-1"><i className="fas fa-keyboard"></i></span>
              Pulsa la tecla <kbd>E</kbd> para cambiar el tamaño
            </span>
            <button className="button" onClick={onClose}>Cerrar</button>
          </div>
        </footer>
      </div>
      
      {/* Mensaje flotante durante el arrastre */}
      {isDragging && (
        <div className="drag-feedback visible">
          <div className="feedback-content">
            <span className="icon is-medium">
              <i className="fas fa-arrows-alt"></i>
            </span>
            <span>Arrastrando producto...</span>
          </div>
        </div>
      )}
    </div>
  );
};