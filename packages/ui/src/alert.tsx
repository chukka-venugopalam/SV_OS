import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-sm',
  {
    variants: {
      variant: {
        default:
          'border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-100',
        info:
          'border-info-200 bg-info-50 text-info-800 dark:border-info-800 dark:bg-info-950/50 dark:text-info-200',
        success:
          'border-success-200 bg-success-50 text-success-800 dark:border-success-800 dark:bg-success-950/50 dark:text-success-200',
        warning:
          'border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-800 dark:bg-warning-950/50 dark:text-warning-200',
        danger:
          'border-error-200 bg-error-50 text-error-800 dark:border-error-800 dark:bg-error-950/50 dark:text-error-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant, className }))}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn('text-sm opacity-90', className)}
      {...props}
    />
  );
}
