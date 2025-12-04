import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

const MessageStatusIndicator = ({ status, isMe }) => {
    if (!isMe) return null; // Only show status on sender's messages

    if (status === 'sent') {
        return <Check size={14} className="text-slate-400 inline ml-1" />;
    } else if (status === 'delivered') {
        return <CheckCheck size={14} className="text-slate-400 inline ml-1" />;
    } else if (status === 'read') {
        return <CheckCheck size={14} className="text-blue-400 inline ml-1" />;
    }

    return null;
};

export default MessageStatusIndicator;
