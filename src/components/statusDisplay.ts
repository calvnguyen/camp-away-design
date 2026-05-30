// Maps domain status enums to a StatusBadge tone + human label, so screens
// don't each reinvent the mapping.

import type { BuildStatus, RentalRequestStatus, TrailerStatus } from '../types';
import type { BadgeTone } from './StatusBadge/StatusBadge';

interface Display {
  tone: BadgeTone;
  label: string;
}

export const trailerStatusDisplay: Record<TrailerStatus, Display> = {
  available: { tone: 'success', label: 'Available' },
  rented: { tone: 'info', label: 'Rented' },
  maintenance: { tone: 'warning', label: 'Maintenance' },
};

export const requestStatusDisplay: Record<RentalRequestStatus, Display> = {
  open: { tone: 'neutral', label: 'Open' },
  matched: { tone: 'info', label: 'Matched' },
  confirmed: { tone: 'success', label: 'Confirmed' },
  unfulfilled: { tone: 'warning', label: 'Unfulfilled' },
};

export const buildStatusDisplay: Record<BuildStatus, Display> = {
  commissioned: { tone: 'neutral', label: 'Commissioned' },
  in_progress: { tone: 'info', label: 'In progress' },
  completed: { tone: 'success', label: 'Completed' },
};
