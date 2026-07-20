import { io } from 'socket.io-client';

// Routes through Vite proxy /socket.io to the main Fastify service.
const SOCKET_URL = import.meta.env.VITE_VE_API_URL || window.location.origin;
const socket = io(SOCKET_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling']
});

export default socket;
