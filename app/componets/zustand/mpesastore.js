// store/mpesaStore.js
import { create } from 'zustand';

export const useMpesaStore = create((set) => ({
  currentTransactionId: null, // track the active transaction
  callbackData: null,
  setCurrentTransactionId: (id) => set({ currentTransactionId: id, callbackData: null }),
  setCallbackData: (data) => set({ callbackData: data }),
}));
