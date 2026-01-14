import React from 'react';
import { CheckCircle2, XCircle, Circle, AlertTriangle, Loader2 } from 'lucide-react';

export type StatusBadgeStatus = 'passed' | 'failed' | 'never_run' | 'running' | 'skipped' | 'unknown' | string;
export type StatusBadgeSize = 'sm' | 'md' | 'lg';

export interface StatusBadgeProps {
  status: StatusBadgeStatus;
  label?: string;
  size?: StatusBadgeSize;
  showIcon?: boolean;
  className?: string;
}

/**
 * Enhanced status badge component with size variants and icons
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showIcon = false,
  className = '',
}) => {
  const getStatusConfig = () => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'passed':
      case 'success':
      case 'healthy':
        return {
          color: 'badge-success',
          bgColor: 'bg-[#2B8A3E]/10',
          textColor: 'text-[#2B8A3E]',
          borderColor: 'border-[#2B8A3E]/20',
          text: label || 'PASSED',
          icon: CheckCircle2,
        };
      case 'failed':
      case 'error':
      case 'failure':
        return {
          color: 'badge-error',
          bgColor: 'bg-[#C92A2A]/10',
          textColor: 'text-[#C92A2A]',
          borderColor: 'border-[#C92A2A]/20',
          text: label || 'FAILED',
          icon: XCircle,
        };
      case 'running':
      case 'info':
      case 'informational':
        return {
          color: 'badge-info',
          bgColor: 'bg-[#1C7ED6]/10',
          textColor: 'text-[#1C7ED6]',
          borderColor: 'border-[#1C7ED6]/20',
          text: label || status.toUpperCase(),
          icon: Loader2,
        };
      case 'skipped':
        return {
          color: 'badge-warning',
          bgColor: 'bg-[#E67700]/10',
          textColor: 'text-[#E67700]',
          borderColor: 'border-[#E67700]/20',
          text: label || 'SKIPPED',
          icon: AlertTriangle,
        };
      case 'never_run':
      case 'never':
      case 'neutral':
      default:
        return {
          color: 'badge-neutral',
          bgColor: 'bg-base-300',
          textColor: 'text-base-content',
          borderColor: 'border-base-content/10',
          text: label || (status === 'never_run' ? 'NEVER RUN' : status.toUpperCase()),
          icon: Circle,
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'badge-sm';
      case 'md':
        return 'badge-md';
      case 'lg':
        return 'badge-lg';
      default:
        return 'badge-md';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 12;
      case 'md':
        return 14;
      case 'lg':
        return 16;
      default:
        return 14;
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={`
        badge gap-1.5
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        border font-medium
        ${getSizeClasses()}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      role="status"
      aria-label={config.text}
    >
      {showIcon && Icon && (
        <Icon
          size={getIconSize()}
          className={status?.toLowerCase() === 'running' ? 'animate-spin' : ''}
        />
      )}
      {config.text}
    </span>
  );
};

export default StatusBadge;

