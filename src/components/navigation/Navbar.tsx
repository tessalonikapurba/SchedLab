'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Cpu, Settings, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/learn', label: 'Learn' },
  { href: '/simulator/new', label: 'Simulator' },
  { href: '/compare', label: 'Compare' },
  { href: '/about', label: 'About' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
          >
            <Cpu size={22} className="text-accent" strokeWidth={2.5} />
            <span>SchedLab</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-accent bg-accent/8'
                    : 'text-muted hover:text-foreground hover:bg-surface-alt'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-2">
            <button
              className="p-2 rounded-md text-muted hover:text-foreground hover:bg-surface-alt transition-colors"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
            <Link
              href="/simulator/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors"
            >
              <Play size={14} fill="currentColor" />
              Open Simulator
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-md text-muted hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="py-2 space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive(link.href)
                        ? 'text-accent bg-accent/8'
                        : 'text-muted hover:text-foreground hover:bg-surface-alt'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-2 px-3">
                  <Link
                    href="/simulator/new"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full px-3.5 py-2 bg-accent text-white text-sm font-medium rounded-md"
                  >
                    <Play size={14} fill="currentColor" />
                    Open Simulator
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
