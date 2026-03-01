import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UserRole = "Manager" | "Junior Dev" | null;

export interface ProvisionedUser {
    id: string;
    role: UserRole;
    pass: string;
}

interface AuthState {
    user: string | null;
    role: UserRole;
    provisionedUsers: ProvisionedUser[];
    login: (username: string, role: UserRole) => void;
    logout: () => void;
    provisionUser: (username: string, pass: string) => void;
    revokeUser: (username: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            role: null,
            provisionedUsers: [
                { id: "nidhishkk", role: "Junior Dev", pass: "12345678" } // default
            ],
            login: (username, role) => set({ user: username, role }),
            logout: () => set({ user: null, role: null }),
            provisionUser: (username, pass) => set((state) => ({
                provisionedUsers: [...state.provisionedUsers, { id: username, role: "Junior Dev", pass }]
            })),
            revokeUser: (username) => set((state) => ({
                provisionedUsers: state.provisionedUsers.filter(u => u.id !== username)
            })),
        }),
        {
            name: 'auth-storage'
        }
    )
)
