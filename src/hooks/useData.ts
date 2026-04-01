import { useState, useEffect } from 'react';
import type { Overview, SessionSummary } from '../types';

interface DataState {
  overview: Overview | null;
  sessions: SessionSummary[];
  loading: boolean;
  error: string | null;
}

export function useData(): DataState {
  const [state, setState] = useState<DataState>({
    overview: null,
    sessions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    Promise.all([
      fetch('./data/overview.json').then(r => {
        if (!r.ok) throw new Error('Failed to load overview');
        return r.json();
      }),
      fetch('./data/sessions.json').then(r => {
        if (!r.ok) throw new Error('Failed to load sessions');
        return r.json();
      }),
    ])
      .then(([overview, sessions]) => {
        setState({ overview, sessions, loading: false, error: null });
      })
      .catch(err => {
        setState(s => ({ ...s, loading: false, error: err.message }));
      });
  }, []);

  return state;
}
