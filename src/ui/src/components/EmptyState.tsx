import React from 'react';
import { LucideIcon } from 'lucide-react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  tip?: string;
  className?: string;
}

/**
 * Empty state component with illustrations, CTAs, and onboarding tips
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tip,
  className = '',
}) => {
  return (
    <div className={`
      flex flex-col items-center justify-center
      p-12 text-center
      ${className}
    `.trim().replace(/\s+/g, ' ')}>
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-base-200">
          <Icon size={48} className="text-base-content/40" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-base-content mb-2">{title}</h3>
      {description && (
        <p className="text-base-content/70 mb-6 max-w-md">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {tip && (
        <p className="mt-6 text-sm text-base-content/50 italic max-w-md">
          💡 Pro tip: {tip}
        </p>
      )}
    </div>
  );
};

export default EmptyState;

