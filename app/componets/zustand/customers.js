 import { create } from 'zustand'


export const useUserCustomers = create((set) => ({
    userCustomers: '',
  }))
  
  
  export const useUserCustomersTotal = create((set) => ({
    userCustomersTotal: '',
  }))
  
  
  export const useUserCustomersData = create((set) => ({
    userCustomersData: '',
  }))
