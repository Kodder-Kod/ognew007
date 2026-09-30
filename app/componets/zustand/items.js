 import { create } from 'zustand'


export const useUserItems = create((set) => ({
    userItems: '',
  }))
  
  
  export const useUserItemsTotal = create((set) => ({
    userItemsTotal: '',
  }))
  
  
  export const useUserItemsData = create((set) => ({
    userItemsData: '',
  }))
