import React, { useEffect, useState, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Phone } from 'lucide-react';

const VideoCall = () => {
    const {
        callAccepted,
        myVideo,
        userVideo,
        callEnded,
        stream,
        call,
        answerCall,
        leaveCall,
        setStream,
        isCallActive,
        callType
    } = useChat();

    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const remoteAudioRef = useRef();

    // Attach local video stream
    useEffect(() => {
        if (stream && myVideo.current && callType === 'video') {
            myVideo.current.srcObject = stream;
        }
    }, [stream, callType]);

    // Attach remote stream to audio/video elements
    useEffect(() => {
        const handleRemoteStream = (remoteStream) => {
            if (!remoteStream) return;

            if (callType === 'video' && userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }

            // Always attach audio stream for voice calls
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
                console.log('✅ Remote audio attached');
            }
        };

        // This will be called when peer.on('stream') fires in ChatContext
        // The stream is attached via the ref
    }, [callAccepted, callType]);

    // Voice activity detection
    useEffect(() => {
        if (!stream) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const detectVoice = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setIsSpeaking(average > 30);
                requestAnimationFrame(detectVoice);
            };

            detectVoice();

            return () => {
                microphone.disconnect();
                audioContext.close();
            };
        } catch (err) {
            console.error('Voice activity detection error:', err);
        }
    }, [stream]);

    const toggleMic = () => {
        if (stream) {
            stream.get AudioTracks()[0].enabled = !micOn;
            setMicOn(!micOn);
        }
    };

    const toggleVideo = () => {
        if (stream && callType === 'video') {
            stream.getVideoTracks()[0].enabled = !videoOn;
            setVideoOn(!videoOn);
        }
    };

    if (!isCallActive && !call.isReceivingCall) return null;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const remoteUserInitials = call.name ? call.name.substring(0, 2).toUpperCase() : 'U';
    const localUserInitials = currentUser.username ? currentUser.username.substring(0, 2).toUpperCase() : 'You';

    return (
        <>
            {/* Hidden audio element for remote audio stream */}
            <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 backdrop-blur-xl p-4">
                <div className="relative w-full max-w-md">

                    {/* Glass-morphism container */}
                    <div className="relative backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-8">

                        {/* Ambient glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-transparent to-blue-500/20 pointer-events-none"></div>

                        {/* Call Status Header */}
                        <div className="relative text-center mb-8">
                            <h3 className="text-white/90 font-medium text-sm mb-1">
                                {callAccepted && !callEnded ? (callType === 'video' ? "Video Call" : "Voice Call") : "Calling..."}
                            </h3>
                            <p className="text-white/60 text-xs">{call.name || 'Unknown'}</p>
                        </div>

                        {/* Main Content - Video or Avatar */}
                        <div className="relative mb-8">

                            {callType === 'video' && callAccepted && !callEnded ? (
                                /* Video Call UI */
                                <div className="space-y-4">
                                    {/* Remote Video (Large) */}
                                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                                        <video
                                            playsInline
                                            ref={userVideo}
                                            autoPlay
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 rounded-full text-white text-xs backdrop-blur-sm">
                                            {call.name || 'User'}
                                        </div>
                                    </div>

                                    {/* Local Video (Small Picture-in-Picture) */}
                                    <div className="absolute top-4 right-4 w-24 h-32 rounded-xl overflow-hidden bg-black/40 border-2 border-white/20">
                                        {stream && (
                                            <video
                                                playsInline
                                                muted
                                                ref={myVideo}
                                                autoPlay
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/50 rounded-full text-white text-[10px] backdrop-blur-sm">
                                            You
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Voice Call UI - Avatars */
                                <div className="flex flex-col items-center space-y-8 py-8">

                                    {/* Remote User Avatar (Large) */}
                                    <div className="relative">
                                        <div className={`w-40 h-40 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-5xl shadow-2xl transition-all duration-300 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
                                            {remoteUserInitials}
                                        </div>

                                        {/* Voice Activity Ripple */}
                                        {isSpeaking && (
                                            <>
                                                <div className="absolute inset-0 rounded-full bg-violet-500 animate-ping opacity-75"></div>
                                                <div className="absolute inset-0 rounded-full bg-violet-500 animate-pulse opacity-50"></div>
                                            </>
                                        )}
                                    </div>

                                    {/* Local User Avatar (Small) */}
                                    <div className="flex items-center space-x-2 text-white/60">
                                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold text-sm border-2 border-white/20">
                                            {localUserInitials}
                                        </div>
                                        <span className="text-sm">You</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Incoming Call Notification */}
                        {call.isReceivingCall && !callAccepted && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-md z-20 rounded-3xl">
                                <div className="text-center px-6 py-8">

                                    {/* Caller Avatar */}
                                    <div className="mb-6 flex justify-center">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl shadow-xl animate-pulse">
                                            {remoteUserInitials}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl text-white font-bold mb-2">{call.name}</h3>
                                    <p className="text-violet-400 mb-6 flex items-center justify-center space-x-2">
                                        <Phone size={16} className="animate-bounce" />
                                        <span>{call.callType === 'audio' ? 'Incoming Voice Call' : 'Incoming Video Call'}</span>
                                    </p>

                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={answerCall}
                                            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
                                        >
                                            <Phone size={20} />
                                            <span>Answer</span>
                                        </button>
                                        <button
                                            onClick={leaveCall}
                                            className="px-8 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
                                        >
                                            <PhoneOff size={20} />
                                            <span>Decline</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Call Controls */}
                        <div className="relative flex items-center justify-center gap-4">

                            {/* Mic Toggle */}
                            <button
                                onClick={toggleMic}
                                className={`p-4 rounded-full transition-all transform hover:scale-110 shadow-lg ${micOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                title={micOn ? "Mute" : "Unmute"}
                            >
                                {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                            </button>

                            {/* Video Toggle (only for video calls) */}
                            {callType === 'video' && (
                                <button
                                    onClick={toggleVideo}
                                    className={`p-4 rounded-full transition-all transform hover:scale-110 shadow-lg ${videoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                    title={videoOn ? "Turn off camera" : "Turn on camera"}
                                >
                                    {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
                                </button>
                            )}

                            {/* End Call */}
                            <button
                                onClick={leaveCall}
                                className="p-4 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white transition-all transform hover:scale-110 shadow-lg"
                                title="End call"
                            >
                                <PhoneOff size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VideoCall;
