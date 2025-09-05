import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Moon, Sun, CloudUpload, Dumbbell, Home, Users, Settings, LogOut, User as UserIcon, BookOpen } from 'lucide-react';
import { BackupManager } from '@/lib/backup';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import Logo from '@/img/logo.png';
import { LoginDialog } from './login-dialog';
import { useAuth } from '@/hooks/use-auth';
import { AccountDialog } from './account-dialog';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/workouts', icon: Dumbbell, label: 'Schede' },
  { path: '/clients', icon: Users, label: 'Clienti' },
  { path: '/exercise-glossary', icon: BookOpen, label: 'Glossario' },
  { path: '/settings', icon: Settings, label: 'Impostazioni' },
];

export function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const handleBackup = async () => {
    try {
      await BackupManager.exportToJSON();
      BackupManager.setLastBackupDate();
      toast({
        title: "Backup completato",
        description: "I dati sono stati esportati con successo"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile completare il backup",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 md:glass-effect border-b border-gray-100 dark:border-gray-800 md:border-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between py-3 md:py-8">
          <Link href="/">
            <div className="flex items-center space-x-5 cursor-pointer hover:opacity-80 transition-opacity" style={{ minHeight: '28px', minWidth: '120px', flexShrink: 0 }}>
              <img src={Logo} alt="Logo" className="w-12 h-12 md:w-20 md:h-20 lg:w-28 lg:h-28 object-contain" />
              {/* Titoli rimossi come richiesto */}
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-10 md:ml-auto md:mr-6">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location === path;
              return (
                <Link key={path} href={path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center space-x-4 px-10 py-5 transition-all duration-200 text-xl min-w-[160px] h-14",
                      isActive 
                        ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-md" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20"
                    )}
                  >
                    <Icon size={26} />
                    <span className="font-medium">{label}</span>
                  </Button>
                </Link>
              );
            })}
            {/* Autenticazione - desktop */}
            {user ? (
              <div className="hidden md:flex items-center gap-3 ml-4">
                <AccountDialog
                  trigger={
                    <Button type="button" variant="outline" className="gap-3 rounded-full border-gray-300 dark:border-gray-700 px-6 py-3 text-lg h-12">
                      <UserIcon size={20} />
                      Profilo
                    </Button>
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-gray-300 dark:border-gray-700 px-6 py-3 text-lg h-12"
                  onClick={async () => {
                    await signOut();
                    toast({ title: 'Sei uscito', description: 'Logout effettuato con successo' });
                  }}
                >
                  <LogOut size={20} />
                  Esci
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex ml-4">
                <LoginDialog
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-gray-300 dark:border-gray-700 px-6 py-3 text-lg h-12"
                    >
                      Login
                    </Button>
                  }
                />
              </div>
            )}
          </nav>
          
          {/* Destra: azioni + autenticazione mobile */}
          <div className="flex items-center space-x-1 md:space-x-3 md:ml-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="glass-effect hover:bg-white/20 dark:hover:bg-black/20 w-9 h-9 md:w-12 md:h-12"
            >
              {theme === 'light' ? (
                <Sun className="text-yellow-500" size={20} />
              ) : (
                <Moon className="text-indigo-400" size={20} />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackup}
              className="glass-effect hover:bg-white/20 dark:hover:bg-black/20 w-9 h-9 md:w-12 md:h-12"
            >
              <CloudUpload className="text-indigo-500" size={20} />
            </Button>

            {/* Autenticazione - mobile: sposta i bottoni nel top nav */}
            {user ? (
              <div className="md:hidden flex items-center gap-2">
                <AccountDialog
                  trigger={
                    <Button size="sm" className="gap-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2">
                      <UserIcon size={16} />
                      Profilo
                    </Button>
                  }
                />
                <Button size="sm" className="rounded-full bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-2" onClick={signOut}>
                  <LogOut size={16} />
                  Esci
                </Button>
              </div>
            ) : (
              <div className="md:hidden">
                <LoginDialog
                  trigger={
                    <Button size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2">
                      Login
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}