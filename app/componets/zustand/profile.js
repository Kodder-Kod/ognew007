import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Persisted user ID store
export const useUserID = create(
  persist(
    (set) => ({
      userID: '',
      setUserID: (id) => set({ userID: id }),
    }),
    { name: 'userID-storage' } // Key for localStorage
  )
);

// Persisted user name store
export const useUserName = create(
  persist(
    (set) => ({
      userName: '',
      setUserName: (name) => set({ userName: name }),
    }),
    { name: 'userName-storage' }
  )
);

export const useUserAccountName = create(
  persist(
    (set) => ({
      userAccountName: '',
      setUserAccountName: (name) => set({ userAccountName: name }),
    }),
    { name: 'userAcountName-storage' }
  )
);


// Persisted user email store
export const useUserEmail = create(
  persist(
    (set) => ({
      userEmail: '',
      setUserEmail: (email) => set({ userEmail: email }),
    }),
    { name: 'userEmail-storage' }
  )
);

// Persisted user phone store
export const useUserPhone = create(
  persist(
    (set) => ({
      userPhone: '',
      setUserPhone: (phone) => set({ userPhone: phone }),
    }),
    { name: 'userPhone-storage' }
  )
);


export const useUserRole = create(
  persist(
    (set) => ({
      userRole: '',
      setUserRole: (role) => set({ userRole: role }),
    }),
    { name: 'userRole-storage' }
  )
);

