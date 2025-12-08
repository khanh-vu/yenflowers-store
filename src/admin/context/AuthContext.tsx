// ==========================================
// Auth Context - Manages authentication state
// ==========================================

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

const API_BASE = 'http://localhost:8000/api/v1';

interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
    const [isLoading, setIsLoading] = useState(true);

    // Check token on mount
    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('admin_token');
            if (storedToken) {
                try {
                    const response = await fetch(`${API_BASE}/auth/me?token=${storedToken}`);
                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                        setToken(storedToken);
                    } else {
                        // Token invalid
                        localStorage.removeItem('admin_token');
                        setToken(null);
                    }
                } catch {
                    localStorage.removeItem('admin_token');
                    setToken(null);
                }
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Đăng nhập thất bại');
        }

        const data = await response.json();
        localStorage.setItem('admin_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            isAuthenticated: !!user,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
