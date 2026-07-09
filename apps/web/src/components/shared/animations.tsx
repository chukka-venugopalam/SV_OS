'use client';

import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';

import { useReducedMotion } from '@/hooks/use-media-query';
import { cn } from '@/lib/cn';

// ── Respect prefers-reduced-motion ────────────────────────────────

function useSafeMotion() {
  const prefersReduced = useReducedMotion();
  return { reduced: prefersReduced };
}

// ── Page Transition ───────────────────────────────────────────────

const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

interface PageTransitionProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className, ...props }: PageTransitionProps) {
  const { reduced } = useSafeMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ── Fade In ───────────────────────────────────────────────────────

interface FadeInProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className, ...props }: FadeInProps) {
  const { reduced } = useSafeMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger List ──────────────────────────────────────────────────

const staggerVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25, ease: 'easeOut' },
  }),
};

interface StaggerListProps {
  children: React.ReactNode[];
  className?: string;
}

export function StaggerList({ children, className }: StaggerListProps) {
  const { reduced } = useSafeMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// ── Hover Card ────────────────────────────────────────────────────

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'a';
  href?: string;
}

export function HoverCard({ children, className, as = 'div', href }: HoverCardProps) {
  const { reduced } = useSafeMotion();

  if (reduced) {
    const Tag = as;
    return (
      <Tag className={className} href={href}>
        {children}
      </Tag>
    );
  }

  if (as === 'a') {
    return (
      <motion.a
        href={href}
        className={className}
        whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
        whileTap={{ y: -1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.div
      className={className}
      whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
      whileTap={{ y: -1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// ── Scale In ──────────────────────────────────────────────────────

interface ScaleInProps {
  children: React.ReactNode;
  className?: string;
}

export function ScaleIn({ children, className }: ScaleInProps) {
  const { reduced } = useSafeMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Slide Up ──────────────────────────────────────────────────────

interface SlideUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function SlideUp({ children, className, delay = 0 }: SlideUpProps) {
  const { reduced } = useSafeMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger Grid ──────────────────────────────────────────────────

interface StaggerGridProps {
  children: React.ReactNode[];
  className?: string;
}

export function StaggerGrid({ children, className }: StaggerGridProps) {
  const { reduced } = useSafeMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3, ease: 'easeOut' }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
