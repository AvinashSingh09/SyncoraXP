import { io } from 'socket.io-client';

// Routes through Vite proxy /socket.io → http://localhost:5000
const SOCKET_URL = import.meta.env.VITE_VE_API_URL || 'http://localhost:5000';
const socket = io(SOCKET_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling']
});

export default socket;
