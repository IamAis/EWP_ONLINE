import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Sessione scaduta o non valida',
          description: 'Per favore, riprova il processo di reimpostazione della password.',
          variant: 'destructive'
        });
        setLocation('/login'); // Reindirizza alla pagina di login se non c'è sessione
      }
    };

    checkSession();
  }, [setLocation, toast]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({ 
        title: 'Password troppo corta', 
        description: 'Inserisci almeno 6 caratteri',
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      toast({ 
        title: 'Password aggiornata', 
        description: 'Puoi ora accedere con la nuova password' 
      });
      
      setLocation('/');
    } catch (err: any) {
      console.error("Errore durante l'aggiornamento della password:", err);
      toast({ 
        title: 'Errore', 
        description: err?.message || 'Impossibile aggiornare la password',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-6">Reimposta Password</h1>
      <form onSubmit={handleReset} className="space-y-4">
        <Input
          type="password"
          placeholder="Nuova password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Aggiornamento...' : 'Salva nuova password'}
        </Button>
      </form>
    </div>
  );
}