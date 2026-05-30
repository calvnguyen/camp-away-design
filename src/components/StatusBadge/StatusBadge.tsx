import type { ReactNode } from 'react';
import styles from './StatusBadge.module.css';

export type BadgeTone = 'neutral' | 'info' | 'warning' | 'success';

export interface StatusBadgeProps {
  /** Visual tone, mapped to the status color tokens. */
  tone?: BadgeTone;
  children: ReactNode;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: styles.neutral,
  info: styles.info,
  warning: styles.warning,
  success: styles.success,
};

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  return <span className={`${styles.badge} ${TONE_CLASSES[tone]}`}>{children}</span>;
}
