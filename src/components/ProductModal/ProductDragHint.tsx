import React from 'react';
import { DragHintProps } from './types';

export const ProductDragHint: React.FC<DragHintProps> = ({ show, onDismiss }) => {
  if (!show) return null;
  
  return (
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
          <button className="delete ml-auto" aria-label="close" onClick={onDismiss}></button>
        </div>
      </div>
    </div>
  );
};