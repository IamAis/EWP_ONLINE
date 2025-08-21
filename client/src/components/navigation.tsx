import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Moon, Sun, CloudUpload, Dumbbell, Home, Users, Settings, LogOut, User as UserIcon } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 md:glass-effect">
      <div className="max-w-7xl mx-auto px-8 sm:px-10 lg:px-12">
        <div className="flex justify-between items-center py-8">
          <Link href="/">
            <div className="flex items-center space-x-5 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={Logo} alt="Logo" className="w-20 h-20 lg:w-28 lg:h-28 object-contain" />
              {/* Titoli rimossi come richiesto */}
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location === path;
              return (
                <Link key={path} href={path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center space-x-4 px-8 py-4 transition-all duration-200 text-lg",
                      isActive 
                        ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-md" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20"
                    )}
                  >
                    <Icon size={22} />
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
                    <Button variant="outline" className="gap-2 rounded-full border-gray-300 dark:border-gray-700">
                      <UserIcon size={16} />
                      Profilo
                    </Button>
                  }
                />
                <Button variant="outline" className="rounded-full border-gray-300 dark:border-gray-700" onClick={signOut}>
                  <LogOut size={16} />
                  Esci
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex ml-4">
                <LoginDialog
                  trigger={
                    <Button
                      variant="outline"
                      className="rounded-full border-gray-300 dark:border-gray-700"
                    >
                      Login
                    </Button>
                  }
                />
              </div>
            )}
          </nav>
          
          {/* Destra: azioni + autenticazione mobile */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="glass-effect hover:bg-white/20 dark:hover:bg-black/20 w-12 h-12"
            >
              {theme === 'light' ? (
                <Sun className="text-yellow-500" size={24} />
              ) : (
                <Moon className="text-indigo-400" size={24} />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackup}
              className="glass-effect hover:bg-white/20 dark:hover:bg-black/20 w-12 h-12"
            >
              <CloudUpload className="text-indigo-500" size={24} />
            </Button>

            {/* Autenticazione - mobile: sposta i bottoni nel top nav */}
            {user ? (
              <div className="md:hidden flex items-center gap-2">
                <AccountDialog
                  trigger={
                    <Button size="sm" className="gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white">
                      <UserIcon size={16} />
                      Profilo
                    </Button>
                  }
                />
                <Button size="sm" className="rounded-full bg-gray-800 hover:bg-gray-900 text-white" onClick={signOut}>
                  <LogOut size={16} />
                  Esci
                </Button>
              </div>
            ) : (
              <div className="md:hidden">
                <LoginDialog
                  trigger={
                    <Button size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white">
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