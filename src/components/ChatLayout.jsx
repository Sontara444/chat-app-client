import React from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import { ChatProvider } from '../context/ChatContext';
import UserList from './UserList';

const ChatLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <ChatProvider>
            <div className="flex h-screen bg-gray-900 overflow-hidden relative">
                {/* Mobile Sidebar Backdrop */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                        onClick={closeSidebar}
                    />
                )}

                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={closeSidebar}
                />

                <ChatArea
                    onOpenSidebar={toggleSidebar}
                />

                <UserList />
            </div>
        </ChatProvider>
    );
};

export default ChatLayout;
