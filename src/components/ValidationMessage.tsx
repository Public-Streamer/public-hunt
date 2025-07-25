import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  className?: string;
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({ type, message, className }) => {
  const icons = {
    success: Check,
    error: X,
    warning: AlertCircle,
    info: AlertCircle,
  };

  const styles = {
    success: 'text-green-600 bg-green-50 border-green-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-amber-600 bg-amber-50 border-amber-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
  };

  const IconComponent = icons[type];

  return (
    <div className={cn(
      'flex items-center gap-2 text-xs px-2 py-1.5 rounded border',
      styles[type],
      className
    )}>
      <IconComponent className="w-3 h-3 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default ValidationMessage;