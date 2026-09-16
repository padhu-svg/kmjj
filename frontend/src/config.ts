export const GAS_URL = import.meta.env.VITE_GAS_URL || '';

export const COUNTER_LABELS: Record<string, string> = {
  R1: 'Registration Counter',
  R2: 'Registration Counter',
  R3: 'Registration Counter',
  V1: 'Verification Counter',
  V2: 'Verification Counter'
};

export const getCounterFromQuery = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  const counter = params.get('counter');
  return counter && COUNTER_LABELS[counter] ? counter : null;
};

export const getCounterLabel = (): string => {
  const counter = getCounterFromQuery();
  return counter ? COUNTER_LABELS[counter] : 'Counter not set';
};
