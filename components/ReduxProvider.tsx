'use client';

import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';

interface ReduxProviderProps {
  children: ReactNode;
}

/**
 * FUNC-F01 fix: ReduxProvider now only provides the Redux store.
 * Auth initialization is handled by AuthContext to ensure a single source of truth.
 */
export default function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}

