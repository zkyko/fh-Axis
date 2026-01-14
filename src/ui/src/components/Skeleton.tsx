import React from 'react';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card' | 'table';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

/**
 * Skeleton loader component for loading states
 */
const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded';
      case 'card':
        return 'rounded-lg p-6';
      case 'table':
        return 'rounded h-12';
      default:
        return 'rounded';
    }
  };

  const getDefaultDimensions = () => {
    switch (variant) {
      case 'text':
        return { width: '100%', height: '16px' };
      case 'circular':
        return { width: '40px', height: '40px' };
      case 'rectangular':
        return { width: width || '100%', height: height || '100px' };
      case 'card':
        return { width: width || '100%', height: height || '200px' };
      case 'table':
        return { width: '100%', height: '48px' };
      default:
        return { width: width || '100%', height: height || '100px' };
    }
  };

  const dimensions = getDefaultDimensions();
  const style: React.CSSProperties = {
    width: width || dimensions.width,
    height: height || dimensions.height,
  };

  const skeletonElement = (
    <div
      className={`skeleton bg-base-300 ${getVariantClasses()} ${className}`}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{skeletonElement}</React.Fragment>
      ))}
    </div>
  );
};

export default Skeleton;

