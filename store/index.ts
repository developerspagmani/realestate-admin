import { configureStore, createSlice } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { ReactNode } from 'react';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: number; // 1: user, 2: admin, 3: owner
}

// Cart Item Types
export interface CartItem {
  id: string;
  workspaceId: string;
  spaceId: string;
  workspaceName: string;
  spaceName: string;
  type: 'desk' | 'office' | 'meeting_room' | 'event_space';
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  dailyRate: number;
  monthlyRate: number;
  totalHours: number;
  totalDays: number;
  totalAmount: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalAmount: number;
  loading: boolean;
  error: string | null;
}

// Booking Types
export interface Booking {
  duration: ReactNode;
  id: string;
  userId: string;
  workspaceId: string;
  spaceId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
}

// Cart Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [] as CartItem[],
    totalAmount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload as CartItem;
      const existingItem = state.items.find(item =>
        item.workspaceId === newItem.workspaceId &&
        item.startDate === newItem.startDate &&
        item.endDate === newItem.endDate &&
        item.startTime === newItem.startTime &&
        item.endTime === newItem.endTime
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
        existingItem.totalAmount = existingItem.totalHours * existingItem.hourlyRate * existingItem.quantity;
      } else {
        state.items.push(newItem);
      }

      // Recalculate total
      state.totalAmount = state.items.reduce((total, item) => total + item.totalAmount, 0);
    },
    removeFromCart: (state, action) => {
      const itemId = action.payload as string;
      state.items = state.items.filter(item => item.id !== itemId);
      state.totalAmount = state.items.reduce((total, item) => total + item.totalAmount, 0);
    },
    updateCartItem: (state, action) => {
      const { id, quantity } = action.payload as { id: string; quantity: number };
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.quantity = quantity;
        item.totalAmount = item.totalHours * item.hourlyRate * item.quantity;
      }
      state.totalAmount = state.items.reduce((total, item) => total + item.totalAmount, 0);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
    },
    cartError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

// Booking Slice
const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    bookings: [] as Booking[],
    loading: false,
    error: null,
  },
  reducers: {
    bookingStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    bookingSuccess: (state, action) => {
      state.loading = false;
      state.bookings.push(action.payload as Booking);
    },
    bookingFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateBookingStatus: (state, action) => {
      const { id, status } = action.payload as { id: string; status: 'pending' | 'confirmed' | 'cancelled' };
      const booking = state.bookings.find(b => b.id === id);
      if (booking) {
        booking.status = status;
      }
    },
    updatePaymentStatus: (state, action) => {
      const { id, paymentStatus } = action.payload as { id: string; paymentStatus: 'pending' | 'paid' | 'failed' };
      const booking = state.bookings.find(b => b.id === id);
      if (booking) {
        booking.paymentStatus = paymentStatus;
      }
    },
    cancelBooking: (state, action) => {
      const bookingId = action.payload as string;
      const booking = state.bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = 'cancelled';
      }
    },
    setBookings: (state, action) => {
      state.bookings = action.payload as Booking[];
      state.loading = false;
    },
  },
});

export const { addToCart, removeFromCart, updateCartItem, clearCart, cartError } = cartSlice.actions;
export const {
  bookingStart,
  bookingSuccess,
  bookingFailure,
  updateBookingStatus,
  updatePaymentStatus,
  cancelBooking,
  setBookings
} = bookingSlice.actions;

// Types
export type RootState = {
  cart: CartState;
  booking: BookingState;
};

// Cart Selectors
export const selectCart = (state: RootState) => state.cart;
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotal = (state: RootState) => state.cart.totalAmount;
export const selectCartItemCount = (state: RootState) => state.cart.items.reduce((count, item) => count + item.quantity, 0);

// Booking Selectors
export const selectBooking = (state: RootState) => state.booking;
export const selectBookings = (state: RootState) => state.booking.bookings;

// Store
export const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    booking: bookingSlice.reducer,
  },
});

// Typed hooks
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch();

