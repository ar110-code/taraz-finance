import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  color?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryIcon({ name, color = '#6366f1', className = '', size = 'md' }: CategoryIconProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name] || Icons.Tag;

  const sizeClasses = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`rounded-xl flex items-center justify-center shrink-0 transition-transform ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${color}18`,
        color: color,
      }}
    >
      <IconComponent className={`${iconSizes[size]} stroke-[1.8]`} />
    </div>
  );
}
