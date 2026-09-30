 import { create } from 'zustand'


export const useUserEmployee = create((set) => ({
    userEmployee: '',
  }))
  
  
  export const useUserEmployeeTotal = create((set) => ({
    userEmployeeTotal: '',
  }))
  
  
  export const useUserEmployeeData = create((set) => ({
    userEmployeeData: '',
  }))
