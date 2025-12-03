import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Hash, Plus, LogOut, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
    const { channels, currentChannel, setCurrentChannel, createChannel } = useChat();
    const [isCreating, setIsCreating] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const navigate = useNavigate();

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (newChannelName.trim()) {
            try {
                const newChannel = await createChannel(newChannelName);
                console.log(newChannel);
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
        navigate('/login');
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
                    {channels.map((channel) => (
                        <button
                            key={channel._id}
                            onClick={() => setCurrentChannel(channel)}
                            className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group ${currentChannel?._id === channel._id
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                }`}
                        >
                            <Hash size={18} className={`mr-3 ${currentChannel?._id === channel._id ? 'text-violet-200' : 'text-slate-500 group-hover:text-slate-400'}`} />
                            <span className="truncate">{channel.name}</span>
                        </button>
                    ))}
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
