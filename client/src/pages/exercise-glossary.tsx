import { BookOpen } from 'lucide-react';
import { ExerciseGlossaryManager } from '@/components/exercise-glossary';

export default function ExerciseGlossaryPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-mobile-nav">
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Glossario Esercizi
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl">
          Gestisci e organizza il tuo catalogo di esercizi
        </p>
      </div>

      <div className="space-y-8 lg:space-y-12">
        <ExerciseGlossaryManager />
      </div>
    </main>
  );
}