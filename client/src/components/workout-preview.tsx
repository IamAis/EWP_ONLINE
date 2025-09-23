import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar } from 'lucide-react';
import type { Week } from '@shared/schema';

interface WorkoutPreviewProps {
  weeks: Week[];
  clientName?: string;
  coachName?: string;
  workoutType?: string;
  description?: string;
}

export function WorkoutPreview({ 
  weeks, 
  clientName = "Anteprima Cliente", 
  coachName = "Coach", 
  workoutType = "Scheda Personalizzata",
  description = ""
}: WorkoutPreviewProps) {
  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {clientName}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {workoutType} • {weeks.length} settiman{weeks.length === 1 ? 'a' : 'e'}
        </p>
      </div>

      {/* Basic Info */}
      <Card className="glass-effect rounded-2xl">
        <CardHeader>
          <CardTitle>Informazioni Generali</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Coach
            </label>
            <p className="text-gray-900 dark:text-white">{coachName}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo di Scheda
            </label>
            <p className="text-gray-900 dark:text-white">{workoutType}</p>
          </div>

          {description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrizione
              </label>
              <p className="text-gray-900 dark:text-white">{description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Progression */}
      {weeks.length > 0 && (
        <Card className="glass-effect rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 text-indigo-500" size={20} />
              Progressione Settimanale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {weeks.map((week) => (
                <div key={week.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-white/20 dark:bg-gray-800/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {week.name || `Settimana ${week.number}`}
                    </h3>
                  </div>

                  {week.notes && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">{week.notes}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {(week.days || []).map((day) => (
                      <div key={day.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-white/30 dark:bg-gray-900/30">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          {day.name}
                        </h4>

                        {day.notes && (
                          <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400">{day.notes}</p>
                          </div>
                        )}

                        {(day.exercises || []).length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600">
                                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Esercizio</th>
                                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Serie</th>
                                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Reps</th>
                                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Carico</th>
                                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">Recupero</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(day.exercises || []).map((exercise) => (
                                  <tr key={exercise.id} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="py-2 px-2 align-top">
                                      <span className="text-gray-900 dark:text-white break-words">
                                        {exercise.name || 'Esercizio senza nome'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 align-top">{exercise.sets}</td>
                                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 align-top">{exercise.reps}</td>
                                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 align-top">{exercise.load || '-'}</td>
                                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 align-top">{exercise.rest || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                            Nessun esercizio aggiunto
                          </p>
                        )}
                      </div>
                    ))}
                    
                    {(week.days || []).length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                        Nessun giorno aggiunto
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {weeks.length === 0 && (
        <Card className="glass-effect rounded-2xl">
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Inizia aggiungendo una settimana per vedere l'anteprima
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}