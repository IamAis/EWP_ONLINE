import { useState } from "react";
import { Check, Crown, Users, Zap, Shield, Sparkles, FileText, Cloud, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { usePremium } from "@/hooks/use-premium";
import { PaymentDialog } from "@/components/payment-dialog";

const aboutSections = [
  {
    title: "Cosa puoi fare con WorkoutMaker",
    description:
      "Una suite completa di strumenti per coach e personal trainer, disegnata per accompagnarti dalla prima idea di scheda fino alla consegna ai tuoi atleti.",
    highlights: [
      {
        title: "Editor Avanzato",
        description:
          "Progetta le tue schede di allenamento: organizzando settimane, giorni ed esercizi con un'interfaccia fluida ed intuitiva. Per accedere alla modalità Drag & Drop è necessario la versione Premium.",
        icon: Zap,
      },
      {
        title: "Gestione Clienti e Schede",
        description:
          "La dashboard clienti ti consente di raggruppare anagrafica, contatti e note. Salva commenti su ogni workout e mantieni sincronizzate le schede: fino a 3 workout e 2 clienti nella versione gratuita, senza limiti in Premium.",
        icon: Users,
      },
      {
        title: "Anteprima & Condivisione",
        description:
          "Genera PDF in tempo reale per controllare ogni dettaglio della scheda prima della consegna. Un clic per scaricare, condividere o riprendere da dove avevi lasciato.",
        icon: FileText,
      },
      {
        title: "Backup Flessibili",
        description:
          "Importa ed esporta i tuoi dati in JSON e sfrutta i backup automatici su Supabase con il piano Premium. I reminder di backup e il ripristino sono integrati nella navigazione.",
        icon: Cloud,
      },
    ],
  },
];

const premiumBenefits = [
  "Schede, clienti e glossario senza limiti",
  "Duplicazione rapida di settimane, giorni ed esercizi",
  "Backup cloud e sincronizzazione multi-dispositivo",
  "Personalizzazione completa del profilo coach e branding PDF",
  "Accesso prioritario alle nuove funzionalità e supporto dedicato",
];

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
];

export default function AboutPage() {
  const { user } = useAuth();
  const { isLoggedIn } = usePremium();
  const [paymentOpen, setPaymentOpen] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <nav className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            <a href={crumb.href} className="hover:text-indigo-500 transition-colors">
              {crumb.label}
            </a>
            {index < breadcrumbs.length - 1 && <span>/</span>}
          </div>
        ))}
      </nav>

      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
          Chi Siamo e Cosa Offriamo
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          WorkoutMaker nasce per semplificare la programmazione degli allenamenti.
          Automatizziamo i passaggi ripetitivi, lasciando a te il controllo creativo.
        </p>
        <br></br>
      </header>

      <section className="grid gap-8 md:grid-cols-[2fr,1fr] items-start">
        <div className="space-y-8">
          <article className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Missione
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Vogliamo che i coach possano creare programmi personalizzati in modo rapido e professionale,
              portando ogni atleta verso i propri obiettivi. Dal primo scheletro della scheda al PDF finale,
              supportiamo ogni step con strumenti chiari, flessibili e accessibili ovunque.
            </p>
          </article>

          <article className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Chi siamo
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Un gruppo di developer appassionati del Fitness, con l'idea di realizzare una piattaforma semplice e comoda
              adatta sia a professionisti sia a coloro che si affacciamo in questo mondo.
              WorkoutMaker è stato progettato insieme a coach e preparatori che lavorano sul campo.
              Abbiamo raccolto feedback reali e li abbiamo trasformati in funzionalità che riducono il lavoro manuale.
            </p>
          </article>

          {aboutSections.map((section) => (
            <article key={section.title} className="space-y-6">
              <div className="space-y-2">
                <Badge className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200">
                  Funzionalità
                </Badge>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
              </div>
              <div className="grid gap-6">
                {section.highlights.map((highlight) => (
                  <Card key={highlight.title} className="glass-effect border border-indigo-100 dark:border-indigo-900/40">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <span className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40">
                        <highlight.icon className="text-indigo-500" size={24} />
                      </span>
                      <CardTitle className="text-xl text-gray-900 dark:text-white">
                        {highlight.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {highlight.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-6">
          <Card className="glass-effect border border-amber-200/60 dark:border-amber-400/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-amber-600 dark:text-amber-300">
                <Crown size={20} />
                Premium Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Sblocca l'intera potenza della piattaforma con strumenti evoluti pensati per i coach che gestiscono team e programmi complessi.
              </p>
              <Separator className="bg-amber-200/50 dark:bg-amber-400/20" />
              <ul className="space-y-3 text-sm">
                {premiumBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                    <Check size={16} className="mt-1 text-amber-500" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              {!isLoggedIn && (
                <Button onClick={() => setPaymentOpen(true)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                  Upgrade a Premium
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect border border-indigo-100 dark:border-indigo-900/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-indigo-600 dark:text-indigo-300">
                <Shield size={18} />
                Sicurezza e privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                I dati dei tuoi clienti rimangono al sicuro. Puoi esportarli in qualsiasi momento e tenerne il controllo pieno.
                Con il piano Premium, il salvataggio su Supabase garantisce sincronizzazione e recupero immediato.
              </p>
              <p>
                L'accesso alle funzioni avanzate è protetto da autenticazione: l'editor drag & drop completo, i commenti alle schede
                e la personalizzazione del profilo coach sono disponibili solo dopo aver effettuato il login.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border border-purple-200/60 dark:border-purple-400/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-purple-600 dark:text-purple-200">
                <Sparkles size={18} />
                Perché lo facciamo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                Conosciamo i problemi pratici della programmazione: duplicare gli esercizi, adattare le progressioni,
                mantenere le schede aggiornate su più dispositivi. Per questo preferiamo strumenti semplici, scorciatoie intelligenti
                e automazioni che liberano tempo per seguire meglio i tuoi atleti.
              </p>
              <p>
                Ogni nuova release parte dai feedback della community. Se hai un'idea, vuoi ottimizzare un flusso o hai bisogno di integrazioni,
                scrivici: crescere con i coach è parte della nostra identità.
              </p>
            </CardContent>
          </Card>
        </aside>
      </section>

      <section className="glass-effect rounded-3xl border border-indigo-100 dark:border-indigo-900/40 p-8 text-center space-y-4">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
          Pronto a creare la prossima scheda?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Inizia con la versione gratuita per esplorare il funzionamento. Quando sei pronto a crescere, il piano Premium apre duplicazioni automatiche,
          backup cloud e branding professionale su ogni esportazione.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" className="bg-gradient-primary text-white px-8" onClick={() => setPaymentOpen(true)}>
            Crea un account
          </Button>
          <Button size="lg" variant="outline" className="border-indigo-200 text-indigo-600">
            Confronta i piani
          </Button>
        </div>
      </section>

      {/* Payment Dialog */}
      <PaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
    </div>
  );
}