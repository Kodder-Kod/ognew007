 import { create } from 'zustand'


export const useUserLogs = create((set) => ({
    userLogs: '',
  }))
  
  
  export const useUserLogsTotal = create((set) => ({
    userLogsTotal: '',
  }))
  
  
  export const useUserLogsData = create((set) => ({
    userLogsData: '',
  }))
