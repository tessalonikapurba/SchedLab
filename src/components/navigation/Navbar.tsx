'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Menu,
  X,
  Cpu,
  Play,
  Sun,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

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
  const { theme, toggleTheme } = useTheme();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
          >
            <Cpu
              size={22}
              className="text-accent"
              strokeWidth={2.5}
            />
            <span>SchedLab</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive(link.href)
                    ? 'text-accent bg-accent/8'
                    : 'text-muted hover:text-foreground hover:bg-surface-alt'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-muted hover:text-foreground hover:bg-surface-alt transition-colors"
              aria-label={
                theme === 'light'
                  ? 'Switch to dark mode'
                  : 'Switch to light mode'
              }
              title={
                theme === 'light'
                  ? 'Switch to dark mode'
                  : 'Switch to light mode'
              }
            >
              {theme === 'light' ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}
            </button>

            {/* Open Simulator */}
            <Link
              href="/simulator/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors"
            >
              <Play
                size={14}
                fill="currentColor"
              />
              Open Simulator
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-muted hover:text-foreground hover:bg-surface-alt transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
              }}
              animate={{
                height: 'auto',
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="py-2 space-y-1">

                {/* Navigation Links */}
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive(link.href)
                        ? 'text-accent bg-accent/8'
                        : 'text-muted hover:text-foreground hover:bg-surface-alt'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Mobile Theme Toggle */}
                <div className="px-3 pt-2">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-muted hover:text-foreground hover:bg-surface-alt transition-colors"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon size={16} />
                        Dark mode
                      </>
                    ) : (
                      <>
                        <Sun size={16} />
                        Light mode
                      </>
                    )}
                  </button>
                </div>

                {/* Mobile Open Simulator */}
                <div className="pt-2 px-3">
                  <Link
                    href="/simulator/new"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full px-3.5 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors"
                  >
                    <Play
                      size={14}
                      fill="currentColor"
                    />
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