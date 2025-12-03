import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Users, Circle } from 'lucide-react';
import api from '../api/api';

const UserList = () => {
    const { onlineUsers } = useChat();
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const response = await api.get('/auth/users');
                setAllUsers(response.data);
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };
        fetchAllUsers();
    }, []);

    const isUserOnline = (userId) => {
        return onlineUsers.some(user => user._id === userId);
    };

    // Sort users: online first, then offline
    const sortedUsers = [...allUsers].sort((a, b) => {
        const aOnline = isUserOnline(a._id);
        const bOnline = isUserOnline(b._id);

        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return 0;
    });

    return (
        <div className="w-64 bg-slate-900 border-l border-slate-800 hidden lg:flex flex-col shadow-xl z-10">
            <div className="p-6 border-b border-slate-800 font-bold text-slate-100 flex items-center justify-between">
                <div className="flex items-center">
                    <Users size={18} className="mr-2 text-violet-400" />
                    <span>Users</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30">{onlineUsers.length}</span>
                    <span className="text-slate-500 text-xs">/</span>
                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700">{allUsers.length}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {sortedUsers.map((user) => {
                    const online = isUserOnline(user._id);
                    return (
                        <div key={user._id} className="flex items-center px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group">
                            <div className="relative mr-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-white border border-slate-500">
                                    {user.username?.substring(0, 2).toUpperCase()}
                                </div>
                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${online ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">{user.username}</p>
                                <p className={`text-xs truncate ${online ? 'text-green-400' : 'text-slate-500'}`}>
                                    {online ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UserList;
