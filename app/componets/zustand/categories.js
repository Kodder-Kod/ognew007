import { create } from 'zustand'


export const useUserCategories= create((set) => ({
    userCategories: '',
  }))
  
  
  export const useUserCategoriesTotal = create((set) => ({
    userCategoriesTotal: '',
  }))
  
  
  export const useUserCategoriesData = create((set) => ({
    userCategoriesData: '',
  }))
