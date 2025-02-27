import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  isLoading: boolean;
  text: string;
  icon: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  isLoading,
  text,
  icon,
}) => {
  return (
    <button 
      className="button is-primary is-medium" 
      onClick={onClick}
      disabled={isLoading}
    >
      <span className="icon">
        <i className={`fas fa-${icon}`}></i>
      </span>
      <span>{text}</span>
    </button>
  );
};