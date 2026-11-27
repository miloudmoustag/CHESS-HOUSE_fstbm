import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChessPieceSvg } from './ChessPieceSvg';
import { useI18n } from '../../i18n';

const SESSION_KEY = 'ch_intro_seen_v1';

export const OpeningCurtain: React.FC = () => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (sessionStorage.getItem(SESSION_KEY) === '1') return;
      setVisible(true);
      sessionStorage.setItem(SESSION_KEY, '1');
      const timer = window.setTimeout(() => setVisible(false), 1800);
      return () => window.clearTimeout(timer);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#262421] text-[#EEEED2] p-6"
          role="dialog"
          aria-label="Chess House Club Opening"
        >
          <div className="flex items-center gap-3 mb-5">
            {(['r', 'n', 'b', 'q', 'k'] as const).map((piece, idx) => (
              <motion.div
                key={piece}
                initial={{ y: idx % 2 === 0 ? -24 : 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="w-10 h-10 p-1 rounded bg-[#769656]/25 border border-[#C9A24B]/40"
              >
                <ChessPieceSvg type={piece} color="w" />
              </motion.div>
            ))}
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-center"
          >
            CHESS HOUSE BM
          </motion.h1>
          <p className="mt-1 text-xs text-[#C9A24B] tracking-widest">FST BÉNI MELLAL · USMS</p>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="mt-8 px-4 py-2 text-xs font-medium rounded-lg border border-[#EEEED2]/30 text-[#EEEED2] hover:bg-[#EEEED2]/10"
          >
            {t.common.skipIntro}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
