import { Link, useLocation } from 'wouter';
import { Home, Dumbbell, Users, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoginDialog } from './login-dialog';
import { useAuth } from '@/hooks/use-auth';
import { AccountDialog } from './account-dialog';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/workouts', icon: Dumbbell, label: 'Schede' },
  { path: '/clients', icon: Users, label: 'Clienti' },
  { path: '/settings', icon: Settings, label: 'Impostazioni' },
];

export function BottomNav() {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden z-30 py-3">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <button
                className={cn(
                  "flex flex-col items-center py-2 px-4 transition-colors",
                  isActive 
                    ? "text-indigo-500" 
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <Icon size={20} className="mb-1" />
                <span className="text-xs">{label}</span>
              </button>
            </Link>
          );
        })}

        {user ? (
          <>
            <AccountDialog
              trigger={
                <button
                  className={cn(
                    "flex flex-col items-center py-2 px-4 transition-colors",
                    "text-gray-700 dark:text-gray-200"
                  )}
                >
                  <UserIcon size={20} className="mb-1" />
                  <span className="text-xs">Profilo</span>
                </button>
              }
            />
            <button
              className={cn(
                "flex flex-col items-center py-2 px-4 transition-colors",
                "text-gray-700 dark:text-gray-200"
              )}
              onClick={signOut}
            >
              <LogOut size={20} className="mb-1" />
              <span className="text-xs">Esci</span>
            </button>
          </>
        ) : (
          <LoginDialog
            trigger={
              <button
                className={cn(
                  "flex flex-col items-center py-2 px-4 transition-colors",
                  "text-indigo-500"
                )}
              >
                <UserIcon size={20} className="mb-1" />
                <span className="text-xs">Login</span>
              </button>
            }
          />
        )}
      </div>
    </nav>
  );
}
