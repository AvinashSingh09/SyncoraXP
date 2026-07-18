const io = require('socket.io-client');
const fs = require('fs');

const socket = io('http://localhost:5000');

socket.on('connect', () => {
    console.log('Connected to backend:', socket.id);
    socket.emit('video:request-join', { roomCode: 'TESTROOM', userId: 'tester1', userName: 'Tester1' });
});

socket.on('video:room-joined', () => {
    console.log('Joined room');
    // Emulate sending speech (text)
    socket.emit('video:send-speech', { roomCode: 'TESTROOM', text: 'Namaste', userName: 'Tester1' });
});

socket.on('video:receive-speech', (data) => {
    console.log('Received speech:', data);
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('Conn error:', err);
    process.exit(1);
});

setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
}, 5000);
