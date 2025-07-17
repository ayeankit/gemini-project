import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  phone: string;
  countryCode: string;
  isAuthenticated: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  otpSent: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setOtpSent: (sent: boolean) => void;
  logout: () => void;
  
  // OTP Methods
  sendOtp: (phone: string, countryCode: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      otpSent: false,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ isLoading: loading }),
      setOtpSent: (sent) => set({ otpSent: sent }),
      
      logout: () => set({ 
        user: null, 
        otpSent: false,
        isLoading: false 
      }),

      sendOtp: async (phone: string, countryCode: string) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        set({ 
          isLoading: false, 
          otpSent: true 
        });
        
        return true;
      },

      verifyOtp: async (otp: string) => {
        set({ isLoading: true });
        
        // Simulate API call - accept any 6-digit OTP
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (otp.length === 6) {
          const user: User = {
            id: Date.now().toString(),
            phone: '+1234567890', // This would come from the previous step
            countryCode: '+1',
            isAuthenticated: true,
          };
          
          set({ 
            user, 
            isLoading: false, 
            otpSent: false 
          });
          
          return true;
        }
        
        set({ isLoading: false });
        return false;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);