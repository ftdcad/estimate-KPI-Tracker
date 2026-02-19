// Estimate lifecycle — cyclical, not linear.
// Files bounce: in-progress → blocked → in-progress (multiple times).
// Files cycle: sent-to-carrier → revision-requested → in-progress → sent-to-carrier.

export type EstimateStatus =
  | 'assigned'
  | 'in-progress'
  | 'blocked'
  | 'review'
  | 'sent-to-carrier'
  | 'revision-requested'
  | 'revised'
  | 'settled'
  | 'closed'
  | 'unable-to-start';

export const STATUS_LABELS: Record<EstimateStatus, string> = {
  'assigned':            'Assigned',
  'in-progress':         'In Progress',
  'blocked':             'Blocked',
  'review':              'In Review',
  'sent-to-carrier':     'Sent to Carrier',
  'revision-requested':  'Revision Requested',
  'revised':             'Revised',
  'settled':             'Settled',
  'closed':              'Closed',
  'unable-to-start':     'Unable to Start',
};

export const STATUS_COLORS: Record<EstimateStatus, string> = {
  'assigned':            'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'in-progress':         'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'blocked':             'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'review':              'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'sent-to-carrier':     'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'revision-requested':  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'revised':             'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'settled':             'bg-green-500/20 text-green-300 border-green-500/30',
  'closed':              'bg-green-600/20 text-green-400 border-green-600/30',
  'unable-to-start':     'bg-red-500/20 text-red-300 border-red-500/30',
};

// Allowed transitions from PDR Section 4.2
export const ALLOWED_TRANSITIONS: Record<EstimateStatus, EstimateStatus[]> = {
  'assigned':            ['in-progress', 'unable-to-start'],
  'in-progress':         ['blocked', 'review', 'sent-to-carrier'],
  'blocked':             ['in-progress'],
  'review':              ['in-progress', 'sent-to-carrier'],
  'sent-to-carrier':     ['revision-requested', 'settled'],
  'revision-requested':  ['in-progress'],
  'revised':             ['sent-to-carrier'],
  'settled':             ['closed'],
  'closed':              [],
  'unable-to-start':     ['assigned'],
};

// Statuses shown in dropdown for manual selection (excludes blocked — that's the button)
export const SELECTABLE_STATUSES: EstimateStatus[] = [
  'assigned',
  'in-progress',
  'review',
  'sent-to-carrier',
  'revision-requested',
  'revised',
  'settled',
  'closed',
  'unable-to-start',
];

export function canTransition(current: EstimateStatus, next: EstimateStatus): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
}

// Blocker types for the BlockerDialog dropdown
export const BLOCKER_TYPES = [
  { value: 'scoper', label: 'Waiting on Scoper' },
  { value: 'public-adjuster', label: 'Waiting on Public Adjuster' },
  { value: 'carrier', label: 'Waiting on Carrier' },
  { value: 'contractor', label: 'Waiting on Contractor' },
  { value: 'client', label: 'Waiting on Client' },
  { value: 'internal', label: 'Internal Hold' },
  { value: 'documentation', label: 'Missing Documentation' },
  { value: 'other', label: 'Other' },
] as const;

export type BlockerType = typeof BLOCKER_TYPES[number]['value'];
