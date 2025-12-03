import { createContext, useContext, useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
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

    // Initialize Socket
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const newSocket = io('http://localhost:5000', {
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
                setMessages((prev) => [...prev, message]);
            }
        });

        socket.on('online_users', (users) => {
            setOnlineUsers(users);
        });

        return () => {
            socket.off('receive_message');
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
                    const response = await api.get(`/messages/${currentChannel._id}`);
                    setMessages(response.data);
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

    const createChannel = async (name, description) => {
        try {
            const response = await api.post('/channels', { name, description });
            setChannels([...channels, response.data]);
            return response.data;
        } catch (error) {
            console.error("Error creating channel", error);
            throw error;
        }
    }

    const value = {
        socket,
        channels,
        currentChannel,
        setCurrentChannel,
        messages,
        sendMessage,
        createChannel,
        onlineUsers,
        loading
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
