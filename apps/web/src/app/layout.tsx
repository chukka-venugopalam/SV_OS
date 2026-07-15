import { TooltipProvider } from '@sv-os/ui';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import { ErrorBoundary } from '@/components/shared/error-boundary';
import { SkipNavigation } from '@/components/shared/skip-nav';
import {
  AuthProvider,
  ThemeProvider,
  CommandProvider,
  ModalProvider,
  ToastProvider,
  GraphProvider,
} from '@/providers';
import { ReactQueryProvider } from '@/providers/react-query-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | SV-OS',
    default: 'SV-OS — Silicon Valley Learning OS',
  },
  description:
    'An interactive knowledge graph that maps Computer Science concepts, technologies, projects, and careers. Learn what to study next and why.',
  keywords: ['computer science', 'knowledge graph', 'learning', 'programming', 'career roadmap'],
  authors: [{ name: 'SV-OS Team' }],
  openGraph: {
    title: 'SV-OS — Silicon Valley Learning OS',
    description:
      'An interactive knowledge graph that maps Computer Science concepts, technologies, projects, and careers.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-white font-sans text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100`}
      >
        <ThemeProvider>
          <ReactQueryProvider>
            <AuthProvider>
              <TooltipProvider>
                <ToastProvider>
                  <ModalProvider>
                    <CommandProvider>
                      <GraphProvider>
                        <SkipNavigation />
                        <ErrorBoundary>{children}</ErrorBoundary>
                      </GraphProvider>
                    </CommandProvider>
                  </ModalProvider>
                </ToastProvider>
              </TooltipProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
