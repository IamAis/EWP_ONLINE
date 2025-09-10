import { useAuth } from './use-auth';
import { PDFGenerator } from '@/lib/pdf-generator';

/**
 * Hook personalizzato che restituisce un'istanza di PDFGenerator con lo stato di login corretto
 */
export function usePDFGenerator() {
  const { user } = useAuth();
  
  // Crea una nuova istanza di PDFGenerator con lo stato di login corrente
  const pdfGenerator = new PDFGenerator(!!user);
  
  return pdfGenerator;
}