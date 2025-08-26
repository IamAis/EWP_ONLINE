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
import { Label } from './ui/label';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export function AccountDialog({ trigger }: { trigger: React.ReactNode }) {
	const { user, signOut } = useAuth();
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const initialName = useMemo(() => (user?.user_metadata?.name as string) || '', [user]);
	const initialEmail = user?.email || '';

	const [name, setName] = useState(initialName);
	const [email, setEmail] = useState(initialEmail);
	const [confirmEmail, setConfirmEmail] = useState('');
	const [confirmDelete, setConfirmDelete] = useState('');
	const [confirmDeleteText, setConfirmDeleteText] = useState('');
	const [saving, setSaving] = useState(false);
	const [changingEmail, setChangingEmail] = useState(false);
	const [changingPassword, setChangingPassword] = useState(false);
	const [deleting, setDeleting] = useState(false);

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
		if (email !== confirmEmail) {
			toast({
				title: 'Errore',
				description: 'Le email non corrispondono',
				variant: 'destructive'
			});
			return;
		}
		
		setChangingEmail(true);
		try {
			const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
			const { error } = await supabase.auth.updateUser(
				{ email },
				{ emailRedirectTo: siteUrl }
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

	const onChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user?.email) return;
		
		setChangingPassword(true);
		try {
			const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
			const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
				redirectTo: `${siteUrl}/reset-password`
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

	const onDeleteAccount = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;
		if (confirmDelete !== user.email) {
			toast({
				title: 'Errore',
				description: 'Inserisci la tua email per confermare l\'eliminazione',
				variant: 'destructive'
			});
			return;
		}
		if (confirmDeleteText !== 'ELIMINA') {
			toast({
				title: 'Errore',
				description: 'Scrivi "ELIMINA" per confermare l\'eliminazione definitiva',
				variant: 'destructive'
			});
			return;
		}
		
		setDeleting(true);
		try {
			const { error } = await supabase.rpc('delete_user');
			if (error) throw error;
			
			await signOut();
			toast({ 
				title: 'Account eliminato', 
				description: 'Il tuo account è stato eliminato con successo.' 
			});
			setOpen(false);
		} catch (err: any) {
			toast({ 
				title: 'Errore', 
				description: err?.message || 'Impossibile eliminare l\'account', 
				variant: 'destructive' 
			});
		} finally {
			setDeleting(false);
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
						<Label htmlFor="confirmEmail">Conferma Email</Label>
						<Input
							id="confirmEmail"
							type="email"
							value={confirmEmail}
							onChange={(e) => setConfirmEmail(e.target.value)}
						/>
						<p className="text-sm text-gray-500">
							Riceverai un'email di verifica per confermare il cambio.
						</p>
					</div>
					<DialogFooter>
						<Button 
							type="submit" 
							variant="secondary" 
							disabled={changingEmail || email === initialEmail || !email || !confirmEmail}
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

				<hr className="my-4 border-gray-200 dark:border-gray-800" />

				<form onSubmit={onDeleteAccount} className="space-y-3">
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Elimina definitivamente il tuo account e tutti i dati associati.
						Per confermare, inserisci la tua email: {user?.email}
					</p>
					<div className="space-y-2">
						<Input
							type="email"
							value={confirmDelete}
							onChange={(e) => setConfirmDelete(e.target.value)}
							placeholder="Inserisci la tua email per confermare"
						/>
						<Input
							type="text"
							value={confirmDeleteText}
							onChange={(e) => setConfirmDeleteText(e.target.value)}
							placeholder='Scrivi "ELIMINA" per confermare'
						/>
					</div>
					<DialogFooter>
						<Button 
							type="submit" 
							variant="destructive" 
							disabled={deleting || !confirmDelete || !confirmDeleteText}
						>
							{deleting ? 'Eliminazione...' : 'Elimina account'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
