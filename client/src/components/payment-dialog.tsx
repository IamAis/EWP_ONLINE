import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Check, CreditCard, Shield, Users, Zap, Cloud, BookOpen, Loader2 } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

type PaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId: string;
  features: string[];
  popular?: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'prod_T8ErPkfgrCVZYQ',
    name: 'Premium Mensile',
    description: 'Accesso completo a tutte le funzionalità',
    price: 9.99,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_1SByNiB9OdrA1n3nPiBLkFTr', // Da sostituire con il vero ID Stripe
    features: [
      'Schede di allenamento illimitate',
      'Clienti illimitati',
      'Backup cloud dei dati',
      'Glossario esercizi completo',
      'Personalizzazione PDF avanzata',
      'Supporto prioritario'
    ]
  }
];

export function PaymentDialog({ open, onOpenChange, onSuccess }: PaymentDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'plans' | 'checkout'>('plans');
  const { toast } = useToast();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep('plans');
      setSelectedPlan(null);
      setCustomerInfo({ name: '', email: '' });
    }
  }, [open]);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setStep('checkout');
  };

  const handleBackToPlans = () => {
    setStep('plans');
    setSelectedPlan(null);
  };

  const handleCheckout = async () => {
    if (!selectedPlan || !customerInfo.name || !customerInfo.email) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi richiesti",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: selectedPlan.stripePriceId,
          email: customerInfo.email,
          customerName: customerInfo.name,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-canceled`
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nella creazione della sessione di pagamento');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe non è stato caricato correttamente');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Errore durante il checkout:', error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante il pagamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string, interval: string) => {
    const formatted = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency,
    }).format(price);
    
    return `${formatted}/${interval === 'month' ? 'mese' : 'anno'}`;
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('illimitat')) return <Users className="w-4 h-4" />;
    if (feature.includes('cloud') || feature.includes('backup')) return <Cloud className="w-4 h-4" />;
    if (feature.includes('glossario')) return <BookOpen className="w-4 h-4" />;
    if (feature.includes('supporto')) return <Shield className="w-4 h-4" />;
    if (feature.includes('risparmio')) return <Zap className="w-4 h-4" />;
    return <Check className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {step === 'plans' ? 'Scegli il tuo Piano Premium' : 'Completa il Pagamento'}
          </DialogTitle>
          <DialogDescription>
            {step === 'plans' 
              ? 'Sblocca tutte le funzionalità premium e porta il tuo coaching al livello successivo'
              : 'Inserisci i tuoi dati per completare l\'acquisto'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'plans' && (
          <div className="grid md:grid-cols-2 gap-6 py-6">
            {subscriptionPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  plan.popular ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:ring-1 hover:ring-gray-300'
                }`}
                onClick={() => handlePlanSelect(plan)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600">
                    Più Popolare
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-indigo-600">
                      {formatPrice(plan.price, plan.currency, plan.interval)}
                    </span>
                    {plan.interval === 'year' && (
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Risparmi €24 all'anno
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="text-indigo-600 mt-0.5">
                          {getFeatureIcon(feature)}
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    onClick={() => handlePlanSelect(plan)}
                  >
                    Scegli {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 'checkout' && selectedPlan && (
          <div className="py-6 space-y-6">
            {/* Plan Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Riepilogo Ordine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{selectedPlan.name}</h3>
                    <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-indigo-600">
                      {formatPrice(selectedPlan.price, selectedPlan.currency, selectedPlan.interval)}
                    </div>
                    {selectedPlan.interval === 'year' && (
                      <div className="text-sm text-green-600">Risparmi €24</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informazioni di Fatturazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Il tuo nome completo"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="la-tua-email@esempio.com"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Pagamento Sicuro</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                I tuoi dati di pagamento sono protetti da crittografia SSL e gestiti da Stripe, 
                leader mondiale nei pagamenti online.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleBackToPlans}
                disabled={isLoading}
                className="flex-1"
              >
                Torna ai Piani
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={isLoading || !customerInfo.name || !customerInfo.email}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Elaborazione...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Procedi al Pagamento
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}