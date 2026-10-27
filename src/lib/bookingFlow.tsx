import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { SnackItem } from '@/lib/types';

export interface PendingSelection {
  showtimeId: string;
  movieId: string;
  movieTitle: string;
  screenName: string;
  showDate: string;
  showTime: string;
  format: string;
  priceCents: number;
  seats: string[];
  code?: string;
}

interface BookingFlowState {
  pending: PendingSelection | null;
  snacks: SnackItem[];
  setPending: (p: PendingSelection | null) => void;
  setSnacks: (s: SnackItem[]) => void;
  clear: () => void;
}

const FlowContext = createContext<BookingFlowState | undefined>(undefined);

export function BookingFlowProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [snacks, setSnacks] = useState<SnackItem[]>([]);

  const clear = () => {
    setPending(null);
    setSnacks([]);
  };

  return (
    <FlowContext.Provider value={{ pending, snacks, setPending, setSnacks, clear }}>
      {children}
    </FlowContext.Provider>
  );
}

export function useBookingFlow(): BookingFlowState {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useBookingFlow must be used within BookingFlowProvider');
  return ctx;
}
