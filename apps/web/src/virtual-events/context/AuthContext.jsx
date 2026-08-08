import { createContext, useState, useEffect, useContext } from 'react';
import socket from '../services/socket';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            if (token && storedUser) {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                try {
                    const res = await authService.getProfile();
                    if (res.data && res.data.user) {
                        setUser(res.data.user);
                        localStorage.setItem('user', JSON.stringify(res.data.user));
                    }
                } catch (err) {
                    console.error('Failed to sync profile on mount', err);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    useEffect(() => {
        if (user) {
            const handleConnect = () => {
                socket.emit('user-online', user._id || user.id);
            };

            if (socket.connected) {
                handleConnect();
            }

            socket.on('connect', handleConnect);
            return () => {
                socket.off('connect', handleConnect);
            };
        }
    }, [user]);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const logout = () => {
        if (user) {
            socket.emit('user-offline', user._id || user.id);
        }
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
