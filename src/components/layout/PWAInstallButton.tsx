import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useI18n } from '../../i18n';
import { AccessibleModal } from '../common/AccessibleModal';

export const PWAInstallButton: React.FC = () => {
  const { t } = useI18n();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        {t.common.installApp}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          {t.common.installApp}
        </button>

        <AccessibleModal open={showIOSGuide} onClose={() => setShowIOSGuide(false)} title={t.common.installApp}>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            1. Tap Share in Safari.
            <br />
            2. Scroll down and select Add to Home Screen.
          </p>
        </AccessibleModal>
      </>
    );
  }

  return null;
};
