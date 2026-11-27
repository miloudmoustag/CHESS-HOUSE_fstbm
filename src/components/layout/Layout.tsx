import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomBar } from './MobileBottomBar';
import { OfflineIndicator } from './OfflineIndicator';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] chess-grid-pattern">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomBar />
      <OfflineIndicator />
    </div>
  );
};
