import { useState, useEffect } from 'react';
import { Save, Upload, Download, Trash2, User, Camera, Instagram, Facebook, Globe, FileText, Folder, Palette, Eye, EyeOff, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCoachProfile, useCreateCoachProfile, useUpdateCoachProfile } from '@/hooks/use-clients';
import { BackupManager } from '@/lib/backup';
import { dbOps } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { insertCoachProfileSchema, type InsertCoachProfile } from '@shared/schema';
import { useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePremium } from '@/hooks/use-premium';
import { PremiumDialog } from '@/components/premium-dialog';
import { processImageForUpload } from '@/lib/image-utils';

export default function Settings() {
  const { data: coachProfile, isLoading } = useCoachProfile();
  const createCoachProfile = useCreateCoachProfile();
  const updateCoachProfile = useUpdateCoachProfile();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canAccess } = usePremium();
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [backupStats, setBackupStats] = useState<{
    workoutsCount: number;
    clientsCount: number;
    lastBackup?: Date;
  } | null>(null);

  const form = useForm<InsertCoachProfile>({
    resolver: zodResolver(insertCoachProfileSchema),
    defaultValues: {
      name: coachProfile?.name || '',
      email: coachProfile?.email || '',
      phone: coachProfile?.phone || '',
      bio: coachProfile?.bio || '',
      logo: coachProfile?.logo || '',
      instagram: coachProfile?.instagram || '',
      facebook: coachProfile?.facebook || '',
      website: coachProfile?.website || '',
      exportPath: coachProfile?.exportPath || '',
      pdfLineColor: coachProfile?.pdfLineColor || '#000000',
      pdfTextColor: coachProfile?.pdfTextColor || '#4F46E5',
      showWatermark: coachProfile?.showWatermark ?? true,
      useWorkoutNameAsTitle: coachProfile?.useWorkoutNameAsTitle ?? false
    }
  });

  // Update form when coach profile loads
  useEffect(() => {
    if (coachProfile) {
      form.reset({
        name: coachProfile.name,
        email: coachProfile.email || '',
        phone: coachProfile.phone || '',
        bio: coachProfile.bio || '',
        logo: coachProfile.logo || '',
        instagram: coachProfile.instagram || '',
        facebook: coachProfile.facebook || '',
        website: coachProfile.website || '',
        exportPath: coachProfile.exportPath || '',
        pdfLineColor: coachProfile.pdfLineColor || '#000000',
        pdfTextColor: coachProfile.pdfTextColor || '#4F46E5',
        showWatermark: coachProfile.showWatermark ?? true,
        useWorkoutNameAsTitle: coachProfile.useWorkoutNameAsTitle ?? false
      });
    }
  }, [coachProfile, form]);

  // Load backup stats on mount
  useEffect(() => {
    BackupManager.getBackupStats().then(setBackupStats);
  }, []);

  const handleSaveProfile = async (data: InsertCoachProfile) => {
    // Verifica se l'utente può modificare le impostazioni Coach
    if (!canAccess('coach-settings')) {
      setShowPremiumDialog(true);
      return;
    }
    try {
      if (coachProfile) {
        // Aggiorna direttamente nel database locale
        await dbOps.updateCoachProfile(coachProfile.id, data);
        toast({
          title: "Profilo aggiornato",
          description: "Le modifiche sono state salvate e rimarranno visibili"
        });
      } else {
        // Crea nuovo profilo nel database locale
        await dbOps.createCoachProfile(data);
        toast({
          title: "Profilo creato",
          description: "Il profilo è stato salvato e rimarrà visibile"
        });
      }
      
      // Ricarica la pagina automaticamente dopo il salvataggio
      window.location.reload();
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il profilo",
        variant: "destructive"
      });
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const logoBase64 = await processImageForUpload(file, 400, 400);
      form.setValue('logo', logoBase64);
      toast({
        title: "Logo caricato",
        description: "Il logo è stato caricato con successo"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile caricare il logo",
        variant: "destructive"
      });
    }
  };

  const handleBackup = async () => {
    try {
      await BackupManager.exportToJSON();
      BackupManager.setLastBackupDate();
      
      // Update backup stats
      const stats = await BackupManager.getBackupStats();
      setBackupStats(stats);
      
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


  const handleImport = async (file: File) => {
    try {
      await BackupManager.importFromJSON(file);
      
      // Update backup stats
      const stats = await BackupManager.getBackupStats();
      setBackupStats(stats);
      
      toast({
        title: "Importazione completata",
        description: "I dati sono stati importati con successo"
      });
      
      // Refresh the page to show imported data
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante l'importazione",
        variant: "destructive"
      });
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata.')) {
      try {
        await dbOps.clearAllData();
        
        // Update backup stats
        const stats = await BackupManager.getBackupStats();
        setBackupStats(stats);
        
        toast({
          title: "Dati cancellati",
          description: "Tutti i dati sono stati rimossi"
        });
        
        // Refresh the page
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile cancellare i dati",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-mobile-nav">
      {/* Premium Dialog */}
      <PremiumDialog 
        open={showPremiumDialog} 
        onOpenChange={setShowPremiumDialog} 
        feature="coach-settings" 
      />
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Impostazioni
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl">
          Configura il tuo profilo coach e le preferenze dell'app
        </p>
      </div>

      <div className="space-y-8 lg:space-y-12">
        {/* Coach Profile */}
        <Card className="glass-effect rounded-2xl animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 text-indigo-500" size={20} />
              Profilo Coach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Il tuo nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (opzionale)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@esempio.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono (opzionale)</FormLabel>
                      <FormControl>
                        <Input placeholder="+39 123 456 7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Logo Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Logo (opzionale)
                  </label>
                  <div className="flex items-center gap-4">
                    {form.watch('logo') && (
                      <div className="relative">
                        <img 
                          src={form.watch('logo')} 
                          alt="Logo" 
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => form.setValue('logo', '')}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Camera size={16} />
                      {form.watch('logo') ? 'Cambia Logo' : 'Carica Logo'}
                    </Button>
                  </div>
                </div>

                {/* Social Media Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe size={20} className="text-indigo-500" />
                    Social Media & Contatti
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Instagram size={16} className="text-pink-500" />
                            Instagram (opzionale)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="@nomeutente o URL completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Facebook size={16} className="text-blue-600" />
                            Facebook (opzionale)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Nome pagina o URL completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe size={16} className="text-green-600" />
                          Sito Web (opzionale)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.tuosito.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Export Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText size={20} className="text-purple-500" />
                    Impostazioni Export
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="exportPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Folder size={16} className="text-purple-500" />
                          Cartella Export PDF (opzionale)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(default: Downloads)" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Lascia vuoto per usare la cartella Downloads di default
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  {/* Personalizzazione PDF */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Palette size={18} className="text-emerald-500" />
                      Personalizzazione PDF
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pdfLineColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Palette size={14} className="text-emerald-500" />
                              Colore Linee PDF
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="color" 
                                  {...field} 
                                  className="w-16 h-10 p-1 rounded border cursor-pointer"
                                />
                                <Input 
                                  type="text"
                                  placeholder="#000000"
                                  {...field}
                                  className="flex-1"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Colore delle linee e dei bordi nei PDF esportati
                            </p>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="pdfTextColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Type size={14} className="text-emerald-500" />
                              Colore Titoli PDF
                            </FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="color" 
                                  {...field} 
                                  className="w-16 h-10 p-1 rounded border cursor-pointer"
                                />
                                <Input 
                                  type="text"
                                  placeholder="#4F46E5"
                                  {...field}
                                  className="flex-1"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Colore dei titoli delle sezioni nei PDF (DESCRIZIONE, PROGRESSIONE SETTIMANALE, ecc.)
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="useWorkoutNameAsTitle"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                <Type size={14} className="text-purple-500" />
                                Usa Nome Scheda come Titolo
                              </FormLabel>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Se attivato, usa il nome della scheda al posto di "SCHEDA DI ALLENAMENTO" nei PDF
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="showWatermark"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                {field.value ? <Eye size={14} className="text-blue-500" /> : <EyeOff size={14} className="text-gray-400" />}
                                Scritta "Generato con EasyWorkout Planner"
                              </FormLabel>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Mostra/nascondi la piccola scritta in basso nei PDF
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biografia (opzionale)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Scrivi qualcosa su di te..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={createCoachProfile.isPending || updateCoachProfile.isPending}
                  className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
                >
                  <Save className="mr-2" size={16} />
                  Salva Profilo
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="glass-effect rounded-2xl animate-fade-in">
          <CardHeader>
            <CardTitle>Gestione Dati</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Backup Stats */}
            {backupStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {backupStats.workoutsCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Schede</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {backupStats.clientsCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clienti</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {backupStats.lastBackup 
                      ? `Ultimo backup: ${backupStats.lastBackup.toLocaleDateString('it-IT')}`
                      : 'Nessun backup'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Azioni Backup/Cloud */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Button
                onClick={handleBackup}
                className="h-auto p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-700 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-800/40 dark:hover:to-teal-800/40 text-left justify-start min-h-[100px] w-full"
                variant="ghost"
              >
                <div className="flex items-center w-full">
                  <Download className="text-emerald-500 mr-4" size={24} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-base">
                      Esporta Backup
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Salva tutti i dati
                    </p>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                className="h-auto p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-700 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-800/40 dark:hover:to-purple-800/40 text-left justify-start min-h-[100px] w-full"
                variant="ghost"
              >
                <div className="flex items-center w-full">
                  <Upload className="text-indigo-500 mr-4" size={24} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-base">
                      Importa Backup
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ripristina da file
                    </p>
                  </div>
                </div>
              </Button>

              {/* Carica in Cloud (sovrascrive) */}
              <Button
                onClick={async () => {
                  // Verifica se l'utente può accedere alla funzionalità premium
                  if (!canAccess('coach-settings')) {
                    setShowPremiumDialog(true);
                    return;
                  }
                  
                  if (!window.confirm('Il backup remoto verrà reimpiazzato con i dati attuali, è consigliato prima caricare i dati dal cloud. Procedere?')) return;
                  try {
                    await BackupManager.exportToSupabaseStorage();
                    const stats = await BackupManager.getBackupStats();
                    setBackupStats(stats);
                    toast({ title: 'Caricato in cloud', description: 'Backup remoto aggiornato.' });
                  } catch (error) {
                    toast({ title: 'Errore', description: 'Impossibile caricare in cloud', variant: 'destructive' });
                  }
                }}
                className="h-auto p-6 text-left justify-start rounded-xl relative bg-sky-100 dark:bg-sky-900/30 border-2 border-yellow-500 hover:bg-sky-200 dark:hover:bg-sky-800/40 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 min-h-[100px] w-full"
                variant="ghost"
              >
                <div className="flex items-center w-full">
                  <Upload className="text-sky-700 dark:text-sky-300 mr-4" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-base">
                      Carica in Cloud
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Sostituisci i dati nel cloud
                    </p>
                  </div>
                </div>
              </Button>

              {/* Carica dal Cloud (sostituisce) */}
              <Button
                onClick={async () => {
                  // Verifica se l'utente può accedere alla funzionalità premium
                  if (!canAccess('coach-settings')) {
                    setShowPremiumDialog(true);
                    return;
                  }
                  
                  if (!window.confirm('I dati locali verranno completamente sostituiti con quelli dal cloud. Procedere?')) return;
                  try {
                    await BackupManager.mergeFromSupabaseStorage();
                    const stats = await BackupManager.getBackupStats();
                    setBackupStats(stats);
                    toast({ title: 'Dati sostituiti', description: 'Dati locali sostituiti con quelli del cloud.' });
                    setTimeout(() => window.location.reload(), 500);
                  } catch (error) {
                    toast({ title: 'Errore', description: 'Impossibile caricare dal cloud', variant: 'destructive' });
                  }
                }}
                className="h-auto p-6 text-left justify-start rounded-xl relative bg-sky-100 dark:bg-sky-900/30 border-2 border-yellow-500 hover:bg-sky-200 dark:hover:bg-sky-800/40 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 min-h-[100px] w-full"
                variant="ghost"
              >
                <div className="flex items-center w-full">
                  <Download className="text-sky-700 dark:text-sky-300 mr-4" size={24} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-base">
                      Carica dal Cloud
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Importa i dati remoti
                    </p>
                  </div>
                </div>
              </Button>

              <Button
                onClick={handleClearData}
                className="h-auto p-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border border-red-200 dark:border-red-700 hover:from-red-100 hover:to-pink-100 dark:hover:from-red-800/40 dark:hover:to-pink-800/40 text-left justify-start min-h-[100px] w-full"
                variant="ghost"
              >
                <div className="flex items-center w-full">
                  <Trash2 className="text-red-500 mr-4" size={24} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-base">
                      Cancella Tutto
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Rimuovi tutti i dati
                    </p>
                  </div>
                </div>
              </Button>
            </div>

            {/* Pulsanti cloud espliciti: nessun salvataggio automatico */}
          </CardContent>
        </Card>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImport(file);
          }
        }}
        className="hidden"
      />
      
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleLogoUpload(file);
          }
        }}
        className="hidden"
      />
    </main>
  );
}
