import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/navigation/Navbar';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'SchedLab — Interactive CPU Scheduling Simulator',
  description:
    'Explore process states, scheduling algorithms, queues, and performance metrics through an interactive Operating Systems laboratory.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}