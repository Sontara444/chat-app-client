import React from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import { ChatProvider } from '../context/ChatContext';
import UserList from './UserList';

const ChatLayout = () => {
    return (
        <ChatProvider>
            <div className="flex h-screen bg-gray-900 overflow-hidden">
                <Sidebar />
                <ChatArea />
                <UserList />
            </div>
        </ChatProvider>
    );
};

export default ChatLayout;
