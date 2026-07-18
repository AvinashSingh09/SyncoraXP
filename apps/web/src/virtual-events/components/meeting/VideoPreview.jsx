import React, { useState, useEffect, useRef } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi';

const VideoPreview = ({ onJoin, onCancel }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let activeStream = null;
        
        const initCamera = async () => {
            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error('Camera/Microphone access not supported in this browser.');
                }
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' },
                    audio: true
                });
                
                setStream(mediaStream);
                activeStream = mediaStream;

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Preview camera error:", err);
                setError(err.message || "Failed to access camera and microphone");
                // Allow them to join anyway, even if camera fails, 
                // they might just join without video/audio or it falls back to text, etc.
            }
        };

        initCamera();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        }
        setIsMuted(!isMuted);
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        }
        setIsVideoOff(!isVideoOff);
    };

    const handleJoinClick = () => {
        // Stop local preview stream before passing control to VideoCallRoom to avoid conflicts
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        onJoin(isMuted, isVideoOff);
    };
    
    const handleCancelClick = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (onCancel) onCancel();
    };

    return (
        <div className="w-full h-full flex flex-col bg-neutral-950 text-white relative items-center justify-center p-6">
            <h2 className="text-xl font-bold mb-6 text-center">Meeting Preview</h2>
            
            <div className="relative w-full max-w-md aspect-video bg-neutral-900 rounded-xl overflow-hidden shadow-lg border border-neutral-800 mb-6 flex-shrink-0">
                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <p className="text-red-400 text-sm mb-2">Could not access camera/microphone</p>
                        <p className="text-neutral-500 text-xs">{error}</p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
                        />
                        {isVideoOff && (
                            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                                <span className="text-neutral-500">Camera is off</span>
                            </div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded text-xs font-bold backdrop-blur-sm">
                            Preview {isMuted && '🔇'}
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-col w-full max-w-md gap-4">
                <div className="flex justify-center gap-4 mb-2">
                    <button
                        onClick={toggleMute}
                        className={`p-3 rounded-full border transition-all cursor-pointer ${
                            isMuted ? 'bg-red-700 border-red-600' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
                        }`}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <FiMicOff className="w-5 h-5 text-white" /> : <FiMic className="w-5 h-5 text-white" />}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`p-3 rounded-full border transition-all cursor-pointer ${
                            isVideoOff ? 'bg-red-700 border-red-600' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
                        }`}
                        title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                    >
                        {isVideoOff ? <FiVideoOff className="w-5 h-5 text-white" /> : <FiVideo className="w-5 h-5 text-white" />}
                    </button>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleCancelClick}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 transition-colors text-sm cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleJoinClick}
                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 transition-colors text-sm shadow-lg shadow-blue-500/20 cursor-pointer"
                    >
                        Join Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPreview;
