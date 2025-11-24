import React from 'react';
import { useStore } from '../../store/useStore';
import { ChatMessage } from '../../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { Check, CheckCheck } from 'lucide-react';
import AttachmentPreview from './AttachmentPreview';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { currentUser } = useStore();
  const isSender = message.senderId === currentUser?.id;

  const StatusIcon = () => {
    if (!isSender) return null;
    if (message.status === 'read') {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    }
    return <Check className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className={clsx('flex items-end gap-2', isSender ? 'justify-end' : 'justify-start')}>
      <div className={clsx('max-w-md p-3 rounded-2xl', isSender ? 'bg-primary-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-bl-none')}>
        {message.attachment && <AttachmentPreview attachment={message.attachment} />}
        {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
        <div className="flex items-center gap-2 mt-1.5 text-xs opacity-70">
          <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
          <StatusIcon />
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
