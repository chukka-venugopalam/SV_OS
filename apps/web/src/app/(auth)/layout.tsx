import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="from-primary-200/30 to-primary-400/10 dark:from-primary-800/20 dark:to-primary-600/5 absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br blur-3xl" />
        <div className="from-info-200/20 to-primary-400/10 dark:from-info-800/10 dark:to-primary-600/5 absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link
          href="/"
          className="mb-8 block text-center text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
        >
          <span className="text-primary-600 dark:text-primary-400">SV</span>-OS
        </Link>

        {children}
      </div>
    </div>
  );
}
