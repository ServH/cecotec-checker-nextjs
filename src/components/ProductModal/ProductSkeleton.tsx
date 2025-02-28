import React from 'react';

export const ProductSkeleton: React.FC<{ count: number }> = ({ count }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
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
    </>
  );
};