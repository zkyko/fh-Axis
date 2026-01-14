import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  tooltip?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

/**
 * Reusable Button component with consistent styling
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  tooltip,
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'tertiary':
        return 'btn-ghost';
      case 'danger':
        return 'btn-error';
      default:
        return 'btn';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'btn-sm';
      case 'md':
        return 'btn-md';
      case 'lg':
        return 'btn-lg';
      default:
        return '';
    }
  };

  const baseClasses = `
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const buttonContent = (
    <>
      {loading && (
        <span className="loading loading-spinner loading-sm"></span>
      )}
      {Icon && iconPosition === 'left' && !loading && <Icon size={16} />}
      {children && <span>{children}</span>}
      {Icon && iconPosition === 'right' && !loading && <Icon size={16} />}
    </>
  );

  const button = (
    <button
      className={baseClasses}
      disabled={disabled || loading}
      aria-label={tooltip || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {buttonContent}
    </button>
  );

  // Wrap with tooltip if provided
  if (tooltip && (variant === 'tertiary' || !children)) {
    return (
      <div className="tooltip tooltip-bottom" data-tip={tooltip}>
        {button}
      </div>
    );
  }

  return button;
};

export default Button;

