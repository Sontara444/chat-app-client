import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { useChat } from '../context/ChatContext';
import { Send, Hash, MoreVertical, Phone, Video, ArrowUp, Edit2, Trash2, Search, X, Smile } from 'lucide-react';
import MessageStatusIndicator from './MessageStatusIndicator';
import EmojiPicker from 'emoji-picker-react';

import VideoCall from './VideoCall';

const ChatArea = ({ onOpenSidebar }) => {
    const { currentChannel, messages, sendMessage, loadMoreMessages, hasMore, typingUsers, sendTyping, editMessage, deleteMessage, leaveChannel, onlineUsers, callUser, markMessagesAsRead } = useChat();
    const [newMessage, setNewMessage] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showCallModal, setShowCallModal] = useState(false);
    const [callType, setCallType] = useState('video');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const menuRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const inputRef = useRef(null);
    const isAtBottomRef = useRef(true);
    const user = JSON.parse(localStorage.getItem('user'));

    // Close menu and emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLeaveChannel = async () => {
        if (confirm(`Are you sure you want to leave #${currentChannel.name}?`)) {
            try {
                await leaveChannel(currentChannel._id);
                setShowMenu(false);
            } catch (error) {
                console.error("Failed to leave channel", error);
            }
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Simple: scroll to bottom when channel changes
    useEffect(() => {
        if (currentChannel && messages.length > 0) {
            setTimeout(() => scrollToBottom(), 100);
        }
    }, [currentChannel?._id]);

    // Simple: auto-scroll when new messages arrive (if at bottom)
    const previousCount = useRef(0);
    useEffect(() => {
        if (messages.length > previousCount.current) {
            const container = messagesContainerRef.current;
            if (container) {
                const { scrollTop, scrollHeight, clientHeight } = container;
                const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
                if (isAtBottom) {
                    setTimeout(() => scrollToBottom(), 50);
                }
            }
        }
        previousCount.current = messages.length;
    }, [messages.length]);

    // Simple: load more messages on scroll to top
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        let loading = false;

        const handleScroll = () => {
            if (container.scrollTop < 50 && hasMore && !loading) {
                loading = true;
                const oldHeight = container.scrollHeight;
                const oldScroll = container.scrollTop;

                loadMoreMessages().then(() => {
                    setTimeout(() => {
                        container.scrollTop = oldScroll + (container.scrollHeight - oldHeight);
                        loading = false;
                    }, 10);
                }).catch(() => {
                    loading = false;
                });
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, loadMoreMessages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage);
            setNewMessage('');
            sendTyping(false);
            // Smooth scroll will happen automatically via useEffect
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

    // Debounced live search
    useEffect(() => {
        if (!searchQuery.trim() || !currentChannel) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await api.get(`/messages/search?query=${searchQuery}&channelId=${currentChannel._id}`);
                setSearchResults(response.data);
            } catch (error) {
                console.error("Search error", error);
            } finally {
                setIsSearching(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery, currentChannel]);

    // Helper function to format date sections
    const formatDateSection = (date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const messageDate = new Date(date);

        // Reset time parts for comparison
        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        messageDate.setHours(0, 0, 0, 0);

        if (messageDate.getTime() === today.getTime()) {
            return 'Today';
        } else if (messageDate.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
    };

    // Helper function to check if we should show timestamp
    const shouldShowTimestamp = (currentMsg, nextMsg, index) => {
        if (!nextMsg) return true; // Always show on last message in cluster

        const currentTime = new Date(currentMsg.timestamp);
        const nextTime = new Date(nextMsg.timestamp);
        const timeDiff = (nextTime - currentTime) / 1000 / 60; // difference in minutes

        // Show timestamp if more than 5 minutes gap or different sender
        return timeDiff > 5 || currentMsg.sender._id !== nextMsg.sender._id;
    };

    // Group messages by day
    const groupedMessages = React.useMemo(() => {
        const groups = [];
        let currentGroup = null;

        messages.forEach((msg, index) => {
            const msgDate = new Date(msg.timestamp);
            msgDate.setHours(0, 0, 0, 0);
            const dateKey = msgDate.getTime();

            if (!currentGroup || currentGroup.dateKey !== dateKey) {
                currentGroup = {
                    dateKey,
                    dateLabel: formatDateSection(msg.timestamp),
                    messages: []
                };
                groups.push(currentGroup);
            }

            currentGroup.messages.push({ ...msg, originalIndex: index });
        });

        return groups;
    }, [messages]);

    // Simple: mark messages as read when viewing channel
    useEffect(() => {
        if (!currentChannel || !messages.length || !user) return;

        const unreadMessages = messages
            .filter(msg => msg.sender._id !== user.id)
            .map(msg => msg._id);

        if (unreadMessages.length > 0) {
            const timer = setTimeout(() => {
                markMessagesAsRead(unreadMessages);
            }, 1000); // Mark as read after 1 second

            return () => clearTimeout(timer);
        }
    }, [currentChannel?._id, messages.length]);

    if (!currentChannel) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-8 relative">
                {/* Mobile Menu Button for Empty State */}
                <button
                    onClick={onOpenSidebar}
                    className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white lg:hidden"
                >
                    <div className="space-y-1.5">
                        <span className="block w-6 h-0.5 bg-current"></span>
                        <span className="block w-6 h-0.5 bg-current"></span>
                        <span className="block w-6 h-0.5 bg-current"></span>
                    </div>
                </button>

                <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 text-center max-w-md w-full mx-4">
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
        <div className="flex-1 flex flex-col h-full bg-slate-950 relative w-full">
            <VideoCall />

            {showCallModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCallModal(false)}>
                    <div className="bg-slate-900 p-6 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-bold text-lg">Start a Call</h3>
                            <button onClick={() => setShowCallModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {onlineUsers.filter(u => u._id !== user.id).length === 0 ? (
                                <p className="text-slate-400 text-center py-4">No other users online.</p>
                            ) : (
                                onlineUsers.filter(u => u._id !== user.id).map(onlineUser => (
                                    <button
                                        key={onlineUser._id}
                                        onClick={() => {
                                            callUser(onlineUser._id, callType);
                                            setShowCallModal(false);
                                        }}
                                        className="w-full flex items-center p-3 hover:bg-slate-800 rounded-lg transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white mr-3">
                                            {onlineUser.username?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white font-medium group-hover:text-violet-400 transition-colors">{onlineUser.username}</p>
                                            <p className="text-xs text-green-400">Online</p>
                                        </div>
                                        <div className="ml-auto">
                                            <Video size={20} className="text-slate-500 group-hover:text-violet-500" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center">
                    {/* Hamburger Menu - Visible on Mobile/Tablet */}
                    <button
                        onClick={onOpenSidebar}
                        className="mr-3 text-slate-400 hover:text-white lg:hidden focus:outline-none"
                    >
                        <div className="space-y-1.5">
                            <span className="block w-5 h-0.5 bg-current"></span>
                            <span className="block w-5 h-0.5 bg-current"></span>
                            <span className="block w-5 h-0.5 bg-current"></span>
                        </div>
                    </button>

                    <Hash size={24} className="text-violet-500 mr-2 md:mr-3 shrink-0" />
                    <div className="min-w-0">
                        <h2 className="font-bold text-white text-base md:text-lg leading-tight truncate">{currentChannel.name}</h2>
                        {currentChannel.description && (
                            <p className="text-xs text-slate-400 truncate hidden sm:block">{currentChannel.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4 text-slate-400">
                    <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`hover:text-white transition-colors ${isSearchOpen ? 'text-violet-500' : ''}`}><Search size={20} /></button>
                    <button onClick={() => { setShowCallModal(true); setCallType('audio'); }} className="hover:text-white transition-colors hidden sm:block"><Phone size={20} /></button>
                    <button onClick={() => { setShowCallModal(true); setCallType('video'); }} className="hover:text-white transition-colors hidden sm:block"><Video size={20} /></button>
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setShowMenu(!showMenu)} className="hover:text-white transition-colors">
                            <MoreVertical size={20} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-2 z-50">
                                <button
                                    onClick={handleLeaveChannel}
                                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center"
                                >
                                    <X size={14} className="mr-2" />
                                    Leave Channel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            {isSearchOpen && (
                <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center">
                    <div className="flex-1 flex flex-col relative">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search messages..."
                                className="w-full bg-slate-800 text-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500 border border-slate-700"
                            />
                            <Search size={16} className="absolute left-3 text-slate-500" />
                            {searchQuery && (
                                <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3 text-slate-500 hover:text-white">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        {isSearching && <p className="text-xs text-slate-400 mt-1">Searching...</p>}
                        {!isSearching && searchQuery && searchResults.length > 0 && (
                            <p className="text-xs text-slate-400 mt-1">{searchResults.length} result(s) found</p>
                        )}
                        {!isSearching && searchQuery && searchResults.length === 0 && (
                            <p className="text-xs text-slate-400 mt-1">No results found</p>
                        )}
                    </div>
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
                className="flex-1 overflow-y-auto p-6 space-y-6"
                ref={messagesContainerRef}
            >
                {groupedMessages.map((group) => (
                    <div key={group.dateKey}>
                        {/* Day Separator */}
                        <div className="flex items-center justify-center my-4">
                            <div className="bg-slate-800/60 px-3 py-1 rounded-full text-xs text-slate-400 font-medium">
                                {group.dateLabel}
                            </div>
                        </div>

                        {/* Messages for this day */}
                        {group.messages.map((msg, index) => {
                            const isMe = msg.sender._id === user?.id;
                            const isSameUser = index > 0 && group.messages[index - 1].sender._id === msg.sender._id;
                            const isEditing = editingMessageId === msg._id;
                            const nextMsg = group.messages[index + 1];
                            const showTimestamp = shouldShowTimestamp(msg, nextMsg, index);

                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameUser ? 'mt-1' : 'mt-4'} group/message`}
                                >
                                    {!isMe && !isSameUser && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white mr-3 shadow-lg shrink-0">
                                            {msg.sender.username?.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    {!isMe && isSameUser && <div className="w-11" />} {/* Spacer for alignment */}

                                    <div className={`max-w-[90%] md:max-w-[70%] relative`}>
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
                                            <>
                                                <div className={`px-4 py-3 rounded-2xl text-[15px] shadow-lg leading-relaxed relative group-hover/message:shadow-xl transition-all ${isMe
                                                    ? 'bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-br-md'
                                                    : 'bg-slate-800/90 text-slate-100 rounded-bl-md border border-slate-700/50'
                                                    }`}>
                                                    {msg.content}
                                                    {/* Message Actions */}
                                                    {isMe && (
                                                        <div className="absolute -top-9 right-0 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl p-1.5 flex space-x-1 opacity-0 group-hover/message:opacity-100 transition-all z-10">
                                                            <button onClick={() => handleEdit(msg)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-violet-400 transition-colors">
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button onClick={() => deleteMessage(msg._id)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Sender Name and Time - WhatsApp Style */}
                                                {showTimestamp && (
                                                    <div className={`flex items-center mt-1.5 text-[11px] ${isMe ? 'justify-end text-slate-400' : 'justify-start text-slate-500'} px-1`}>
                                                        {!isMe && <span className="font-semibold">{msg.sender.username}</span>}
                                                        {!isMe && <span className="mx-1.5 text-slate-600">•</span>}
                                                        <span className="font-normal">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {isMe && <MessageStatusIndicator status={msg.status || 'sent'} isMe={isMe} />}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

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
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <div
                            ref={emojiPickerRef}
                            className="absolute bottom-20 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden"
                        >
                            <EmojiPicker
                                onEmojiClick={(emojiData) => {
                                    setNewMessage(prev => prev + emojiData.emoji);
                                    setShowEmojiPicker(false);
                                    inputRef.current?.focus();
                                }}
                                theme="dark"
                                width={350}
                                height={400}
                            />
                        </div>
                    )}

                    {/* Emoji Button */}
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-400 transition-colors z-10"
                    >
                        <Smile size={20} />
                    </button>

                    <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder={`Message #${currentChannel.name}`}
                        className="w-full bg-slate-800 text-slate-100 rounded-xl pl-12 pr-12 py-3.5 outline-none resize-none h-14 focus:ring-2 focus:ring-violet-500/50"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-700 text-white p-2.5 rounded-full transition-colors">
                        <Send size={18} />
                    </button>
                </form>

            </div>
        </div>
    );
};

export default ChatArea;
