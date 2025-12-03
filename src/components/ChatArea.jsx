import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { useChat } from '../context/ChatContext';
import { Send, Hash, MoreVertical, Phone, Video, ArrowUp, Edit2, Trash2, Search, X } from 'lucide-react';

const ChatArea = () => {
    const { currentChannel, messages, sendMessage, loadMoreMessages, hasMore, typingUsers, sendTyping, editMessage, deleteMessage } = useChat();
    const [newMessage, setNewMessage] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user')); // Get current user for bubble styling

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Scroll to bottom only on initial load or new message (not when loading more)
    useEffect(() => {
        if (messages.length <= 50) {
            scrollToBottom();
        }
    }, [messages.length, currentChannel]); // Depend on length to detect new messages, but this is a simple heuristic

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage);
            setNewMessage('');
            sendTyping(false);
            setTimeout(scrollToBottom, 100);
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (e.target.value.trim()) {
            sendTyping(true);
        } else {
            sendTyping(false);
        }
    };

    const handleEdit = (message) => {
        setEditingMessageId(message._id);
        setEditContent(message.content);
    };

    const handleSaveEdit = async () => {
        if (editContent.trim()) {
            await editMessage(editingMessageId, editContent);
            setEditingMessageId(null);
            setEditContent('');
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await api.get(`/messages/search?query=${searchQuery}&channelId=${currentChannel._id}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error("Search error", error);
        } finally {
            setIsSearching(false);
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
                    <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`hover:text-white transition-colors ${isSearchOpen ? 'text-violet-500' : ''}`}><Search size={20} /></button>
                    <button className="hover:text-white transition-colors"><Phone size={20} /></button>
                    <button className="hover:text-white transition-colors"><Video size={20} /></button>
                    <button className="hover:text-white transition-colors"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Search Bar */}
            {isSearchOpen && (
                <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center">
                    <form onSubmit={handleSearch} className="flex-1 flex items-center relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search messages..."
                            className="w-full bg-slate-800 text-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500 border border-slate-700"
                        />
                        <Search size={16} className="absolute left-3 text-slate-500" />
                        {searchResults.length > 0 && (
                            <button type="button" onClick={() => setSearchResults([])} className="absolute right-3 text-slate-500 hover:text-white">
                                <X size={16} />
                            </button>
                        )}
                    </form>
                </div>
            )}

            {/* Search Results Overlay */}
            {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-32 left-0 right-0 bottom-0 bg-slate-950/95 z-20 p-6 overflow-y-auto">
                    <div className="max-w-3xl mx-auto space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-bold">Search Results ({searchResults.length})</h3>
                            <button onClick={() => setSearchResults([])} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        {searchResults.map(msg => (
                            <div key={msg._id} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className="text-sm font-bold text-violet-400">{msg.sender.username}</span>
                                    <span className="text-xs text-slate-500">{new Date(msg.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-slate-300">{msg.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                ref={messagesContainerRef}
            >
                {hasMore && (
                    <div className="flex justify-center">
                        <button
                            onClick={loadMoreMessages}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1 rounded-full transition-colors flex items-center"
                        >
                            <ArrowUp size={12} className="mr-1" />
                            Load older messages
                        </button>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isMe = msg.sender._id === user?.id;
                    const isSameUser = index > 0 && messages[index - 1].sender._id === msg.sender._id;
                    const isEditing = editingMessageId === msg._id;

                    return (
                        <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameUser ? 'mt-1' : 'mt-4'} group/message`}>
                            {!isMe && !isSameUser && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white mr-3 shadow-lg shrink-0">
                                    {msg.sender.username?.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            {!isMe && isSameUser && <div className="w-11" />} {/* Spacer for alignment */}

                            <div className={`max-w-[70%] relative`}>
                                {!isSameUser && !isMe && (
                                    <div className="flex items-baseline mb-1 ml-1">
                                        <span className="text-xs font-bold text-slate-300 mr-2">{msg.sender.username}</span>
                                        <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                )}

                                {isEditing ? (
                                    <div className="flex flex-col space-y-2">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="bg-slate-800 text-slate-200 rounded-xl p-3 text-sm border border-violet-500 outline-none w-full min-w-[200px]"
                                            rows="2"
                                        />
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => setEditingMessageId(null)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
                                            <button onClick={handleSaveEdit} className="text-xs bg-violet-600 text-white px-3 py-1 rounded-md hover:bg-violet-500">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-md leading-relaxed relative group-hover/message:shadow-lg transition-all ${isMe
                                        ? 'bg-violet-600 text-white rounded-br-none'
                                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                                        }`}>
                                        {msg.content}
                                        {/* Message Actions */}
                                        {isMe && (
                                            <div className="absolute -top-8 right-0 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1 flex space-x-1 opacity-0 group-hover/message:opacity-100 transition-opacity z-10">
                                                <button onClick={() => handleEdit(msg)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-violet-400"><Edit2 size={12} /></button>
                                                <button onClick={() => deleteMessage(msg._id)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400"><Trash2 size={12} /></button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isMe && !isSameUser && (
                                    <div className="text-[10px] text-slate-500 text-right mt-1 mr-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                {Object.keys(typingUsers).length > 0 && (
                    <div className="flex items-center space-x-2 ml-12 mt-2">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs text-slate-500">
                            {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
                <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
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
