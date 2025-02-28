import React from 'react';
import { ProductCardProps } from './types';

export const ProductCard: React.FC<ProductCardProps> = ({ product, expanded }) => {
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
          <a href={productWebUrl} target="_blank" rel="noopener noreferrer" className="card-footer-item">
            <span className="icon is-small mr-1"><i className="fas fa-external-link-alt"></i></span>
            Ver en web
          </a>
        </footer>
      </div>
    </div>
  );
};