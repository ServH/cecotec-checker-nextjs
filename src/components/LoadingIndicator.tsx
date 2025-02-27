import React from 'react';

export const LoadingIndicator: React.FC = () => {
  return (
    <div className="mt-4">
      <div className="card">
        <div className="card-content">
          <div className="is-flex is-align-items-center mb-2">
            <div className="loading-spinner mr-3">
              <div 
                style={{
                  width: 24, 
                  height: 24, 
                  border: '3px solid #4a4a4a', 
                  borderRadius: '50%', 
                  borderRightColor: 'transparent'
                }}
              ></div>
            </div>
            <p className="is-size-5">Verificando categorías...</p>
          </div>
          <progress className="progress is-primary" max="100"></progress>
        </div>
      </div>
    </div>
  );
};