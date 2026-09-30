 import { create } from 'zustand'


export const useUserCartReceipt = create((set) => ({
    userCartReceipt:[],
  }))
  
  
  export const useUserCartTotalReceipt = create((set) => ({
    userCartTotalReceipt: '',
  }))
  