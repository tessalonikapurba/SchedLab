'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Cpu,
  Layers,
  Activity,
  GitBranch,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const LEARN_TOPICS = [
  {
    slug: '',
    title: 'Overview',
    description: 'Educational curriculum & roadmap',
    icon: BookOpen,
  },
  {
    slug: 'process-threads',
    title: 'Processes & Threads',
    description: 'Memory models, PCB, thread concurrency',
    icon: Layers,
  },
  {
    slug: 'process-states',
    title: 'Process States & Lifecycle',
    description: '5-state & 7-state interactive machine',
    icon: Activity,
  },
  {
    slug: 'cpu-scheduling',
    title: 'CPU Scheduling Fundamentals',
    description: 'Burst cycles, dispatcher, metrics',
    icon: Cpu,
  },
  {
    slug: 'algorithms',
    title: 'Scheduling Algorithms',
    description: 'FCFS, SJF, SRTF, Priority, Round Robin',
    icon: GitBranch,
  },
];

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isCurrent = (slug: string) => {
    const target = slug ? `/learn/${slug}` : '/learn';
    return pathname === target;
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-surface text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="p-4 rounded-xl bg-surface-alt border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-accent" />

                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Operating Systems Lab
                </h2>
              </div>

              <p className="text-xs text-muted mb-4 leading-relaxed">
                Interactive curriculum covering process theory,
                concurrency, state machines, and scheduling dispatchers.
              </p>

              <nav
                className="space-y-1"
                aria-label="Learn topics"
              >
                {LEARN_TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  const active = isCurrent(topic.slug);
                  const href = topic.slug
                    ? `/learn/${topic.slug}`
                    : '/learn';

                  return (
                    <Link
                      key={topic.slug}
                      href={href}
                      className={`group flex items-start gap-3 p-2.5 rounded-lg text-xs transition-colors ${active
                          ? 'bg-accent text-white font-medium shadow-sm'
                          : 'text-muted hover:text-foreground hover:bg-surface'
                        }`}
                    >
                      <Icon
                        size={16}
                        className={`shrink-0 mt-0.5 ${active
                            ? 'text-white'
                            : 'text-accent'
                          }`}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {topic.title}
                        </div>

                        <div
                          className={`text-[11px] truncate ${active
                              ? 'text-white/80'
                              : 'text-muted'
                            }`}
                        >
                          {topic.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Action to Simulator */}
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-xs space-y-2">
              <span className="font-semibold text-accent block">
                Ready to experiment?
              </span>

              <p className="text-muted text-[11px] leading-relaxed">
                Test these concepts with real workloads inside the
                interactive simulation engine.
              </p>

              <Link
                href="/simulator/new"
                className="inline-flex items-center gap-1 text-accent font-medium hover:underline text-xs"
              >
                Launch Simulator
                <ChevronRight size={13} />
              </Link>
            </div>
          </aside>

          {/* Main Topic Content */}
          <main className="lg:col-span-3 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}