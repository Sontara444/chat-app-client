import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Hash, Plus, LogOut, MessageSquare, UserPlus, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
    const { channels, currentChannel, setCurrentChannel, createChannel, joinChannel, leaveChannel } = useChat();
    const [isCreating, setIsCreating] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (newChannelName.trim()) {
            try {
                const newChannel = await createChannel(newChannelName);
                setCurrentChannel(newChannel);
                setNewChannelName('');
                setIsCreating(false);
            } catch (error) {
                alert('Failed to create channel');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    }

    const handleJoin = async (e, channelId) => {
        e.stopPropagation();
        try {
            await joinChannel(channelId);
        } catch (error) {
            console.error("Failed to join channel", error);
        }
    }

    const handleLeave = async (e, channelId) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to leave this channel?')) {
            try {
                await leaveChannel(channelId);
            } catch (error) {
                console.error("Failed to leave channel", error);
            }
        }
    }

    return (
        <div className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800 shadow-xl z-10">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
                <div className="bg-violet-600 p-2 rounded-lg shadow-lg shadow-violet-500/20">
                    <MessageSquare size={20} className="text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">Chat App</span>
            </div>

            {/* Channels List */}
            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-2 flex justify-between items-center text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Channels</span>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="hover:text-violet-400 transition-colors p-1 rounded hover:bg-slate-800"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreateChannel} className="px-4 mb-4">
                        <input
                            type="text"
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
                            placeholder="channel-name"
                            className="w-full bg-slate-800 text-slate-200 text-sm rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-violet-500 transition-all placeholder-slate-500"
                            autoFocus
                        />
                    </form>
                )}

                <div className="space-y-1 px-2">
                    {channels.map((channel) => {
                        const isMember = channel.members.some(m => m._id === currentUser?.id || m === currentUser?.id);
                        return (
                            <div key={channel._id} className="group relative">
                                <button
                                    onClick={() => setCurrentChannel(channel)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${currentChannel?._id === channel._id
                                            ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                        }`}
                                >
                                    <div className="flex items-center truncate">
                                        <Hash size={18} className={`mr-3 ${currentChannel?._id === channel._id ? 'text-violet-200' : 'text-slate-500 group-hover:text-slate-400'}`} />
                                        <span className="truncate">{channel.name}</span>
                                    </div>
                                    {isMember ? (
                                        <div className="flex items-center space-x-1">
                                            <span className="text-[10px] opacity-60">{channel.members.length}</span>
                                            <div
                                                onClick={(e) => handleLeave(e, channel._id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity cursor-pointer"
                                                title="Leave Channel"
                                            >
                                                <UserMinus size={14} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={(e) => handleJoin(e, channel._id)}
                                            className="p-1 hover:text-green-400 transition-colors cursor-pointer"
                                            title="Join Channel"
                                        >
                                            <UserPlus size={14} />
                                        </div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-all text-sm font-medium"
                >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
