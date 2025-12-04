import React, { useEffect, useState } from 'react';
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
    const user = JSON.parse(localStorage.getItem('user'));

    // Attach local video stream
    useEffect(() => {
        if (stream && myVideo.current && callType === 'video') {
            myVideo.current.srcObject = stream;
        }
    }, [stream, callType]);

    const toggleMic = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = !micOn;
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950/50 backdrop-blur-xl">
            <div className="w-full h-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-violet-500/20">
                            {call.name ? call.name.substring(0, 2).toUpperCase() : user?.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-xl">
                                {callAccepted && !callEnded ? call.name || "User" : call.name || "Connecting..."}
                            </h3>
                            <p className="text-violet-300 text-sm flex items-center space-x-2">
                                {callAccepted && !callEnded ? (
                                    <>
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        <span>{callType === 'video' ? 'Video Call' : 'Voice Call'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                        <span>Calling...</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Video Container */}
                <div className="flex-1 relative rounded-3xl overflow-hidden bg-slate-900/50 backdrop-blur-md border border-slate-700/50 shadow-2xl">

                    {/* Main Video (Remote User) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {callAccepted && !callEnded ? (
                            callType === 'video' ? (
                                <video
                                    playsInline
                                    ref={userVideo}
                                    autoPlay
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                // Voice call - show large avatar
                                <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in">
                                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-violet-700 flex items-center justify-center text-white font-bold text-6xl shadow-2xl ring-8 ring-violet-500/30 animate-pulse-slow">
                                        {call.name ? call.name.substring(0, 2).toUpperCase() : "U"}
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-white font-bold text-2xl mb-2">{call.name || "User"}</h4>
                                        <p className="text-violet-300 flex items-center justify-center space-x-2">
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                            <span>Connected</span>
                                        </p>
                                    </div>
                                </div>
                            )
                        ) : (
                            // Calling state - show avatar with animation
                            <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in">
                                <div className="relative">
                                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-violet-700 flex items-center justify-center text-white font-bold text-6xl shadow-2xl animate-pulse-slow">
                                        {call.name ? call.name.substring(0, 2).toUpperCase() : user?.username?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="absolute inset-0 rounded-full border-4 border-violet-400 animate-ping opacity-20"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-violet-400 animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
                                </div>
                                <div className="text-center">
                                    <h4 className="text-white font-bold text-2xl mb-2">{call.name || "Calling..."}</h4>
                                    <p className="text-violet-300 flex items-center justify-center space-x-2">
                                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                        <span>Ringing...</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Picture-in-Picture (My Video) */}
                    {callAccepted && !callEnded && callType === 'video' && (
                        <div className="absolute bottom-6 right-6 w-48 h-36 rounded-2xl overflow-hidden bg-slate-950 border-2 border-violet-500/50 shadow-2xl">
                            {stream ? (
                                <video
                                    playsInline
                                    muted
                                    ref={myVideo}
                                    autoPlay
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-2xl">
                                        {user?.username?.substring(0, 2).toUpperCase()}
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white font-medium">
                                You
                            </div>
                        </div>
                    )}
                </div>

                {/* Incoming Call Modal */}
                {call.isReceivingCall && !callAccepted && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-lg z-50 animate-fade-in">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-2xl border border-violet-500/30 max-w-md w-full mx-4 animate-scale-in">
                            <div className="flex flex-col items-center space-y-6">
                                {/* Caller Avatar */}
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-violet-700 flex items-center justify-center text-white font-bold text-5xl shadow-2xl">
                                        {call.name ? call.name.substring(0, 2).toUpperCase() : "U"}
                                    </div>
                                    <div className="absolute inset-0 rounded-full border-4 border-violet-400 animate-ping opacity-20"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-violet-400 animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
                                </div>

                                {/* Caller Info */}
                                <div className="text-center">
                                    <h3 className="text-2xl text-white font-bold mb-2">{call.name}</h3>
                                    <p className="text-violet-300 mb-1">Incoming {call.callType === 'audio' ? 'Voice' : 'Video'} Call</p>
                                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
                                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse"></div>
                                        <span>Ringing...</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4 w-full justify-center pt-4">
                                    <button
                                        onClick={leaveCall}
                                        className="group flex items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-lg hover:shadow-red-500/50 hover:scale-110"
                                    >
                                        <PhoneOff size={24} className="transform group-hover:rotate-12 transition-transform" />
                                    </button>
                                    <button
                                        onClick={answerCall}
                                        className="group flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-200 shadow-xl hover:shadow-green-500/50 hover:scale-110 animate-pulse-slow"
                                    >
                                        <Phone size={28} className="transform group-hover:-rotate-12 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Control Panel */}
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        onClick={toggleMic}
                        className={`group relative p-5 rounded-full transition-all duration-200 shadow-xl ${micOn
                                ? 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50'
                                : 'bg-red-500 hover:bg-red-600 border border-red-400/50'
                            } text-white backdrop-blur-sm hover:scale-110`}
                    >
                        {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap">
                            {micOn ? 'Mute' : 'Unmute'}
                        </div>
                    </button>

                    {callType === 'video' && (
                        <button
                            onClick={toggleVideo}
                            className={`group relative p-5 rounded-full transition-all duration-200 shadow-xl ${videoOn
                                    ? 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50'
                                    : 'bg-red-500 hover:bg-red-600 border border-red-400/50'
                                } text-white backdrop-blur-sm hover:scale-110`}
                        >
                            {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap">
                                {videoOn ? 'Stop Video' : 'Start Video'}
                            </div>
                        </button>
                    )}

                    <button
                        onClick={leaveCall}
                        className="group relative p-5 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 shadow-xl hover:shadow-red-500/50 border border-red-400/50 backdrop-blur-sm hover:scale-110"
                    >
                        <PhoneOff size={24} className="transform group-hover:rotate-12 transition-transform" />
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap">
                            End Call
                        </div>
                    </button>
                </div>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { 
                        opacity: 0; 
                        transform: scale(0.9);
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1);
                    }
                }
                @keyframes pulse-slow {
                    0%, 100% { 
                        opacity: 1; 
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 0.8; 
                        transform: scale(1.05);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                .animate-scale-in {
                    animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .animate-pulse-slow {
                    animation: pulse-slow 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default VideoCall;
