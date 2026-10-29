'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Tokens, apiFetch, clearTokens, getTokens, setTokens, logoutUser } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    isAuthenticated: boolean;
    isLoading: boolean;
    /** True when the backend sets must_change_password=true (e.g. first-login forced change). */
    mustChangePassword: boolean;
    logout: () => void;
    loginSession: (tokens: Tokens, userData: User) => void;
    checkAuth: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // Synchronously hydrate from localStorage so initial render already has user session
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('auth_user');
                if (stored) return JSON.parse(stored);
            } catch {
                return null;
            }
        }
        return null;
    });

    const [isLoading, setIsLoading] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const tokens = getTokens();
            const stored = localStorage.getItem('auth_user');
            if (tokens?.access && stored) return false;
        }
        return true;
    });

    const loginSession = useCallback((tokens: Tokens, userData: User) => {
        setTokens(tokens);
        setUser(userData);
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_user', JSON.stringify(userData));
        }
        setIsLoading(false);
    }, []);

    const checkAuth = async (): Promise<User | null> => {
        const tokens = getTokens();
        if (!tokens?.access) {
            setUser(null);
            if (typeof window !== 'undefined') localStorage.removeItem('auth_user');
            setIsLoading(false);
            return null;
        }

        const { data, status } = await apiFetch<User>('/api/auth/me/');
        if (status === 200 && data) {
            setUser(data);
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth_user', JSON.stringify(data));
            }
            
            // Sync backend preferred language to cookie if cookie doesn't exist
            if (data.preferred_language && typeof document !== 'undefined') {
                const hasCookie = document.cookie.includes('NEXT_LOCALE=');
                if (!hasCookie) {
                    document.cookie = `NEXT_LOCALE=${data.preferred_language}; path=/; maxAge=${60 * 60 * 24 * 365}; SameSite=Lax`;
                }
            }
            
            setIsLoading(false);
            return data;
        } else if (status === 401) {
            // ONLY 401 Unauthorized means the token is genuinely invalid or expired
            setUser(null);
            clearTokens();
            setIsLoading(false);
            return null;
        } else {
            // Non-401 errors (e.g. 500, network offline, cold start timeout)
            // DO NOT wipe the user session if we already have a cached user or valid token
            console.warn('Backend verification returned status:', status, 'preserving session.');
            setIsLoading(false);
            return user;
        }
    };

    useEffect(() => {
        checkAuth();

        const handleUnauthorized = () => {
            setUser(null);
            clearTokens();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    const logout = useCallback(async () => {
        const tokens = getTokens();
        if (tokens?.refresh) {
            await logoutUser(tokens.refresh).catch(() => {});
        }
        clearTokens();
        setUser(null);
        window.location.href = '/login';
    }, []);

    const value = {
        user,
        setUser,
        isAuthenticated: !!user,
        isLoading,
        mustChangePassword: !!user?.must_change_password,
        logout,
        loginSession,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
