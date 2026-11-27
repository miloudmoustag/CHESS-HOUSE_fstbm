import React, { useState } from 'react';
import { getImageSlot } from '../../data/images';
import { useI18n } from '../../i18n';

interface ClubImageProps {
  slotId: string;
  className?: string;
  aspectClass?: string;
  priority?: boolean;
}

export const ClubImage: React.FC<ClubImageProps> = ({
  slotId,
  className = '',
  aspectClass = '',
  priority = false,
}) => {
  const { pick } = useI18n();
  const slot = getImageSlot(slotId);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-center p-4 ${aspectClass} ${className}`}
      >
        <span className="text-xs font-mono-tabular text-[var(--accent-gold)]">{slot.recommendedSize}</span>
        <span className="text-xs text-[var(--text-muted)] mt-1">{pick(slot.alt)}</span>
      </div>
    );
  }

  return (
    <img
      src={slot.src}
      alt={pick(slot.alt)}
      width={slot.width}
      height={slot.height}
      loading={priority ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${aspectClass} ${className}`}
    />
  );
};
