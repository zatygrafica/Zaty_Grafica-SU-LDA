import React, { useMemo, useState, useEffect } from 'react';

type AvatarProps = {
  name: string;
  src?: string;
  size?: string; // tailwind size classes e.g. w-10 h-10
  className?: string;
};

const hashToColor = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 65%)`;
};

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0).toUpperCase() ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
  return (first + last) || first || '?';
};

const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'w-10 h-10', className = '' }) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const initials = useMemo(() => getInitials(name), [name]);
  const bgColor = useMemo(() => hashToColor(name || 'user'), [name]);

  useEffect(() => {
    if (!src) {
      setImageState('error');
      return;
    }

    setImageState('loading');
    setLoadedSrc(null);

    const img = new Image();

    img.onload = () => {
      setLoadedSrc(src);
      setImageState('loaded');
    };

    img.onerror = () => {
      setImageState('error');
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden shrink-0 ${size} ${className}`}
      style={{ backgroundColor: imageState === 'loaded' ? 'transparent' : bgColor }}
      aria-label={name}
      title={name}
    >
      {imageState === 'loaded' && loadedSrc ? (
        <img
          src={loadedSrc}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-white font-semibold text-xs select-none">{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
