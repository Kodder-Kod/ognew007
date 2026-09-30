 import { create } from 'zustand'


export const useUserTicket = create((set) => ({
    userTicket: '',
  }))
  
  
  export const useUserTicketTotal = create((set) => ({
    userTicketTotal: '',
  }))
  
  
  export const useUserTicketData = create((set) => ({
    userTicketData: '',
  }))
