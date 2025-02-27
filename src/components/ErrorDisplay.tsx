import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onRetry,
}) => {
  return (
    <div className="notification is-danger error-notification">
      <div className="mb-3">
        <span className="icon is-large">
          <i className="fas fa-exclamation-triangle fa-2x"></i>
        </span>
      </div>
      <p className="is-size-5 mb-2"><strong>Error en el análisis de categorías</strong></p>
      <p>{message}</p>
      <div className="mt-4">
        <button className="button is-white is-outlined" onClick={onRetry}>
          <span className="icon"><i className="fas fa-sync-alt"></i></span>
          <span>Reintentar</span>
        </button>
      </div>
    </div>
  );
};