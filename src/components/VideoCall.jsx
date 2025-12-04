import React, { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

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

    useEffect(() => {
        if (isCallActive || call.isReceivingCall) {
            const constraints = {
                video: callType === 'video',
                audio: true
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then((currentStream) => {
                    setStream(currentStream);
                    if (myVideo.current && callType === 'video') {
                        myVideo.current.srcObject = currentStream;
                    }
                })
                .catch(err => console.error("Failed to get media", err));
        }
    }, [isCallActive, call.isReceivingCall, callType]);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-4xl relative flex flex-col items-center">

                {/* Header */}
                <div className="absolute top-4 left-4 text-white font-bold text-lg z-10">
                    {callAccepted && !callEnded ? (callType === 'video' ? "Video Call" : "Voice Call") : "Calling..."}
                </div>

                {/* Video Container */}
                <div className="flex flex-col md:flex-row gap-4 w-full h-[60vh] md:h-[500px] relative">

                    {/* My Video */}
                    <div className="flex-1 bg-black rounded-xl overflow-hidden relative border border-slate-700 flex items-center justify-center">
                        {callType === 'video' && stream ? (
                            <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-3xl">
                                You
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">You</div>
                    </div>

                    {/* User Video */}
                    {callAccepted && !callEnded && (
                        <div className="flex-1 bg-black rounded-xl overflow-hidden relative border border-slate-700 flex items-center justify-center">
                            {callType === 'video' ? (
                                <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-3xl">
                                    {call.name ? call.name.substring(0, 2).toUpperCase() : "U"}
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">{call.name || "User"}</div>
                        </div>
                    )}
                </div>

                {/* Incoming Call Notification */}
                {call.isReceivingCall && !callAccepted && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 p-6 rounded-xl shadow-2xl border border-violet-500 z-20 text-center">
                        <h3 className="text-xl text-white font-bold mb-2">{call.name} is calling...</h3>
                        <p className="text-slate-400 mb-4">{call.callType === 'audio' ? 'Voice Call' : 'Video Call'}</p>
                        <div className="flex gap-4 justify-center mt-4">
                            <button onClick={answerCall} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold transition-colors">
                                Answer
                            </button>
                            <button onClick={leaveCall} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold transition-colors">
                                Decline
                            </button>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="flex gap-4 mt-6">
                    <button onClick={toggleMic} className={`p-4 rounded-full ${micOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors`}>
                        {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>
                    {callType === 'video' && (
                        <button onClick={toggleVideo} className={`p-4 rounded-full ${videoOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors`}>
                            {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
                        </button>
                    )}
                    <button onClick={leaveCall} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors">
                        <PhoneOff size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
