import React from 'react';
import Icon, { IconName } from './Icon';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  iconColor?: string;
  iconSize?: number;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  iconColor,
  iconSize,
  className = '',
  onClick,
  disabled = false,
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variantClasses = {
    primary: 'bg-orange text-light hover:bg-orange/90 active:bg-orange/80',
    secondary: 'bg-navy text-light hover:bg-navy/90 active:bg-navy/80',
    ghost: 'bg-transparent text-light hover:bg-light/10 active:bg-light/20',
    white: 'bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const defaultIconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  const finalIconSize = iconSize || defaultIconSizes[size];
  const finalIconColor = iconColor || '#F6F6F6';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && iconPosition === 'left' && (
        <Icon 
          name={icon} 
          size={finalIconSize} 
          color={finalIconColor}
          className="mr-2"
        />
      )}
      
      <span>{children}</span>
      
      {icon && iconPosition === 'right' && (
        <Icon 
          name={icon} 
          size={finalIconSize} 
          color={finalIconColor}
          className="ml-2"
        />
      )}
    </button>
  );
};

export default Button; 