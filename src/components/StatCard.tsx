import React from 'react';

interface StatCardProps {
  id: string;
  status: 'ALL' | 'OK' | 'KO' | 'ERROR';
  label: string;
  icon: string;
  value: number;
  color: string;
  isActive: boolean;
  onClick: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  status,
  label,
  icon,
  value,
  color,
  isActive,
  onClick,
}) => {
  return (
    <div className="column is-3" id={id}>
      <div 
        className={`card stats-card ${color} ${isActive ? 'active' : ''}`}
        onClick={onClick}
      >
        <div className="card-content has-text-centered">
          <p className={`title is-3 ${color.includes('has-text-white') ? 'has-text-white' : ''} mb-2`}>
            {value}
          </p>
          <p className={`subtitle is-6 ${color.includes('has-text-white') ? 'has-text-white' : ''}`}>
            {label}
          </p>
          <div className="icon is-small mt-2">
            <i className={`fas fa-${icon}`}></i>
          </div>
        </div>
      </div>
    </div>
  );
};