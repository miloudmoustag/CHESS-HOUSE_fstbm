import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, Moon, Shield, Sun, User, Volume2, VolumeX, X } from 'lucide-react';
import { CLUB_LOGOS } from '../../data/images';
import { useI18n } from '../../i18n';
import { Locale } from '../../config/site';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';

interface NavItem {
  to: string;
  label: string;
}

interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

export const Header: React.FC = () => {
  const { t, locale, setLocale, theme, toggleTheme, soundEnabled, setSoundEnabled, pick } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const navGroups: NavGroup[] = [
    {
      key: 'club',
      label: t.nav.groups.club,
      items: [
        { to: '/about', label: t.nav.about },
        { to: '/about#board', label: t.nav.board },
        { to: '/news', label: t.nav.news },
        { to: '/gallery', label: t.nav.gallery },
      ],
    },
    {
      key: 'play',
      label: t.nav.groups.play,
      items: [
        { to: '/tournaments', label: t.nav.tournaments },
        { to: '/league', label: t.nav.league },
        { to: '/hall', label: t.nav.hall },
      ],
    },
    {
      key: 'learn',
      label: t.nav.groups.learn,
      items: [
        { to: '/academy', label: t.nav.academy },
        { to: '/roadmap', label: t.nav.roadmap },
      ],
    },
    {
      key: 'activities',
      label: t.nav.groups.activities,
      items: [
        { to: '/events', label: t.nav.events },
        { to: '/documents', label: t.nav.documents },
        { to: '/activities', label: t.nav.activities },
      ],
    },
    {
      key: 'community',
      label: t.nav.groups.community,
      items: [
        { to: '/join', label: t.nav.join },
        { to: '/my-chess-house', label: t.nav.myChessHouse },
        { to: '/account', label: t.nav.account },
        { to: '/contact', label: t.nav.contact },
      ],
    },
  ];

  const utilityLinks: NavItem[] = [
    { to: '/partners', label: t.nav.partners },
    { to: '/faq', label: t.nav.faq },
    ...(user?.role === 'board' || user?.role === 'admin' ? [{ to: '/admin', label: t.nav.admin }] : []),
  ];

  useEffect(() => {
    setOpenGroup(null);
    setDrawerOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenGroup(null);
        setDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const isGroupActive = (group: NavGroup) =>
    group.items.some((item) => {
      const path = item.to.split('#')[0];
      return location.pathname === path;
    });

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-30 bg-[var(--bg-surface)]/95 backdrop-blur-sm border-b border-[var(--border-hairline)] no-print"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Club Logo + Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          aria-label="Chess House Club Home"
        >
          <img
            src={CLUB_LOGOS.club.src}
            alt={pick(CLUB_LOGOS.club.alt)}
            width={36}
            height={36}
            className="w-9 h-9 rounded-md object-cover border border-[var(--border-hairline)]"
          />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap">
            Chess House
          </span>
        </Link>

        {/* Zone 2: 5 Main Destinations */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-7">
          {navGroups.map((group) => {
            const active = isGroupActive(group);
            const isOpen = openGroup === group.key;
            return (
              <div
                key={group.key}
                className="relative"
                onMouseEnter={() => setOpenGroup(group.key)}
                onMouseLeave={() => setOpenGroup((prev) => (prev === group.key ? null : prev))}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  onClick={() => setOpenGroup((prev) => (prev === group.key ? null : group.key))}
                  className={`inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    active || isOpen
                      ? 'border-[var(--accent-primary)] text-[var(--text-primary)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{group.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div
                    role="menu"
                    className="absolute top-full start-0 pt-2 w-52 z-40"
                  >
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl shadow-lg py-1.5">
                      {group.items.map((item) => {
                        const itemPath = item.to.split('#')[0];
                        const itemHash = item.to.includes('#') ? `#${item.to.split('#')[1]}` : '';
                        const currentActive =
                          location.pathname === itemPath && (!itemHash || location.hash === itemHash);
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            role="menuitem"
                            onClick={() => setOpenGroup(null)}
                            className={`block px-4 py-2 text-sm transition-colors whitespace-nowrap ${
                              currentActive
                                ? 'bg-[var(--accent-gold-bg)] text-[var(--text-primary)] font-semibold'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                      {group.key === 'community' && (user?.role === 'board' || user?.role === 'admin') && (
                        <Link
                          to="/admin"
                          role="menuitem"
                          onClick={() => setOpenGroup(null)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--accent-gold)] font-semibold hover:bg-[var(--bg-subtle)] border-t border-[var(--border-hairline)] mt-1"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{t.nav.admin}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Zone 3: Language, Theme, Primary Action, Drawer Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center border border-[var(--border-hairline)] rounded-lg overflow-hidden">
            {(['fr', 'en', 'ar'] as Locale[]).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocale(loc)}
                className={`px-2 py-1 text-xs font-semibold uppercase transition-colors ${
                  locale === loc
                    ? 'bg-[var(--chess-charcoal)] text-[#EEEED2] dark:bg-[var(--accent-primary)] dark:text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                }`}
                aria-label={`Switch language to ${loc.toUpperCase()}`}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? t.common.darkMode : t.common.lightMode}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {user ? (
            <Link
              to="/my-chess-house"
              className="hidden sm:inline-flex items-center gap-1.5 btn-piece-slide px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.nav.myChessHouse}</span>
            </Link>
          ) : (
            <Link
              to="/join"
              className="hidden sm:inline-flex btn-piece-slide px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] whitespace-nowrap shrink-0"
            >
              {t.nav.join}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-expanded={drawerOpen}
            aria-label={t.nav.more}
            className="p-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-[var(--border-hairline)]"
          >
            {drawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Navigation Drawer organised around the 5 Main Destinations */}
      {drawerOpen && (
        <div className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 sm:px-6 py-5 shadow-md max-h-[80vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:hidden">
              <div className="flex items-center border border-[var(--border-hairline)] rounded-lg overflow-hidden">
                {(['fr', 'en', 'ar'] as Locale[]).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocale(loc)}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase ${
                      locale === loc
                        ? 'bg-[var(--chess-charcoal)] text-[#EEEED2]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {loc.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)]"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                {soundEnabled ? t.common.soundOn : t.common.soundOff}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {navGroups.map((group) => (
                <div key={group.key} className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] px-2">
                    {group.label}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setDrawerOpen(false)}
                        className={`block px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          location.pathname === item.to.split('#')[0]
                            ? 'bg-[var(--accent-gold-bg)] text-[var(--text-primary)] font-semibold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-hairline)]">
              <div className="flex flex-wrap items-center gap-2">
                {utilityLinks.map((u) => (
                  <Link
                    key={u.to}
                    to={u.to}
                    onClick={() => setDrawerOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                  >
                    {u.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  {soundEnabled ? t.common.soundOn : t.common.soundOff}
                </button>
                <PWAInstallButton />
              </div>
              <img
                src={CLUB_LOGOS.fst.src}
                alt={pick(CLUB_LOGOS.fst.alt)}
                width={32}
                height={32}
                className="w-8 h-8 rounded object-cover border border-[var(--border-hairline)]"
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
