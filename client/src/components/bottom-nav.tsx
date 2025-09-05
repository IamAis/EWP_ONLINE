import { Link, useLocation } from 'wouter';
import { Home, Dumbbell, Users, Settings, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/workouts', icon: Dumbbell, label: 'Schede' },
  { path: '/clients', icon: Users, label: 'Clienti' },
  { path: '/exercise-glossary', icon: BookOpen, label: 'Glossario' },
  { path: '/settings', icon: Settings, label: 'Impostazioni' },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden z-30 py-4">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <button
                className={cn(
                  "flex flex-col items-center py-2 px-3 transition-colors min-w-[60px]",
                  isActive 
                    ? "text-indigo-500" 
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <Icon size={18} className="mb-1" />
                <span className="text-xs">{label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
