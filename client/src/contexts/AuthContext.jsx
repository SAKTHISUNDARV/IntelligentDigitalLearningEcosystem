/* eslint-disable react-refresh/only-export-components */
// contexts/AuthContext.jsx — Global auth state with JWT + localStorage persistence
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const readStoredAuth = () => {
    const storedToken = localStorage.getItem('idle_token');
    const storedUser = localStorage.getItem('idle_user');

    if (!storedToken || !storedUser) {
        return { token: null, user: null };
    }

    try {
        return {
            token: storedToken,
            user: JSON.parse(storedUser),
        };
    } catch {
        return { token: null, user: null };
    }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => readStoredAuth().user);
    const [token, setToken] = useState(() => readStoredAuth().token);
    const [ready] = useState(true); // hydration complete?

    useEffect(() => {
        if (!token) return;

        let cancelled = false;

        api.get('/auth/me')
            .then(({ data }) => {
                if (cancelled || !data) return;
                setUser(data);
                localStorage.setItem('idle_user', JSON.stringify(data));
            })
            .catch(() => {
                // Keep the locally hydrated user if the refresh fails.
            });

        return () => {
            cancelled = true;
        };
    }, [token]);

    // Keep token state in sync with interceptor-driven token refresh events
    useEffect(() => {
        function onTokenUpdated(event) {
            const nextToken = event?.detail?.token || localStorage.getItem('idle_token');
            if (nextToken) setToken(nextToken);
        }

        function onAuthCleared() {
            setToken(null);
            setUser(null);
        }

        window.addEventListener('idle:token-updated', onTokenUpdated);
        window.addEventListener('idle:auth-cleared', onAuthCleared);
        return () => {
            window.removeEventListener('idle:token-updated', onTokenUpdated);
            window.removeEventListener('idle:auth-cleared', onAuthCleared);
        };
    }, []);

    const login = useCallback(async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        const { access_token, refresh_token, user: userData } = data;

        localStorage.setItem('idle_token', access_token);
        localStorage.setItem('idle_refresh', refresh_token);
        localStorage.setItem('idle_user', JSON.stringify(userData));

        setToken(access_token);
        setUser(userData);
        window.dispatchEvent(new CustomEvent('idle:token-updated', { detail: { token: access_token } }));
        return userData;
    }, []);

    const logout = useCallback(async () => {
        try { await api.post('/auth/logout'); } catch { /* ignore */ }
        // Clear all platform-related storage
        [localStorage, sessionStorage].forEach(storage => {
            Object.keys(storage).forEach(key => {
                if (key.startsWith('idle_')) storage.removeItem(key);
            });
        });
        setToken(null);
        setUser(null);
        window.dispatchEvent(new CustomEvent('idle:auth-cleared'));
    }, []);

    const updateUser = useCallback((updates) => {
        const updated = { ...user, ...updates };
        setUser(updated);
        localStorage.setItem('idle_user', JSON.stringify(updated));
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, token, ready, login, logout, updateUser }}>
            {ready ? children : (
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <div className="spinner" />
                </div>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
