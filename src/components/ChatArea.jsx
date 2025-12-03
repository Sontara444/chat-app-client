import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { Send, Hash, MoreVertical, Phone, Video } from 'lucide-react';

const ChatArea = () => {
    const { currentChannel, messages, sendMessage } = useChat();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user')); // Get current user for bubble styling

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage);
            setNewMessage('');
        }
    };

    if (!currentChannel) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-8">
                <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 text-center max-w-md w-full">
                    <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Hash size={32} className="text-violet-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to Chat App</h2>
                    <p className="text-slate-400 mb-6">Select a channel from the sidebar to start collaborating with your team.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950 relative">
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center">
                    <Hash size={24} className="text-violet-500 mr-3" />
                    <div>
                        <h2 className="font-bold text-white text-lg leading-tight">{currentChannel.name}</h2>
                        {currentChannel.description && (
                            <p className="text-xs text-slate-400">{currentChannel.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-4 text-slate-400">
                    <button className="hover:text-white transition-colors"><Phone size={20} /></button>
                    <button className="hover:text-white transition-colors"><Video size={20} /></button>
                    <button className="hover:text-white transition-colors"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {messages.map((msg, index) => {
                    const isMe = msg.sender._id === user?.id;
                    const isSameUser = index > 0 && messages[index - 1].sender._id === msg.sender._id;

                    return (
                        <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameUser ? 'mt-1' : 'mt-4'}`}>
                            {!isMe && !isSameUser && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white mr-3 shadow-lg shrink-0">
                                    {msg.sender.username?.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            {!isMe && isSameUser && <div className="w-11" />} {/* Spacer for alignment */}

                            <div className={`max-w-[70%] group relative`}>
                                {!isSameUser && !isMe && (
                                    <div className="flex items-baseline mb-1 ml-1">
                                        <span className="text-xs font-bold text-slate-300 mr-2">{msg.sender.username}</span>
                                        <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                )}

                                <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-md leading-relaxed ${isMe
                                    ? 'bg-violet-600 text-white rounded-br-none'
                                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                    }`}>
                                    {msg.content}
                                </div>

                                {isMe && !isSameUser && (
                                    <div className="text-[10px] text-slate-500 text-right mt-1 mr-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
                <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message #${currentChannel.name}`}
                        className="w-full bg-slate-800 text-slate-100 rounded-xl pl-5 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-violet-500/50 border border-slate-700 focus:border-violet-500 transition-all shadow-inner placeholder-slate-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 transition-all shadow-lg shadow-violet-500/20"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatArea;
