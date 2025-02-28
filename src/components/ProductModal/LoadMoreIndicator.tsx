import React from 'react';
import { LoadMoreProps } from './types';

export const LoadMoreIndicator: React.FC<LoadMoreProps> = ({ 
  isLoading, 
  hasMore, 
  loaderRef 
}) => {
  if (!hasMore) return null;
  
  return (
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
  );
};