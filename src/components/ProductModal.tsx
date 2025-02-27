'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Product } from '@/types/product';
import { fetchProductDetails } from '@/lib/api-service';
import Sortable from 'sortablejs';

interface ProductModalProps {
  isActive: boolean;
  onClose: () => void;
  categorySlug: string;
  categoryName: string;
  productSlugs: string[];
}

interface ProductCardProps {
  product: Product;
  expanded: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isActive,
  onClose,
  categorySlug,
  categoryName,
  productSlugs
}) => {
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
      try {
        const hintDismissed = localStorage.getItem('dragDropHintDismissed') === 'true';
        setShowDragHint(!hintDismissed);
      } catch (e) {
        console.warn('Error accediendo a localStorage:', e);
      }
    }
  }, [isActive, categorySlug]);

  // Cargar productos iniciales cuando se abre el modal
  useEffect(() => {
    if (isActive && productSlugs.length > 0 && products.length === 0) {
      loadMoreProducts();
    }
  }, [isActive, productSlugs]);

  // Inicializar Sortable.js cuando se carguen productos
  useEffect(() => {
    if (isActive && productsContainerRef.current && products.length > 0 && !searchTerm) {
      // Destruir instancia previa si existe
      if (sortableInstance.current) {
        sortableInstance.current.destroy();
      }
      
      // Crear nueva instancia de Sortable
      sortableInstance.current = new Sortable(productsContainerRef.current, {
        animation: 150,
        ghostClass: 'product-ghost',
        chosenClass: 'product-chosen',
        dragClass: 'product-drag',
        handle: '.product-card',
        onStart: () => {
          setIsDragging(true);
          document.body.classList.add('dragging-active');
        },
        onEnd: () => {
          setIsDragging(false);
          document.body.classList.remove('dragging-active');
          
          // Guardar el nuevo orden
          saveProductOrder();
          
          // Mostrar mensaje de éxito
          showOrderSuccessMessage();
        },
        // Deshabilitar durante la búsqueda
        disabled: searchTerm.length > 0
      });
    }
    
    return () => {
      // Limpieza cuando el componente se desmonta
      if (sortableInstance.current) {
        sortableInstance.current.destroy();
        sortableInstance.current = null;
      }
    };
  }, [isActive, products, searchTerm]);

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

  // Función para guardar el orden de productos en localStorage
  const saveProductOrder = () => {
    if (!productsContainerRef.current) return;
    
    const newOrderSlugs: string[] = [];
    
    // Obtener todos los productos en el nuevo orden
    productsContainerRef.current.querySelectorAll('.product-card').forEach(card => {
      const slug = (card as HTMLElement).dataset.slug;
      if (slug) newOrderSlugs.push(slug);
    });
    
    // Reordenar el estado de productos según el nuevo orden
    if (newOrderSlugs.length > 0) {
      const orderedProducts = [...products];
      
      // Crear un mapa de posiciones
      const slugPositions: {[key: string]: number} = {};
      newOrderSlugs.forEach((slug, index) => {
        slugPositions[slug] = index;
      });
      
      // Ordenar el array según las nuevas posiciones
      orderedProducts.sort((a, b) => {
        const posA = slugPositions[a.slug] ?? Number.MAX_SAFE_INTEGER;
        const posB = slugPositions[b.slug] ?? Number.MAX_SAFE_INTEGER;
        return posA - posB;
      });
      
      // Actualizar estado
      setProducts(orderedProducts);
      
      // Guardar en localStorage
      try {
        localStorage.setItem(`productOrder_${categorySlug}`, JSON.stringify(newOrderSlugs));
      } catch (e) {
        console.warn('No se pudo guardar el orden de productos', e);
      }
    }
  };

  // Función para mostrar un mensaje de éxito después de reordenar
  const showOrderSuccessMessage = () => {
    const message = document.createElement('div');
    message.className = 'order-success-message';
    message.innerHTML = `
      <div class="notification is-success is-light">
        <span class="icon"><i class="fas fa-check-circle"></i></span>
        <span>Orden de productos actualizado</span>
      </div>
    `;
    
    document.body.appendChild(message);
    
    // Eliminar después de 2 segundos
    setTimeout(() => {
      message.classList.add('fade-out');
      setTimeout(() => message.remove(), 500);
    }, 2000);
  };

  // Cargar orden guardado si existe
  useEffect(() => {
    if (isActive && products.length > 0 && !isLoading) {
      try {
        const savedOrder = localStorage.getItem(`productOrder_${categorySlug}`);
        if (savedOrder) {
          const orderSlugs = JSON.parse(savedOrder) as string[];
          
          // Verificar si los slugs guardados coinciden con los productos cargados
          const allSlugsExist = orderSlugs.every(slug => 
            products.some(p => p.slug === slug)
          );
          
          if (allSlugsExist) {
            // Crear una copia ordenada de los productos
            const orderedProducts = [...products];
            
            // Crear un mapa de posiciones
            const slugPositions: {[key: string]: number} = {};
            orderSlugs.forEach((slug, index) => {
              slugPositions[slug] = index;
            });
            
            // Ordenar el array según las posiciones guardadas
            orderedProducts.sort((a, b) => {
              const posA = slugPositions[a.slug] ?? Number.MAX_SAFE_INTEGER;
              const posB = slugPositions[b.slug] ?? Number.MAX_SAFE_INTEGER;
              return posA - posB;
            });
            
            // Actualizar estado solo si el orden es diferente
            if (JSON.stringify(orderedProducts.map(p => p.slug)) !== 
                JSON.stringify(products.map(p => p.slug))) {
              setProducts(orderedProducts);
            }
          }
        }
      } catch (e) {
        console.warn('Error al cargar orden guardado:', e);
      }
    }
  }, [isActive, products.length, isLoading, categorySlug]);

  // Filtrar productos según término de búsqueda y otros filtros
  const filterProducts = useCallback(() => {
    return products.filter(product => {
      // Filtrar por término de búsqueda
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtrar por stock
      if (activeFilters.stockType !== 'all') {
        const stockQuantity = product.stock ?? 
                             (product.pricing?.isInStock as number) ?? 
                             product.availableStock;
        
        const isLowStock = stockQuantity !== null && stockQuantity > 0 && stockQuantity < 50;
        const isInStock = stockQuantity !== null && stockQuantity > 0 && !isLowStock;
        const isOutOfStock = stockQuantity !== null && stockQuantity <= 0;
        
        if (activeFilters.stockType === 'in-stock' && !isInStock) return false;
        if (activeFilters.stockType === 'low-stock' && !isLowStock) return false;
        if (activeFilters.stockType === 'out-of-stock' && !isOutOfStock) return false;
      }
      
      // Filtrar por precio
      if (activeFilters.minPrice !== null || activeFilters.maxPrice !== null) {
        const price = product.pricing?.originalPrice ?? product.price;
        
        if (typeof price === 'number' || typeof price === 'string') {
          const numericPrice = typeof price === 'string' 
            ? parseFloat(price) 
            : price;
          
          if (activeFilters.minPrice !== null && numericPrice < activeFilters.minPrice) {
            return false;
          }
          
          if (activeFilters.maxPrice !== null && numericPrice > activeFilters.maxPrice) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [products, searchTerm, activeFilters]);

  // Ordenar productos filtrados
  const sortFilteredProducts = useCallback((filteredProds: Product[]) => {
    const sorted = [...filteredProds];
    
    switch (activeFilters.sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
      case 'price-desc':
        sorted.sort((a, b) => {
          const priceA = a.pricing?.originalPrice ?? a.price ?? 0;
          const priceB = b.pricing?.originalPrice ?? b.price ?? 0;
          
          const numericPriceA = typeof priceA === 'string' ? parseFloat(priceA) : priceA;
          const numericPriceB = typeof priceB === 'string' ? parseFloat(priceB) : priceB;
          
          return activeFilters.sortBy === 'price-asc' 
            ? numericPriceA - numericPriceB 
            : numericPriceB - numericPriceA;
        });
        break;
      case 'stock-desc':
        sorted.sort((a, b) => {
          const stockA = a.stock ?? (a.pricing?.isInStock as number) ?? a.availableStock ?? 0;
          const stockB = b.stock ?? (b.pricing?.isInStock as number) ?? b.availableStock ?? 0;
          
          return stockB - stockA;
        });
        break;
    }
    
    return sorted;
  }, [activeFilters.sortBy]);

  // Obtener productos filtrados y ordenados
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = filterProducts();
    return sortFilteredProducts(filtered);
  }, [filterProducts, sortFilteredProducts]);

  // Aplicar filtros
  const applyFilters = (filters: {
    stockType: string, 
    minPrice: number | null, 
    maxPrice: number | null, 
    sortBy: string
  }) => {
    setActiveFilters(filters);
  };

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
    try {
      localStorage.setItem('dragDropHintDismissed', 'true');
    } catch (e) {
      console.warn('Error guardando preferencia:', e);
    }
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
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="icon">
                  <i className="fas fa-filter"></i>
                </span>
                <span>Filtros</span>
              </button>
            </div>
          </div>
          
          {/* Panel de filtros */}
          {showFilters && (
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
          )}
          
          {/* Mensaje instrucciones de drag & drop */}
          {showDragHint && products.length > 0 && !isLoading && searchTerm === '' && (
            <div className="column is-12 drag-drop-instructions mb-3">
              <div className="notification is-info is-light drag-drop-hint show">
                <div className="is-flex is-align-items-center">
                  <span className="icon-text mr-2">
                    <span className="icon">
                      <i className="fas fa-hand-pointer"></i>
                    </span>
                  </span>
                  <div>
                    <p className="has-text-weight-medium">¡Puedes reordenar los productos!</p>
                    <p className="is-size-7">Arrastra las tarjetas para organizar los productos como prefieras.</p>
                  </div>
                  <button className="delete ml-auto" aria-label="close" onClick={dismissDragHint}></button>
                </div>
              </div>
            </div>
          )}
          
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
          {isActive && hasMore && (
            <div ref={loaderRef} className="column is-12 scroll-loader-container">
              {isLoading ? (
                <div className="loader-dots">
                  <div className="loader-dot"></div>
                  <div className="loader-dot"></div>
                  <div className="loader-dot"></div>
                </div>
              ) : (
                <p className="is-size-7 has-text-grey">
                  Scroll para cargar más productos
                </p>
              )}
            </div>
          )}
          
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
            <div className="columns is-multiline">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="column is-3 product-item">
                  <div className="card product-card product-skeleton">
                    <div className="product-image product-skeleton" style={{ height: 180 }}>
                      <div className="loading-indicator" style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)'}}>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                      </div>
                    </div>
                    <div className="card-content">
                      <div className="skeleton-text skeleton-title"></div>
                      <div className="skeleton-text" style={{ width: '60%' }}></div>
                      <div className="skeleton-text" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

// Componente para tarjeta de producto
const ProductCard: React.FC<ProductCardProps> = ({ product, expanded }) => {
  // Extraer información del producto
  const productName = product.name || product.title || 'Producto sin nombre';
  const reference = product.upc || product.reference || product.sku || product.id || 'N/A';
  const hasError = product.error === true;
  const isFallback = product.fallback === true;
  
  // Obtener el valor numérico del stock
  let stockQuantity = null;
  if (product.stock !== undefined && product.stock !== null) {
    stockQuantity = product.stock;
  } else if (product.pricing && typeof product.pricing.isInStock === 'number') {
    stockQuantity = product.pricing.isInStock;
  } else if (product.availableStock !== undefined && product.availableStock !== null) {
    stockQuantity = product.availableStock;
  }
  
  // Determinar si el stock es bajo
  const isLowStock = stockQuantity !== null && stockQuantity > 0 && stockQuantity < 50;
  
// Obtener estado de stock
let stockStatus = '';
let stockClass = '';
let stockIcon = '';

if (stockQuantity !== null) {
  if (stockQuantity > 0) {
    stockStatus = isLowStock ? `¡Quedan solo ${stockQuantity} unidades!` : `En stock (${stockQuantity} unidades)`;
    stockClass = isLowStock ? 'has-text-warning' : 'has-text-success';
    stockIcon = isLowStock ? 'exclamation-circle' : 'check-circle';
  } else {
    stockStatus = 'Sin stock';
    stockClass = 'has-text-danger';
    stockIcon = 'times-circle';
  }
} else if (product.pricing && product.pricing.isInStock !== undefined) {
  if (product.pricing.isInStock === true) {
    stockStatus = 'En stock';
    stockClass = 'has-text-success';
    stockIcon = 'check-circle';
  } else {
    stockStatus = 'Sin stock';
    stockClass = 'has-text-danger';
    stockIcon = 'times-circle';
  }
} else {
  stockStatus = 'Stock desconocido';
  stockClass = 'has-text-grey';
  stockIcon = 'question-circle';
}

// Obtener el precio
let price = 'Consultar';
if (product.pricing && product.pricing.originalPrice) {
  price = `${parseFloat(product.pricing.originalPrice.toString()).toFixed(2)}€`;
} else if (product.price) {
  price = `${parseFloat(product.price.toString()).toFixed(2)}€`;
}

// URL del producto
const productWebUrl = `https://cecotec.es/productos/${product.slug}/`;

// Imagen del producto
const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAMAAAC8EZcfAAAAMFBMVEXy8vL09PT5+fn19fX8/Pz39/f7+/v6+vrx8fH+/v74+Pj29vbw8PDz8/P9/f3v7+/sxi8BAAAC70lEQVR4nO2a25KDIBBEEVHAy///tqvJZtwNwUFaLFfP+7IPnhmgGy8vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFG5+WT+OcZx+JH4jJhGx47sYnGl8PBLmQNBNbn08xEeC5uWd4x/dLNrRD1XSE1IoSLOUnI7X3JQFn4rBVEknfU1Bv52MNH8eLVIXVKtD2/TMcAzVBcNudKw9F7T1BdUyfuR4yzEYBDXnOMbNTSJYH4NOX4bzoKQSxLvxVQUgWJ4cuyteemGbVEKTYCo5qQtehGQTyeqlzySu0v0nV6XYrhuTyVUU9HbX2hFl9BlBlV2CuXgxu+u39NJRyUYqmJ2Fxf7+YjsqwcrxbP9w7Xeo8AexJvOB5B+tP/GuKhjcrts5jq3SG1pvJcfg/uw43xUBdAVDE5tuL0mNdw7BUJL6Q1D70vgmTKYDCbqPwYZPZdBcCm2ZwaZrJ5uKgmF64hiCutmYv20kgrXzWp3TGgRrZ/b1o5VeUF9gOobcOb84u2D1kMlWDpncgk2X9Ut+wbZfmrILtl3XgmDTISULdv31LQh2/QUyCPbsBIJgz24sCnbdUeQW7LunCoJ9O9sg2HmHHgRlI6j8FYJjEBxBcHwCwfFz7BDsvisPgv0HeCDY/5ACwQEIjj8gOP6EoLQI3gDB/iO0INj/6KPzpYbigWGCzYe61zkFm0+t7nMKth9bvmcUbD+3nTMKdlzcPq8ZBTsurz8GnaC1XF9/6hPMzPGnmyaHYO5Cc7oVnW5mx5QsWOu6Mjrk3Iu3CgYnn/2OYf4JGgRDMn9pKAV3fbRMuG0TnKNkK1VsyuQzZDfA87IgrcNzG5TsgoVmSiZBdYfgchfrPZpMgtLSRfgkWKOdUjcpvPtFNQmK2qMrZhJ0ZUGHYMxkW2TYs35UEITXCZ63Zy5uJq3rAuXD4ybBVA/hPK+7SzDxiKyH4r+YuQPUyP8IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGDA/zgQPU0fqqWwAAAAAElFTkSuQmCC';
let imageUrl = placeholderImage;

if (product.media && product.media.mainImages && product.media.mainImages.length > 0) {
  imageUrl = product.media.mainImages[0];
} else if (product.images && product.images.length > 0) {
  imageUrl = product.images[0];
} else if (product.image) {
  imageUrl = product.image;
}

// Clases especiales según el estado
let statusClass = '';
if (hasError) {
  statusClass = 'has-background-danger-light';
} else if (isFallback) {
  statusClass = 'has-background-warning-light';
} else if (isLowStock) {
  statusClass = 'has-background-warning-light low-stock-card';
}

return (
  <div className={`column ${expanded ? 'is-3' : 'is-4'} product-item`}>
    <div className={`card product-card ${statusClass}`} data-slug={product.slug}>
      <div 
        className="product-image" 
        style={{ 
          backgroundImage: `url('${imageUrl}')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          height: 180
        }}
      >
        <div className="product-price">{price}</div>
        {isLowStock && <div className="low-stock-badge">¡ÚLTIMAS UNIDADES!</div>}
      </div>
      <div className="card-content">
        <p className="title is-6">{productName}</p>
        <div className="subtitle is-7 mb-2">
          <span className="tag is-light">Ref: {reference}</span>
        </div>
        <div className={`stock-indicator ${stockClass}`}>
          <span className="icon is-small">
            <i className={`fas fa-${stockIcon}`}></i>
          </span>
          <span>{stockStatus}</span>
        </div>
        {hasError && (
          <p className="has-text-danger is-size-7 mt-2">
            {product.message || 'Error al cargar producto'}
          </p>
        )}
        {isFallback && (
          <p className="has-text-warning is-size-7 mt-2">
            {product.fallbackMessage || 'Datos aproximados'}
          </p>
        )}
      </div>
      <footer className="card-footer">
        <a href={productWebUrl} target="_blank" className="card-footer-item">
          <span className="icon is-small mr-1"><i className="fas fa-external-link-alt"></i></span>
          Ver en web
        </a>
      </footer>
    </div>
  </div>
);
};