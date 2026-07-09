import { Skeleton } from '@sv-os/ui';

export default function LoadingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="border-t-primary-600 dark:border-t-primary-400 h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading...</p>
      </div>
    </div>
  );
}
