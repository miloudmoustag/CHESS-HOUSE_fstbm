import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, Home, Trophy, User } from 'lucide-react';
import { useI18n } from '../../i18n';

export const MobileBottomBar: React.FC = () => {
  const { t } = useI18n();
  const { pathname } = useLocation();

  const actions = [
    { to: '/', label: t.nav.home, Icon: Home, exact: true },
    { to: '/tournaments', label: t.nav.groups.play, Icon: Trophy, exact: false },
    { to: '/academy', label: t.nav.groups.learn, Icon: BookOpen, exact: false },
    { to: '/events', label: t.nav.groups.activities, Icon: Calendar, exact: false },
    { to: '/my-chess-house', label: t.nav.myChessHouse, Icon: User, exact: false },
  ];

  return (
    <nav
      aria-label="Mobile quick actions"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-[var(--bg-surface)]/95 backdrop-blur-sm border-t border-[var(--border-hairline)] grid grid-cols-5 no-print"
    >
      {actions.map(({ to, label, Icon, exact }) => {
        const active = exact ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
              active ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)]'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="truncate max-w-[64px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
