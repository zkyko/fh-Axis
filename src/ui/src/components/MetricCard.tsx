import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  sparkline?: number[];
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

/**
 * Metric card component with trend indicators and sparkline support
 */
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  sparkline,
  icon: Icon,
  onClick,
  className = '',
}) => {
  const getTrendColor = () => {
    if (!trend) return 'text-base-content/60';
    switch (trend.direction) {
      case 'up':
        return 'text-[#2B8A3E]';
      case 'down':
        return 'text-[#C92A2A]';
      case 'neutral':
      default:
        return 'text-base-content/60';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return <TrendingUp size={14} />;
      case 'down':
        return <TrendingDown size={14} />;
      case 'neutral':
      default:
        return <Minus size={14} />;
    }
  };

  const renderSparkline = () => {
    if (!sparkline || sparkline.length === 0) return null;

    const max = Math.max(...sparkline);
    const min = Math.min(...sparkline);
    const range = max - min || 1;
    const width = 60;
    const height = 20;
    const points = sparkline.map((val, index) => {
      const x = (index / (sparkline.length - 1 || 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg
        width={width}
        height={height}
        className="absolute bottom-2 right-2 opacity-60"
        style={{ pointerEvents: 'none' }}
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div
      className={`
        relative glass-card p-6
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={onClick}
      style={{ maxHeight: '120px' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-base-content/60" />}
          <h3 className="text-sm font-medium text-base-content/70">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-xs font-medium">{trend.value}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-base-content">{value}</div>
      {sparkline && renderSparkline()}
    </div>
  );
};

export default MetricCard;

