import * as React from 'react';
import { cn } from '../../utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'poster';
  lines?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', lines = 1, ...props }, ref) => {
    if (variant === 'poster') {
      return (
        <div
          ref={ref}
          className={cn('animate-pulse bg-bg-card rounded-xl overflow-hidden', className)}
          {...props}
        >
          <div className="aspect-[2/3] w-full bg-gradient-to-b from-border to-border-light" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-3/4 bg-gradient-to-r from-border to-border-light rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-gradient-to-r from-border to-border-light rounded animate-pulse" />
          </div>
        </div>
      );
    }

    if (variant === 'circular') {
      return (
        <div
          ref={ref}
          className={cn('animate-pulse rounded-full bg-gradient-to-r from-border to-border-light', className)}
          {...props}
        />
      );
    }

    if (variant === 'rectangular') {
      return (
        <div
          ref={ref}
          className={cn('animate-pulse rounded-lg bg-gradient-to-r from-border to-border-light', className)}
          {...props}
        />
      );
    }

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse h-4 bg-gradient-to-r from-border to-border-light rounded',
              i === lines - 1 && 'w-3/4'
            )}
          />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };