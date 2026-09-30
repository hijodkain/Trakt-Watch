import * as React from 'react';
import { cn } from '../../utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[90rem]',
  full: 'max-full',
};

export function Container({ className, size = 'lg', children, ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Section({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('py-8 md:py-12 lg:py-16', className)} {...props}>
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6', className)}>
      <div>
        <h2 className="text-2xl font-bold text-fg tracking-tight">{title}</h2>
        {description && <p className="text-fg-subtle mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}

export function Grid({
  className,
  children,
  columns = { base: 1, sm: 2, md: 3, lg: 4 },
  gap = 6,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  columns?: { base: number; sm: number; md: number; lg: number };
  gap?: number;
}) {
  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${columns.base} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg}`,
        `gap-${gap}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Flex({
  className,
  children,
  direction = 'row',
  align = 'center',
  justify = 'start',
  gap = 4,
  wrap = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  gap?: number;
  wrap?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'col' ? 'flex-col' : 'flex-row',
        `items-${align}`,
        `justify-${justify}`,
        `gap-${gap}`,
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Stack({
  className,
  children,
  direction = 'vertical',
  gap = 4,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  direction?: 'vertical' | 'horizontal';
  gap?: number;
}) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        `gap-${gap}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Divider({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('border-border', className)} {...props} />;
}

export function VisuallyHidden({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
      {...props}
    >
      {children}
    </span>
  );
}