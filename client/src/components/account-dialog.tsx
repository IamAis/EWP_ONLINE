import { useEffect, useMemo, useState } from 'react';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label'; // Aggiunta questa importazione
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export function AccountDialog({ trigger }: { trigger: React.ReactNode }) {
	const { user } = useAuth();
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const initialName = useMemo(() => (user?.user_metadata?.name as string) || '', [user]);
	const initialEmail = user?.email || '';

	const [name, setName] = useState(initialName);
	const [email, setEmail] = useState(initialEmail);
	const [saving, setSaving] = useState(false);
	const [changingEmail, setChangingEmail] = useState(false);
	// Aggiungi questi stati
	const [changingPassword, setChangingPassword] = useState(false);

	useEffect(() => {
		if (open) {
			setName(initialName);
			setEmail(initialEmail);
		}
	}, [open, initialName, initialEmail]);

	const onSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;
		setSaving(true);
		try {
			// aggiorna solo il nome
			if (name !== initialName) {
				const { error } = await supabase.auth.updateUser({ data: { name } });
				if (error) throw error;
			}
			toast({ title: 'Profilo aggiornato', description: 'Le modifiche sono state salvate.' });
			setOpen(false);
		} catch (err: any) {
			toast({ 
				title: 'Errore aggiornamento', 
				description: err?.message || 'Impossibile aggiornare il profilo', 
				variant: 'destructive' 
			});
		} finally {
			setSaving(false);
		}
	};

	const onChangeEmail = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || email === initialEmail) return;
		
		setChangingEmail(true);
		try {
			const { error } = await supabase.auth.updateUser(
				{ email },
				{ emailRedirectTo: `${window.location.origin}` }
			);
			
			if (error) throw error;
			
			toast({ 
				title: 'Email di verifica inviata', 
				description: 'Controlla la tua email per confermare il cambio.' 
			});
			
			setOpen(false);
		} catch (err: any) {
			toast({ 
				title: 'Errore', 
				description: err?.message || 'Impossibile aggiornare email', 
				variant: 'destructive' 
			});
		} finally {
			setChangingEmail(false);
		}
	};

	// Aggiungi questa funzione
	const onChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user?.email) return;
		
		setChangingPassword(true);
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
				redirectTo: `${window.location.origin}/reset-password`
			});
			
			if (error) throw error;
			
			toast({ 
				title: 'Email inviata', 
				description: 'Controlla la tua email per reimpostare la password.' 
			});
			
			setOpen(false);
		} catch (err: any) {
			toast({ 
				title: 'Errore', 
				description: err?.message || 'Impossibile inviare email di reset', 
				variant: 'destructive' 
			});
		} finally {
			setChangingPassword(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Il tuo profilo</DialogTitle>
					<DialogDescription>
						Gestisci le tue informazioni personali
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={onSaveProfile} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Nome</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={saving}>
							{saving ? 'Salvataggio...' : 'Salva'}
						</Button>
					</DialogFooter>
				</form>

				<hr className="my-4 border-gray-200 dark:border-gray-800" />

				<form onSubmit={onChangeEmail} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<p className="text-sm text-gray-500">
							Riceverai un'email di verifica per confermare il cambio.
						</p>
					</div>
					<DialogFooter>
						<Button 
							type="submit" 
							variant="secondary" 
							disabled={changingEmail || email === initialEmail}
						>
							{changingEmail ? 'Invio email...' : 'Cambia email'}
						</Button>
					</DialogFooter>
				</form>

				<hr className="my-4 border-gray-200 dark:border-gray-800" />
				
				<form onSubmit={onChangePassword} className="space-y-3">
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Riceverai un'email con le istruzioni per reimpostare la password.
					</p>
					<DialogFooter>
						<Button type="submit" variant="secondary" disabled={changingPassword}>
							{changingPassword ? 'Invio email...' : 'Reimposta password'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
