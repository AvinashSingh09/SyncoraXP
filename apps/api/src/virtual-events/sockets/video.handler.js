// Map to store roomCode -> Array of { socketId, userId, userName }
const videoRoomParticipants = new Map();
// Map to store roomCode -> socketId of screen sharer
const activeScreenSharers = new Map();
// Map to store roomCode -> Array of pending users
const waitingRoomParticipants = new Map();
// Map to store roomCode -> adminUserId
const videoRoomAdmins = new Map();
// Map to store roomCode -> room locks
const videoRoomLocks = new Map();
// Map to store roomCode -> hostEmail (from DB)
const videoRoomHostEmails = new Map();

const Meeting = require('../models/meeting.model');

const defaultLocks = {
    mic: false,
    video: false,
    chat: false,
    raiseHand: false,
    reaction: false,
    shareScreen: false
};

const WebSocket = require('ws');
// Store active Gemini Live API connections.
// Key = socket.id of the listener
// Value = { ws, setupReady, audioQueue[] }
const activeLiveConnections = new Map();

function hasActiveTranslation(roomCode) {
    return Array.from(activeLiveConnections.values()).some(conn => conn.roomCode === roomCode);
}

function notifyTranslationDemand(io, roomCode) {
    if (!roomCode) return;
    io.to(roomCode).emit('video:translation-demand', { active: hasActiveTranslation(roomCode) });
}

function performJoin(io, targetSocket, uppercaseRoomCode, data) {
    const { userId, userName, isMuted = false, isVideoOff = false, userEmail = '' } = data;
    targetSocket.join(uppercaseRoomCode);
    
    if (!videoRoomParticipants.has(uppercaseRoomCode)) {
        videoRoomParticipants.set(uppercaseRoomCode, []);
        if (!videoRoomLocks.has(uppercaseRoomCode)) {
            videoRoomLocks.set(uppercaseRoomCode, { ...defaultLocks });
        }
    }
    const participants = videoRoomParticipants.get(uppercaseRoomCode);
    const roomLocks = videoRoomLocks.get(uppercaseRoomCode) || { ...defaultLocks };
    const exists = participants.some(p => p.socketId === targetSocket.id);
    let isAdmin = false;
    let effectiveIsMuted = Boolean(isMuted);
    let effectiveIsVideoOff = Boolean(isVideoOff);
    
    if (!exists) {
        // Determine admin status
        const configuredHostEmail = videoRoomHostEmails.get(uppercaseRoomCode) || '';
        const registeredAdminId = videoRoomAdmins.get(uppercaseRoomCode);

        if (configuredHostEmail) {
            // Email-based host: only the person with the matching email is host
            isAdmin = userEmail.trim().toLowerCase() === configuredHostEmail;
            if (isAdmin && !registeredAdminId) {
                videoRoomAdmins.set(uppercaseRoomCode, userId);
            }
        } else if (registeredAdminId) {
            isAdmin = registeredAdminId.toString() === userId.toString();
        } else {
            // Fallback: first person to join is host
            isAdmin = participants.length === 0;
            if (isAdmin) {
                videoRoomAdmins.set(uppercaseRoomCode, userId);
            }
        }

        // Room-wide media locks are authoritative for every non-host participant,
        // including people admitted after the host enabled the lock.
        if (!isAdmin) {
            if (roomLocks.mic) effectiveIsMuted = true;
            if (roomLocks.video) effectiveIsVideoOff = true;
        }

        participants.push({
            socketId: targetSocket.id,
            userId,
            userName,
            isMuted: effectiveIsMuted,
            isVideoOff: effectiveIsVideoOff,
            isAdmin,
            isHandRaised: false,
            isMicLocked: false,
            isVideoLocked: false
        });
    } else {
        const existingParticipant = participants.find(p => p.socketId === targetSocket.id);
        isAdmin = existingParticipant?.isAdmin || false;
        effectiveIsMuted = existingParticipant?.isMuted ?? effectiveIsMuted;
        effectiveIsVideoOff = existingParticipant?.isVideoOff ?? effectiveIsVideoOff;
    }
    
    targetSocket.emit('video:room-joined', { 
        isAdmin, 
        roomLocks
    });

    // Send these before the participant begins creating peer connections so a
    // locked microphone/camera is never briefly published to existing users.
    if (!isAdmin && roomLocks.mic) targetSocket.emit('video:force-mute');
    if (!isAdmin && roomLocks.video) targetSocket.emit('video:force-video-off');

    targetSocket.emit('video:translation-demand', { active: hasActiveTranslation(uppercaseRoomCode) });
    
    const otherUsers = participants.filter(p => p.socketId !== targetSocket.id);
    targetSocket.emit('video:all-users', otherUsers);
    
    const currentSharer = activeScreenSharers.get(uppercaseRoomCode);
    if (currentSharer) {
        targetSocket.emit('video:screen-share-started', { socketId: currentSharer });
    }
    
    targetSocket.to(uppercaseRoomCode).emit('video:user-joined', {
        socketId: targetSocket.id,
        userId,
        userName,
        isMuted: effectiveIsMuted,
        isVideoOff: effectiveIsVideoOff,
        isAdmin,
        isHandRaised: false,
        isMicLocked: false,
        isVideoLocked: false
    });

    // Broadcast authoritative participant count to everyone in room
    io.to(uppercaseRoomCode).emit('video:participant-count', { count: participants.length });

    // If the joining user is admin/host, notify them of any already-waiting participants
    if (isAdmin) {
        const waiters = waitingRoomParticipants.get(uppercaseRoomCode) || [];
        waiters.forEach(waiter => {
            targetSocket.emit('video:join-request', {
                socketId: waiter.socketId,
                userName: waiter.data.userName
            });
        });
    }
}

module.exports = (io, socket, context) => {
    socket.on('video:request-join', async (data) => {
        const uppercaseRoomCode = data.roomCode.trim().toUpperCase();
        const userEmail = (data.userEmail || '').trim().toLowerCase();

        // Load hostEmail from DB if not already cached
        if (!videoRoomHostEmails.has(uppercaseRoomCode)) {
            try {
                const meeting = await Meeting.findOne({ code: uppercaseRoomCode }).lean();
                videoRoomHostEmails.set(uppercaseRoomCode, (meeting?.hostEmail || '').trim().toLowerCase());
            } catch (e) {
                console.error('[VideoRoom] Failed to load meeting hostEmail:', e.message);
                videoRoomHostEmails.set(uppercaseRoomCode, '');
            }
        }

        const configuredHostEmail = videoRoomHostEmails.get(uppercaseRoomCode) || '';
        const participants = videoRoomParticipants.get(uppercaseRoomCode) || [];
        
        if (configuredHostEmail) {
            // --- Email-based host mode ---
            const isHost = userEmail === configuredHostEmail;
            if (isHost) {
                // Host joins directly, always
                console.log(`Socket ${socket.id} (${data.userName}) joining as designated HOST: ${uppercaseRoomCode}`);
                performJoin(io, socket, uppercaseRoomCode, { ...data, userEmail });
            } else {
                // Non-host always waits, even if room is empty
                console.log(`Socket ${socket.id} (${data.userName}) put in waiting room (host not present yet): ${uppercaseRoomCode}`);
                if (!waitingRoomParticipants.has(uppercaseRoomCode)) {
                    waitingRoomParticipants.set(uppercaseRoomCode, []);
                }
                waitingRoomParticipants.get(uppercaseRoomCode).push({ socketId: socket.id, data });

                // Notify host(s) if present
                const admins = participants.filter(p => p.isAdmin);
                if (admins.length > 0) {
                    admins.forEach(admin => {
                        io.to(admin.socketId).emit('video:join-request', {
                            socketId: socket.id,
                            userName: data.userName
                        });
                    });
                    socket.emit('video:waiting-for-host');
                } else {
                    // Host hasn't joined yet, just keep them waiting
                    socket.emit('video:waiting-for-host');
                }
            }
        } else {
            // --- Legacy mode: no hostEmail configured ---
            if (participants.length === 0) {
                console.log(`Socket ${socket.id} (User: ${data.userName}) instantly joining empty room: ${uppercaseRoomCode}`);
                performJoin(io, socket, uppercaseRoomCode, data);
            } else {
                console.log(`Socket ${socket.id} (User: ${data.userName}) waiting to join: ${uppercaseRoomCode}`);
                if (!waitingRoomParticipants.has(uppercaseRoomCode)) {
                    waitingRoomParticipants.set(uppercaseRoomCode, []);
                }
                waitingRoomParticipants.get(uppercaseRoomCode).push({ socketId: socket.id, data });
                
                const admins = participants.filter(p => p.isAdmin);
                admins.forEach(admin => {
                    io.to(admin.socketId).emit('video:join-request', {
                        socketId: socket.id,
                        userName: data.userName
                    });
                });
                
                socket.emit('video:waiting-for-host');
            }
        }
    });

    socket.on('video:admit-user', ({ roomCode, targetSocketId }) => {
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        if (!verifyAdmin(uppercaseRoomCode, socket.id)) return;
        
        const waiters = waitingRoomParticipants.get(uppercaseRoomCode) || [];
        const waitIndex = waiters.findIndex(w => w.socketId === targetSocketId);
        if (waitIndex !== -1) {
            const waiter = waiters[waitIndex];
            waiters.splice(waitIndex, 1);
            const targetSocket = io.sockets.sockets.get(targetSocketId);
            if (targetSocket) {
                targetSocket.emit('video:request-accepted');
                performJoin(io, targetSocket, uppercaseRoomCode, waiter.data);
            }
        }
    });

    socket.on('video:deny-user', ({ roomCode, targetSocketId }) => {
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        if (!verifyAdmin(uppercaseRoomCode, socket.id)) return;
        
        const waiters = waitingRoomParticipants.get(uppercaseRoomCode) || [];
        const waitIndex = waiters.findIndex(w => w.socketId === targetSocketId);
        if (waitIndex !== -1) {
            waiters.splice(waitIndex, 1);
            io.to(targetSocketId).emit('video:request-denied');
        }
    });

    // Screen sharing signaling
    socket.on('video:start-screen-share', ({ roomCode }) => {
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        if (!verifyAdmin(uppercaseRoomCode, socket.id)) {
            const locks = videoRoomLocks.get(uppercaseRoomCode) || defaultLocks;
            if (locks.shareScreen) return;
        }
        const currentSharer = activeScreenSharers.get(uppercaseRoomCode);
        if (currentSharer && currentSharer !== socket.id) {
            socket.emit('video:screen-share-rejected', { message: 'Someone is already sharing their screen' });
            return;
        }
        activeScreenSharers.set(uppercaseRoomCode, socket.id);
        io.to(uppercaseRoomCode).emit('video:screen-share-started', { socketId: socket.id });
    });

    socket.on('video:stop-screen-share', ({ roomCode }) => {
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        if (activeScreenSharers.get(uppercaseRoomCode) === socket.id) {
            activeScreenSharers.delete(uppercaseRoomCode);
            io.to(uppercaseRoomCode).emit('video:screen-share-stopped', { socketId: socket.id });
        }
    });

    socket.on('video:update-status', ({ roomCode, isMuted, isVideoOff }) => {
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        if (videoRoomParticipants.has(uppercaseRoomCode)) {
            const participants = videoRoomParticipants.get(uppercaseRoomCode);
            const p = participants.find(p => p.socketId === socket.id);
            if (p) {
                p.isMuted = isMuted;
                p.isVideoOff = isVideoOff;
            }
        }
        socket.to(uppercaseRoomCode).emit('video:status-updated', {
            socketId: socket.id,
            isMuted,
            isVideoOff
        });
    });

    // Relay signaling data between peers
    socket.on('video:send-signal', ({ targetSocketId, signalData }) => {
        console.log(`Relaying signal from ${socket.id} to ${targetSocketId}`);
        io.to(targetSocketId).emit('video:signal-received', {
            senderSocketId: socket.id,
            signalData
        });
    });

    socket.on('video:send-reaction', ({ roomCode, emoji }) => {
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        if (!verifyAdmin(uppercaseRoomCode, socket.id)) {
            const locks = videoRoomLocks.get(uppercaseRoomCode) || defaultLocks;
            if (locks.reaction) return;
        }
        io.to(uppercaseRoomCode).emit('video:receive-reaction', {
            socketId: socket.id,
            emoji
        });
    });

    // Listener enables live translation
    socket.on('video:enable-translation', ({ roomCode, languageCode, listenLanguageName }) => {
        try {
            const uppercaseRoomCode = (roomCode || '').trim().toUpperCase();
            const participants = videoRoomParticipants.get(uppercaseRoomCode) || [];
            if (!uppercaseRoomCode || !participants.some(p => p.socketId === socket.id)) {
                socket.emit('video:translation-error', { error: 'You must be in the meeting before enabling translation.' });
                return;
            }

            let key = process.env.GEMINI_KEY || process.env.GEMINI_API_KEY;
            if (!key) {
                const errMsg = 'No Gemini API key found in server environment variables (GEMINI_KEY or GEMINI_API_KEY)';
                console.error(`[LiveAPI] Setup Error: ${errMsg}`);
                socket.emit('video:translation-error', { error: errMsg });
                return;
            }
            // Sanitise key
            key = key.trim().replace(/^["']|["']$/g, '');

            // Close any existing connection for this socket
            if (activeLiveConnections.has(socket.id)) {
                const existing = activeLiveConnections.get(socket.id);
                if (existing.ws) existing.ws.close();
                activeLiveConnections.delete(socket.id);
            }

            // Resolve target language code (prefer BCP-47 code, fall back to old name-based)
            const targetLangCode = languageCode || 'hi';
            const targetLangName = listenLanguageName || targetLangCode;

            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${key}`;
            const ws = new WebSocket(url);

            // Connection state object
            const connState = { ws, setupReady: false, audioQueue: [], roomCode: uppercaseRoomCode };
            activeLiveConnections.set(socket.id, connState);
            notifyTranslationDemand(io, uppercaseRoomCode);

            ws.on('open', () => {
                const setupMessage = {
                    setup: {
                        model: "models/gemini-3.5-live-translate-preview",
                        generation_config: {
                            response_modalities: ["AUDIO"],
                            translation_config: {
                                target_language_code: targetLangCode,
                                echo_target_language: true
                            }
                        }
                    }
                };
                ws.send(JSON.stringify(setupMessage));
                console.log(`[LiveAPI] Connection opened for listener ${socket.id} → ${targetLangName} (${targetLangCode})`);
            });

            ws.on('message', (data) => {
                try {
                    const response = JSON.parse(data);

                    if (response.setupComplete) {
                        console.log(`[LiveAPI] Setup complete for listener ${socket.id}, flushing ${connState.audioQueue.length} queued chunks`);
                        
                        connState.setupReady = true;
                        // Flush any audio that arrived before setup completed
                        for (const queuedMsg of connState.audioQueue) {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(queuedMsg);
                            }
                        }
                        connState.audioQueue = [];
                    }

                    if (response.serverContent?.modelTurn?.parts) {
                        for (const part of response.serverContent.modelTurn.parts) {
                            if (part.inlineData && part.inlineData.data) {
                                socket.emit('video:receive-live-audio', {
                                    audioData: part.inlineData.data
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error(`[LiveAPI] Message parse error for listener ${socket.id}:`, e.message);
                }
            });

            ws.on('close', (code, reason) => {
                const reasonStr = reason ? reason.toString() : '';
                console.log(`[LiveAPI] Connection closed for listener ${socket.id}. Code: ${code}, Reason: ${reasonStr}`);
                if (activeLiveConnections.get(socket.id) === connState) {
                    activeLiveConnections.delete(socket.id);
                    notifyTranslationDemand(io, connState.roomCode);
                }
                if (code !== 1000 && code !== 1005) {
                    socket.emit('video:translation-error', { 
                        error: `Gemini connection closed unexpectedly (code ${code}). ${reasonStr ? 'Reason: ' + reasonStr : 'Please verify your API key is correct and active.'}` 
                    });
                }
            });
            
            ws.on('error', (err) => {
                console.error(`[LiveAPI] Error for listener ${socket.id}:`, err.message);
                socket.emit('video:translation-error', { error: `Gemini WebSocket connection error: ${err.message}` });
            });

        } catch (err) {
            console.error('[LiveAPI] Setup Error:', err.message);
            socket.emit('video:translation-error', { error: `Translation setup failed: ${err.message}` });
        }
    });

    socket.on('video:disable-translation', () => {
        if (activeLiveConnections.has(socket.id)) {
            const conn = activeLiveConnections.get(socket.id);
            if (conn.ws) conn.ws.close();
            activeLiveConnections.delete(socket.id);
            notifyTranslationDemand(io, conn.roomCode);
            console.log(`[LiveAPI] Translation disabled for listener ${socket.id}`);
        }
    });

    // Speaker broadcasts raw PCM audio to the room
    socket.on('video:broadcast-audio-chunk', ({ roomCode, pcmBase64 }) => {
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        
        // Find all users in the room
        const participants = videoRoomParticipants.get(uppercaseRoomCode) || [];
        
        socket.audioChunkCount = (socket.audioChunkCount || 0) + 1;
        if (socket.audioChunkCount % 100 === 0) {
            console.log(`[AudioChunk] Received 100 chunks from speaker ${socket.id}, relaying to listeners...`);
        }
        
        // For each participant (other than the speaker), if they have an active Live API connection, feed the audio
        for (const p of participants) {
            if (p.socketId !== socket.id) {
                const conn = activeLiveConnections.get(p.socketId);
                if (!conn) continue;

                const msg = JSON.stringify({
                    realtimeInput: {
                        mediaChunks: [{
                            mimeType: "audio/pcm;rate=16000",
                            data: pcmBase64
                        }]
                    }
                });

                if (conn.setupReady && conn.ws && conn.ws.readyState === WebSocket.OPEN) {
                    conn.ws.send(msg);
                } else if (!conn.setupReady) {
                    // Queue until setup completes (cap at 100 frames to prevent memory bloat)
                    if (conn.audioQueue.length < 100) {
                        conn.audioQueue.push(msg);
                    }
                }
            }
        }
    });


    socket.on('video:toggle-hand', ({ roomCode, isRaised }) => {
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        if (!verifyAdmin(uppercaseRoomCode, socket.id)) {
            const locks = videoRoomLocks.get(uppercaseRoomCode) || defaultLocks;
            if (locks.raiseHand && isRaised) return;
        }
        let userName = "Someone";
        
        if (videoRoomParticipants.has(uppercaseRoomCode)) {
            const p = videoRoomParticipants.get(uppercaseRoomCode).find(p => p.socketId === socket.id);
            if (p) {
                p.isHandRaised = isRaised;
                userName = p.userName;
            }
        }

        io.to(uppercaseRoomCode).emit('video:hand-toggled', {
            socketId: socket.id,
            userName,
            isRaised
        });
    });

    socket.on('video:send-chat', ({ roomCode, message, userName, timestamp }) => {
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        if (!verifyAdmin(uppercaseRoomCode, socket.id)) {
            const locks = videoRoomLocks.get(uppercaseRoomCode) || defaultLocks;
            if (locks.chat) return;
        }
        socket.to(uppercaseRoomCode).emit('video:receive-chat', {
            socketId: socket.id,
            userName,
            message,
            timestamp
        });
    });

    socket.on('video:send-speech', ({ roomCode, text, userName }) => {
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        socket.to(uppercaseRoomCode).emit('video:receive-speech', {
            socketId: socket.id,
            userName,
            text
        });
    });

    // --- Host Controls ---
    function verifyAdmin(roomCode, socketId) {
        const upperRoomCode = roomCode.trim().toUpperCase();
        if (!videoRoomParticipants.has(upperRoomCode)) return false;
        const p = videoRoomParticipants.get(upperRoomCode).find(p => p.socketId === socketId);
        return p?.isAdmin === true;
    }

    socket.on('video:host-toggle-lock', ({ roomCode, feature, isLocked }) => {
        if (!verifyAdmin(roomCode, socket.id)) return;
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        
        let locks = videoRoomLocks.get(uppercaseRoomCode);
        if (!locks) {
            locks = { ...defaultLocks };
            videoRoomLocks.set(uppercaseRoomCode, locks);
        }
        
        if (locks.hasOwnProperty(feature)) {
            locks[feature] = isLocked;
            io.to(uppercaseRoomCode).emit('video:room-locks-updated', { locks });
            
            // If mic or video is locked, force mute/video-off for non-admins
            if (feature === 'mic' && isLocked) {
                const participants = videoRoomParticipants.get(uppercaseRoomCode) || [];
                participants.forEach(p => {
                    if (!p.isAdmin) io.to(p.socketId).emit('video:force-mute');
                });
            }
            if (feature === 'video' && isLocked) {
                const participants = videoRoomParticipants.get(uppercaseRoomCode) || [];
                participants.forEach(p => {
                    if (!p.isAdmin) io.to(p.socketId).emit('video:force-video-off');
                });
            }
        }
    });

    socket.on('video:host-mute-all', ({ roomCode }) => {
        if (!verifyAdmin(roomCode, socket.id)) return;
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        socket.to(uppercaseRoomCode).emit('video:force-mute');
    });

    socket.on('video:host-end-meeting', ({ roomCode }) => {
        if (!verifyAdmin(roomCode, socket.id)) return;
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        io.to(uppercaseRoomCode).emit('video:meeting-ended');
        // Wait briefly for clients to disconnect, or forcefully empty it
        videoRoomParticipants.delete(uppercaseRoomCode);
        activeScreenSharers.delete(uppercaseRoomCode);
        videoRoomLocks.delete(uppercaseRoomCode);
        videoRoomAdmins.delete(uppercaseRoomCode);
        videoRoomHostEmails.delete(uppercaseRoomCode);
    });

    socket.on('video:host-kick-user', ({ roomCode, targetSocketId }) => {
        if (!verifyAdmin(roomCode, socket.id)) return;
        io.to(targetSocketId).emit('video:kicked');
    });

    socket.on('video:host-mute-user', ({ roomCode, targetSocketId }) => {
        if (!verifyAdmin(roomCode, socket.id)) return;
        const upperRoomCode = roomCode.trim().toUpperCase();
        if (videoRoomParticipants.has(upperRoomCode)) {
            const p = videoRoomParticipants.get(upperRoomCode).find(p => p.socketId === targetSocketId);
            if (p) p.isMicLocked = true;
        }
        io.to(targetSocketId).emit('video:force-mute');
        io.to(upperRoomCode).emit('video:locks-updated', { socketId: targetSocketId, isMicLocked: true });
    });

    socket.on('video:host-video-off-user', ({ roomCode, targetSocketId }) => {
        if (!verifyAdmin(roomCode, socket.id)) return;
        const upperRoomCode = roomCode.trim().toUpperCase();
        if (videoRoomParticipants.has(upperRoomCode)) {
            const p = videoRoomParticipants.get(upperRoomCode).find(p => p.socketId === targetSocketId);
            if (p) p.isVideoLocked = true;
        }
        io.to(targetSocketId).emit('video:force-video-off');
        io.to(upperRoomCode).emit('video:locks-updated', { socketId: targetSocketId, isVideoLocked: true });
    });

    socket.on('video:host-unlock-mic', ({ roomCode, targetSocketId }) => {
        if (!verifyAdmin(roomCode, socket.id)) return;
        const upperRoomCode = roomCode.trim().toUpperCase();
        if (videoRoomParticipants.has(upperRoomCode)) {
            const p = videoRoomParticipants.get(upperRoomCode).find(p => p.socketId === targetSocketId);
            if (p) p.isMicLocked = false;
        }
        io.to(upperRoomCode).emit('video:locks-updated', { socketId: targetSocketId, isMicLocked: false });
    });

    socket.on('video:host-unlock-video', ({ roomCode, targetSocketId }) => {
        if (!verifyAdmin(roomCode, socket.id)) return;
        const upperRoomCode = roomCode.trim().toUpperCase();
        if (videoRoomParticipants.has(upperRoomCode)) {
            const p = videoRoomParticipants.get(upperRoomCode).find(p => p.socketId === targetSocketId);
            if (p) p.isVideoLocked = false;
        }
        io.to(upperRoomCode).emit('video:locks-updated', { socketId: targetSocketId, isVideoLocked: false });
    });

    socket.on('video:host-pin-user', ({ roomCode, targetSocketId }) => {
        if (!verifyAdmin(roomCode, socket.id)) return;
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        io.to(uppercaseRoomCode).emit('video:pinned-user-updated', { socketId: targetSocketId });
    });

    socket.on('video:host-unpin-user', ({ roomCode }) => {
        if (!verifyAdmin(roomCode, socket.id)) return;
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        io.to(uppercaseRoomCode).emit('video:pinned-user-updated', { socketId: null });
    });
    // --- End Host Controls ---

    // Leave a video room
    socket.on('video:leave-room', ({ roomCode }) => {
        if (!roomCode) return;
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        
        console.log(`Socket ${socket.id} leaving video room: ${uppercaseRoomCode}`);
        socket.leave(uppercaseRoomCode);
        
        handleUserLeavingRoom(socket.id, uppercaseRoomCode);
        handleUserLeavingWaitingRoom(socket.id, uppercaseRoomCode);
    });

    // Listen to parent disconnect event to clean up rooms
    socket.on('disconnect', () => {
        // Clean up any active Gemini Live API connections for this socket
        if (activeLiveConnections.has(socket.id)) {
            const conn = activeLiveConnections.get(socket.id);
            if (conn.ws) {
                try { conn.ws.close(); } catch(e) {}
            }
            activeLiveConnections.delete(socket.id);
            notifyTranslationDemand(io, conn.roomCode);
            console.log(`[LiveAPI] Cleaned up Gemini connection on disconnect for ${socket.id}`);
        }

        // Find all rooms this socket was registered in and clean them up
        for (const [roomCode, participants] of videoRoomParticipants.entries()) {
            const hasParticipant = participants.some(p => p.socketId === socket.id);
            if (hasParticipant) {
                console.log(`Socket ${socket.id} disconnected, cleaning up video room: ${roomCode}`);
                handleUserLeavingRoom(socket.id, roomCode);
            }
        }
        
        // Clean up waiting rooms
        for (const [roomCode, waiters] of waitingRoomParticipants.entries()) {
            const hasWaiter = waiters.some(w => w.socketId === socket.id);
            if (hasWaiter) {
                console.log(`Socket ${socket.id} disconnected, cleaning up waiting room: ${roomCode}`);
                handleUserLeavingWaitingRoom(socket.id, roomCode);
            }
        }
    });

    function handleUserLeavingWaitingRoom(socketId, roomCode) {
        if (!waitingRoomParticipants.has(roomCode)) return;
        const waiters = waitingRoomParticipants.get(roomCode);
        const index = waiters.findIndex(w => w.socketId === socketId);
        if (index !== -1) {
            waiters.splice(index, 1);
            io.to(roomCode).emit('video:request-cancelled', { socketId });
        }
    }

    function handleUserLeavingRoom(socketId, roomCode) {
        if (!videoRoomParticipants.has(roomCode)) return;
        
        let participants = videoRoomParticipants.get(roomCode);
        const index = participants.findIndex(p => p.socketId === socketId);
        
        if (index !== -1) {
            const user = participants[index];
            participants.splice(index, 1);
            
            // Clean up screen sharing if this user was sharing
            if (activeScreenSharers.get(roomCode) === socketId) {
                activeScreenSharers.delete(roomCode);
                io.to(roomCode).emit('video:screen-share-stopped', { socketId });
            }
            
            // Notify others in room
            io.to(roomCode).emit('video:user-left', { socketId });
            
            // Clean up room if empty
            if (participants.length === 0) {
                videoRoomParticipants.delete(roomCode);
                activeScreenSharers.delete(roomCode);
                videoRoomLocks.delete(roomCode);
                videoRoomAdmins.delete(roomCode);
                videoRoomHostEmails.delete(roomCode);
                console.log(`Video room ${roomCode} is now empty and deleted.`);
            } else {
                videoRoomParticipants.set(roomCode, participants);
                // Broadcast authoritative participant count to remaining users
                io.to(roomCode).emit('video:participant-count', { count: participants.length });
            }
        }
    }

    // Allow clients to request a participant sync at any time
    socket.on('video:request-sync', ({ roomCode }) => {
        if (!roomCode) return;
        const uppercaseRoomCode = roomCode.trim().toUpperCase();
        const participants = videoRoomParticipants.get(uppercaseRoomCode) || [];
        // Send the requesting client the full participant list (excluding themselves)
        const otherUsers = participants.filter(p => p.socketId !== socket.id);
        socket.emit('video:all-users', otherUsers);
        socket.emit('video:participant-count', { count: participants.length });
    });
};
