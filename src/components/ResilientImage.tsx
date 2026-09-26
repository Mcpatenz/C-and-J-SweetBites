import React, { useState } from 'react';
import { CakeSlice } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50/60 to-stone-200 text-stone-600 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <CakeSlice className="w-7 h-7 text-amber-800/70 mb-2 stroke-[1.5]" />
        <span className="text-xs font-medium text-stone-700 line-clamp-2 max-w-[18ch]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
