import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import {
    Hash, Plus, LogOut, MessageSquare,
    UserPlus, Lock, Users, Settings, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const Sidebar = ({ isOpen, onClose }) => {

    const {
        channels,
        currentChannel,
        setCurrentChannel,
        createChannel,
        joinChannel,
        leaveChannel,
        updateChannel,
        deleteChannel
    } = useChat();

    const [isCreating, setIsCreating] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [hoveredChannelId, setHoveredChannelId] = useState(null);

    const [contextMenu, setContextMenu] = useState({
        isOpen: false, x: 0, y: 0, channelId: null
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [channelToEdit, setChannelToEdit] = useState(null);
    const [channelToDelete, setChannelToDelete] = useState(null);

    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const contextMenuRef = useRef(null);
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    // Fetch users for private channels
    useEffect(() => {
        if (isCreating && isPrivate) {
            const fetchUsers = async () => {
                try {
                    const response = await api.get('/auth/users');
                    setAllUsers(response.data.filter(u => u._id !== currentUser.id));
                } catch (error) {
                    console.error("Failed to fetch users", error);
                }
            };
            fetchUsers();
        }
    }, [isCreating, isPrivate]);

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                setContextMenu({ isOpen: false, x: 0, y: 0, channelId: null });
            }
        };

        if (contextMenu.isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [contextMenu.isOpen]);

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (!newChannelName.trim()) return;
        try {
            const newChannel = await createChannel(
                newChannelName,
                '',
                isPrivate ? 'private' : 'public',
                selectedMembers
            );

            setCurrentChannel(newChannel);
            setIsCreating(false);
            setNewChannelName('');
            setIsPrivate(false);
            setSelectedMembers([]);

            // Close sidebar on mobile after selection
            if (window.innerWidth < 1024) {
                onClose && onClose();
            }

        } catch (error) {
            alert('Failed to create channel');
        }
    };

    const toggleMember = (userId) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleJoin = async (e, channelId) => {
        e.stopPropagation();
        await joinChannel(channelId);
    };

    const handleGearClick = (e, channel) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu({
            isOpen: true,
            x: rect.left,
            y: rect.bottom + 5,
            channelId: channel._id
        });
    };

    const handleEditChannel = () => {
        const channel = channels.find(c => c._id === contextMenu.channelId);
        setChannelToEdit(channel);
        setEditName(channel.name);
        setEditDescription(channel.description || '');
        setIsEditModalOpen(true);
        setContextMenu({ isOpen: false, x: 0, y: 0, channelId: null });
    };

    const handleDeleteChannel = () => {
        setChannelToDelete(contextMenu.channelId);
        setIsDeleteModalOpen(true);
        setContextMenu({ isOpen: false, x: 0, y: 0, channelId: null });
    };

    const handleSaveEdit = async () => {
        try {
            await updateChannel(channelToEdit._id, editName, editDescription);
            setIsEditModalOpen(false);
            setChannelToEdit(null);
        } catch (error) {
            alert('Failed to update channel. Please try again.');
            console.error('Error updating channel:', error);
        }
    };

    const handleConfirmDelete = async () => {
        await deleteChannel(channelToDelete);
        setIsDeleteModalOpen(false);
        setChannelToDelete(null);
    };

    const handleChannelSelect = (channel) => {
        setCurrentChannel(channel);
        // Close sidebar on mobile when channel is selected
        if (window.innerWidth < 1024) {
            onClose && onClose();
        }
    };

    return (
        <div className={`
            fixed inset-y-0 left-0 z-30 w-4/5 max-w-xs bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800 shadow-xl transition-transform duration-300 ease-in-out
            lg:relative lg:translate-x-0 lg:w-64
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>

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

                    {/* Create button */}
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="hover:text-violet-400 transition-colors p-1 rounded hover:bg-slate-800"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {/* Create Modal */}
                {isCreating && (
                    <div className="px-4 mb-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700 mx-2">

                        <form onSubmit={handleCreateChannel} className="space-y-3">

                            <input
                                type="text"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                placeholder="Channel name"
                                className="w-full bg-slate-900 text-slate-200 text-sm rounded-md px-3 py-2 outline-none 
                                border border-slate-700 focus:border-violet-500 transition-all"
                            />

                            {/* Private / Public */}
                            <button
                                type="button"
                                onClick={() => setIsPrivate(!isPrivate)}
                                className={`flex items-center text-xs px-2 py-1 rounded transition-colors 
                                ${isPrivate ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                            >
                                {isPrivate ? <Lock size={12} className="mr-1" /> : <Hash size={12} className="mr-1" />}
                                {isPrivate ? 'Private' : 'Public'}
                            </button>

                            {/* Member list */}
                            {isPrivate && (
                                <div className="max-h-32 overflow-y-auto space-y-1 border border-slate-700 
                                rounded p-1 bg-slate-900">
                                    {allUsers.map(user => {
                                        if (!user || !user._id) return null;
                                        return (
                                            <div
                                                key={user._id}
                                                onClick={() => toggleMember(user._id)}
                                                className={`flex items-center px-2 py-1 rounded cursor-pointer text-xs 
                                            ${selectedMembers.includes(user._id)
                                                        ? 'bg-violet-900/50 text-violet-200'
                                                        : 'hover:bg-slate-800 text-slate-300'
                                                    }`}
                                            >
                                                <div className={`w-3 h-3 rounded-full mr-2 border 
                                                ${selectedMembers.includes(user._id)
                                                        ? 'bg-violet-500 border-violet-500'
                                                        : 'border-slate-500'
                                                    }`}
                                                ></div>
                                                {user.username}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-slate-400 hover:text-white">
                                    Cancel
                                </button>
                                <button type="submit" className="text-xs bg-violet-600 text-white px-3 py-1 rounded">
                                    Create
                                </button>
                            </div>

                        </form>
                    </div>
                )}

                {/* Channel list */}
                <div className="space-y-1 px-2">

                    {channels.map(channel => {
                        if (!channel || !channel._id) return null;

                        const isMember = channel.members?.some(
                            m => m?._id === currentUser?.id || m === currentUser?.id
                        );

                        const isPrivateChannel = channel.type === 'private';

                        return (
                            <div
                                key={channel._id}
                                className="group relative"
                                onMouseEnter={() => setHoveredChannelId(channel._id)}
                                onMouseLeave={() => setHoveredChannelId(null)}
                            >
                                {/* Channel item */}
                                <div
                                    onClick={() => handleChannelSelect(channel)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md 
                                    text-sm font-medium transition-all duration-200 
                                    ${currentChannel?._id === channel._id
                                            ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                        }`}
                                >
                                    <div className="flex items-center truncate">
                                        {isPrivateChannel ? (
                                            <Lock size={14} className="mr-3 text-slate-500 group-hover:text-slate-400" />
                                        ) : (
                                            <Hash size={18} className="mr-3 text-slate-500 group-hover:text-slate-400" />
                                        )}
                                        <span>{channel.name}</span>
                                    </div>

                                    <div className="flex items-center space-x-1">

                                        {isMember && (
                                            <>
                                                {isPrivateChannel && <Users size={12} className="opacity-50 mr-1" />}
                                                <span className="text-[10px] opacity-60">
                                                    {channel.members.length}
                                                </span>
                                            </>
                                        )}

                                        {/* FIXED: replaced button with span */}
                                        {isMember && hoveredChannelId === channel._id && (
                                            <span
                                                onClick={(e) => handleGearClick(e, channel)}
                                                className="p-1 hover:bg-slate-700 rounded transition-all opacity-0 
                                                group-hover:opacity-100 cursor-pointer"
                                                title="Channel Settings"
                                            >
                                                <Settings size={14} />
                                            </span>
                                        )}

                                        {/* Join */}
                                        {!isMember && (
                                            <span
                                                onClick={(e) => handleJoin(e, channel._id)}
                                                className="p-1 hover:text-green-400 cursor-pointer"
                                            >
                                                <UserPlus size={14} />
                                            </span>
                                        )}
                                    </div>
                                </div>

                            </div>
                        );
                    })}

                </div>
            </div>

            {/* Context Menu */}
            {contextMenu.isOpen && (
                <div
                    ref={contextMenuRef}
                    className="fixed bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-2 z-50 min-w-[180px]"
                    style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
                >
                    <button
                        onClick={handleEditChannel}
                        className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center"
                    >
                        <Settings size={14} className="mr-2" />
                        Edit Channel
                    </button>

                    {/* Only show delete option if user is the creator */}
                    {(() => {
                        const channel = channels.find(c => c._id === contextMenu.channelId);
                        const isCreator = channel?.createdBy?._id === currentUser?.id || channel?.createdBy === currentUser?.id;
                        return isCreator && (
                            <button
                                onClick={handleDeleteChannel}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center"
                            >
                                <X size={14} className="mr-2" />
                                Delete Channel
                            </button>
                        );
                    })()}
                </div>
            )}

            {/* Edit Channel Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-700">
                        <h2 className="text-xl font-bold text-white mb-4">Edit Channel</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">Channel Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-slate-900 text-slate-200 rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-violet-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">Description</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full bg-slate-900 text-slate-200 rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-violet-500 transition-all resize-none"
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Channel Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-red-900/30">
                        <h2 className="text-xl font-bold text-red-400 mb-2">Delete this channel permanently?</h2>
                        <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-sm"
                >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                </button>
            </div>

        </div>
    );
};

export default Sidebar;
