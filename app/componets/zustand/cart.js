 import { create } from 'zustand'


export const useUserCart = create((set) => ({
    userCart: '',
  }))
  
  
  export const useUserCartTotal = create((set) => ({
    userCartTotal: '',
  }))
  
  
  export const useUserCartData = create((set) => ({
    userCartData: '',
  }))
