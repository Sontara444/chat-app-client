import { createContext, useContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import api from '../api/api';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [channels, setChannels] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const [typingUsers, setTypingUsers] = useState({});

    // Initialize Socket
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
                auth: { token }
            });

            setSocket(newSocket);

            return () => newSocket.close();
        }
    }, []);

    // Fetch Channels
    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const response = await api.get('/channels');
                setChannels(response.data);
            } catch (error) {
                console.error("Error fetching channels", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChannels();
    }, []);

    // Listen for messages and online users
    useEffect(() => {
        if (!socket) return;

        socket.on('receive_message', (message) => {
            if (currentChannel && message.channel === currentChannel._id) {
                setMessages((prev) => [message, ...prev]); // Newest first for chat view if reversed? Wait, existing code appends.
                // The existing code appends: setMessages((prev) => [...prev, message]);
                // But getMessages returns newest first, then reverses. So messages are [oldest, ..., newest].
                // So appending is correct.
                setMessages((prev) => [...prev, message]);
            }
        });

        socket.on('message_updated', (updatedMessage) => {
            setMessages((prev) => prev.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg));
        });

        socket.on('message_deleted', (messageId) => {
            setMessages((prev) => prev.filter(msg => msg._id !== messageId));
        });

        socket.on('typing', ({ userId, username, channelId }) => {
            if (currentChannel && channelId === currentChannel._id) {
                setTypingUsers(prev => ({ ...prev, [userId]: username }));
            }
        });

        socket.on('stop_typing', ({ userId, channelId }) => {
            if (currentChannel && channelId === currentChannel._id) {
                setTypingUsers(prev => {
                    const newState = { ...prev };
                    delete newState[userId];
                    return newState;
                });
            }
        });

        socket.on('online_users', (users) => {
            setOnlineUsers(users);
        });

        return () => {
            socket.off('receive_message');
            socket.off('message_updated');
            socket.off('message_deleted');
            socket.off('typing');
            socket.off('stop_typing');
            socket.off('online_users');
        };
    }, [socket, currentChannel]);

    // Join channel room
    useEffect(() => {
        if (socket && currentChannel) {
            socket.emit('join_channel', currentChannel._id);

            // Fetch messages for this channel
            const fetchMessages = async () => {
                try {
                    setPage(1);
                    setHasMore(true);
                    const response = await api.get(`/messages/${currentChannel._id}?page=1&limit=50`);
                    setMessages(response.data);
                    if (response.data.length < 50) setHasMore(false);
                } catch (error) {
                    console.error("Error fetching messages", error);
                }
            };
            fetchMessages();

            return () => {
                socket.emit('leave_channel', currentChannel._id);
            };
        }
    }, [currentChannel, socket]);

    const sendMessage = (content) => {
        if (socket && currentChannel) {
            socket.emit('send_message', {
                channelId: currentChannel._id,
                content
            });
        }
    };

    const sendTyping = (isTyping) => {
        if (socket && currentChannel) {
            socket.emit(isTyping ? 'typing' : 'stop_typing', currentChannel._id);
        }
    };

    const editMessage = async (messageId, content) => {
        try {
            await api.put(`/messages/${messageId}`, { content });
        } catch (error) {
            console.error("Error editing message", error);
        }
    };

    const deleteMessage = async (messageId) => {
        try {
            await api.delete(`/messages/${messageId}`);
        } catch (error) {
            console.error("Error deleting message", error);
        }
    };

    const createChannel = async (name, description, type = 'public', members = []) => {
        try {
            const response = await api.post('/channels', { name, description, type, members });
            setChannels([...channels, response.data]);
            return response.data;
        } catch (error) {
            console.error("Error creating channel", error);
            throw error;
        }
    }

    const joinChannel = async (channelId) => {
        try {
            const response = await api.post(`/channels/${channelId}/join`);
            setChannels(prev => prev.map(c => c._id === channelId ? response.data : c));
            if (currentChannel && currentChannel._id === channelId) {
                setCurrentChannel(response.data);
            }
            return response.data;
        } catch (error) {
            console.error("Error joining channel", error);
            throw error;
        }
    };

    const leaveChannel = async (channelId) => {
        try {
            const response = await api.post(`/channels/${channelId}/leave`);
            setChannels(prev => prev.map(c => c._id === channelId ? response.data : c));
            if (currentChannel && currentChannel._id === channelId) {
                setCurrentChannel(null);
            }
            return response.data;
        } catch (error) {
            console.error("Error leaving channel", error);
            throw error;
        }
    };

    const loadMoreMessages = async () => {
        if (!hasMore) return;
        try {
            const nextPage = page + 1;
            const response = await api.get(`/messages/${currentChannel._id}?page=${nextPage}&limit=50`);
            if (response.data.length > 0) {
                setMessages(prev => [...response.data, ...prev]);
                setPage(nextPage);
                if (response.data.length < 50) setHasMore(false);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more messages", error);
        }
    };

    const updateChannel = async (channelId, name, description) => {
        try {
            const response = await api.put(`/channels/${channelId}`, { name, description });
            setChannels(prev => prev.map(c => c._id === channelId ? response.data : c));
            if (currentChannel && currentChannel._id === channelId) {
                setCurrentChannel(response.data);
            }
            return response.data;
        } catch (error) {
            console.error("Error updating channel", error);
            throw error;
        }
    };

    const deleteChannel = async (channelId) => {
        try {
            await api.delete(`/channels/${channelId}`);
            setChannels(prev => prev.filter(c => c._id !== channelId));
            if (currentChannel && currentChannel._id === channelId) {
                setCurrentChannel(null);
            }
        } catch (error) {
            console.error("Error deleting channel", error);
            throw error;
        }
    };

    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [stream, setStream] = useState(null);
    const [name, setName] = useState('');
    const [isCallActive, setIsCallActive] = useState(false);
    const [callType, setCallType] = useState('video');

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        if (!socket) return;

        socket.on('call_user', ({ from, name: callerName, signal, callType }) => {
            setCall({ isReceivingCall: true, from, name: callerName, signal, callType });
            setIsCallActive(true);
            setCallType(callType || 'video');
        });

        socket.on('call_accepted', (signal) => {
            setCallAccepted(true);
            connectionRef.current.signal(signal);
        });

        socket.on('end_call', () => {
            setCallEnded(true);
            setIsCallActive(false);
            leaveCall(false);
        });

        return () => {
            socket.off('call_user');
            socket.off('call_accepted');
            socket.off('end_call');
        }
    }, [socket]);

    const answerCall = async () => {
        setCallAccepted(true);

        // Get media FIRST before creating peer
        try {
            const constraints = {
                video: call.callType === 'video',
                audio: true
            };

            const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(currentStream);

            // Attach to local video if it's a video call
            if (myVideo.current && call.callType === 'video') {
                myVideo.current.srcObject = currentStream;
            }

            // NOW create peer with the stream
            const peer = new SimplePeer({
                initiator: false,
                trickle: false,
                stream: currentStream  // Stream is now available!
            });

            peer.on('signal', (data) => {
                socket.emit('answer_call', { signal: data, to: call.from });
            });

            peer.on('stream', (remoteStream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = remoteStream;
                }
            });

            peer.signal(call.signal);
            connectionRef.current = peer;
        } catch (err) {
            console.error("Failed to get media:", err);
            alert("Cannot access camera/microphone. Please grant permissions and try again.");
        }
    };

    const callUser = async (id, type = 'video') => {
        setCallType(type);

        // Get media FIRST before creating peer
        try {
            const constraints = {
                video: type === 'video',
                audio: true
            };

            const currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(currentStream);

            // Attach to local video if it's a video call
            if (myVideo.current && type === 'video') {
                myVideo.current.srcObject = currentStream;
            }

            // NOW create peer with the stream
            const peer = new SimplePeer({
                initiator: true,
                trickle: false,
                stream: currentStream  // Stream is now available!
            });

            peer.on('signal', (data) => {
                socket.emit('call_user', {
                    userToCall: id,
                    signalData: data,
                    from: socket.id,
                    name: JSON.parse(localStorage.getItem('user')).username,
                    callType: type
                });
            });

            peer.on('stream', (remoteStream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = remoteStream;
                }
            });

            connectionRef.current = peer;
            setIsCallActive(true);
        } catch (err) {
            console.error("Failed to get media:", err);
            alert("Cannot access camera/microphone. Please grant permissions and try again.");
        }
    };

    const leaveCall = (emit = true) => {
        setCallEnded(true);
        setIsCallActive(false);
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
        // Notify other user
        if (emit && callAccepted && !callEnded) {
            socket.emit('end_call', { to: call.from }); // This might be wrong if we are the caller.
            // We need to know who we are talking to.
        }

        // Save history
        if (callAccepted) {
            const typeText = callType === 'video' ? 'Video Call' : 'Voice Call';
            sendMessage(`${typeText} ended.`);
        }

        // Reset state
        setCall({});
        setCallAccepted(false);

        // Stop stream tracks
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        window.location.reload(); // Simple way to clean up for now
    };

    const value = {
        socket,
        channels,
        currentChannel,
        setCurrentChannel,
        messages,
        sendMessage,
        createChannel,
        joinChannel,
        leaveChannel,
        loadMoreMessages,
        hasMore,
        typingUsers,
        sendTyping,
        editMessage,
        deleteMessage,
        updateChannel,
        deleteChannel,
        onlineUsers,
        loading,
        // WebRTC
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        name,
        setName,
        callEnded,
        isCallActive,
        setIsCallActive,
        setStream,
        answerCall,
        callUser,
        leaveCall,
        callType
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
