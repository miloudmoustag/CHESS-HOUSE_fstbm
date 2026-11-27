import React, { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string;
      reset: (id: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  honeypot: string;
  onHoneypotChange: (val: string) => void;
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onToken,
  honeypot,
  onHoneypotChange,
}) => {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!siteKey) {
      onToken('preview-turnstile-ok');
      return;
    }

    const renderWidget = () => {
      if (containerRef.current && window.turnstile) {
        containerRef.current.innerHTML = '';
        window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
        });
      }
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      existing.addEventListener('load', renderWidget);
    }
  }, [siteKey, onToken]);

  return (
    <div className="space-y-2">
      {/* Hidden honeypot trap for bots */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website_trap">Website</label>
        <input
          id="website_trap"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => onHoneypotChange(e.target.value)}
        />
      </div>

      {siteKey ? (
        <div ref={containerRef} />
      ) : (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] py-1.5">
          <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
          <span>{t.common.turnstileNote}</span>
        </div>
      )}
    </div>
  );
};
