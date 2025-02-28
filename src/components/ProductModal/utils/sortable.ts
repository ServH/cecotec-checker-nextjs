import Sortable from 'sortablejs';
import { Product } from '@/app/types/product';

export const initSortable = (
  containerRef: HTMLElement, 
  onStart: () => void, 
  onEnd: () => void,
  disabled: boolean
): Sortable => {
  return new Sortable(containerRef, {
    animation: 150,
    ghostClass: 'product-ghost',
    chosenClass: 'product-chosen',
    dragClass: 'product-drag',
    handle: '.product-card',
    onStart,
    onEnd,
    disabled
  });
};

export const saveProductOrder = (
  containerRef: HTMLElement,
  products: Product[],
  categorySlug: string,
  setProducts: (products: Product[]) => void
): void => {
  if (!containerRef) return;
  
  const newOrderSlugs: string[] = [];
  
  // Obtener todos los productos en el nuevo orden
  containerRef.querySelectorAll('.product-card').forEach(card => {
    const slug = (card as HTMLElement).dataset.slug;
    if (slug) newOrderSlugs.push(slug);
  });
  
  // Reordenar el estado de productos
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

export const showOrderSuccessMessage = (): void => {
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