import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useChatStore } from '../../store/useChatStore';
import { useStore } from '../../store/useStore';
import { fileToBase64 } from '../../utils/fileUtils';
import { Send, Smile, Paperclip, X } from 'lucide-react';
import Button from '../Common/Button';
import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';
import { ChatAttachment } from '../../types';

interface MessageInputProps {
  conversationId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId }) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const { sendMessage } = useChatStore();
  const { theme: appTheme } = useStore();

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setAttachment(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const handleSendMessage = async () => {
    if (text.trim() === '' && !attachment) return;

    let attachmentData: ChatAttachment | undefined;
    if (attachment) {
      try {
        const base64url = await fileToBase64(attachment);
        attachmentData = {
          name: attachment.name,
          url: base64url,
          type: attachment.type,
        };
      } catch (error) {
        console.error("Error converting file to Base64", error);
        // Optionally, show a notification to the user
        return;
      }
    }

    await sendMessage(conversationId, text, attachmentData);
    setText('');
    setAttachment(null);
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText(prevText => prevText + emojiData.emoji);
  };

  return (
    <div {...getRootProps()} className="p-4 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <input {...getInputProps()} />
      {attachment && (
        <div className="mb-2 p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">Anexo: {attachment.name}</p>
          <Button variant="ghost" size="sm" onClick={() => setAttachment(null)}><X className="w-4 h-4" /></Button>
        </div>
      )}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Digite uma mensagem..."
          className="w-full p-3 pr-32 rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
          rows={1}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={open} title="Anexar ficheiro">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Adicionar emoji">
            <Smile className="w-5 h-5 text-gray-500" />
          </Button>
          <Button size="sm" onClick={handleSendMessage} title="Enviar mensagem">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-4 z-10">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            emojiStyle={EmojiStyle.NATIVE}
            lazyLoadEmojis={true}
            theme={appTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
          />
        </div>
      )}
    </div>
  );
};

export default MessageInput;
