import React from 'react';
import { File, Download } from 'lucide-react';
import { ChatAttachment } from '../../types';

interface AttachmentPreviewProps {
  attachment: ChatAttachment;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment }) => {
  const isImage = attachment.type.startsWith('image/');

  if (isImage) {
    return (
      <div className="mb-2">
        <img src={attachment.url} alt={attachment.name} className="max-w-xs max-h-60 rounded-lg object-contain" />
      </div>
    );
  }

  return (
    <div className="mb-2 p-3 bg-black/10 dark:bg-black/20 rounded-lg flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 overflow-hidden">
        <File className="w-8 h-8 flex-shrink-0" />
        <p className="truncate text-sm font-medium">{attachment.name}</p>
      </div>
      <a href={attachment.url} download={attachment.name} className="p-2 rounded-full hover:bg-black/10">
        <Download className="w-5 h-5" />
      </a>
    </div>
  );
};

export default AttachmentPreview;
