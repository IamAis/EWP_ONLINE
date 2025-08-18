import { TrendingUp, Users, FileText } from 'lucide-react';
import { useWorkouts } from '@/hooks/use-workouts';
import { useClients } from '@/hooks/use-clients';

export function StatsCards() {
  const { data: workouts = [] } = useWorkouts();
  const { data: clients = [] } = useClients();

  const activeWorkouts = workouts.length;
  const totalClients = clients.length;
  const exportedPDFs = parseInt(localStorage.getItem('exportedPDFs') || '0');

  const stats = [
    {
      title: 'Schede Attive',
      value: activeWorkouts,
      icon: TrendingUp,
      gradient: 'from-emerald-400 to-teal-500'
    },
    {
      title: 'Clienti Totali',
      value: totalClients,
      icon: Users,
      gradient: 'from-blue-400 to-indigo-500'
    },
    {
      title: 'PDF Esportati',
      value: exportedPDFs,
      icon: FileText,
      gradient: 'from-orange-400 to-red-500'
    }
  ];

  return (
    <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div 
          key={stat.title}
          className="glass-effect rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
            <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center`}>
              <stat.icon className="text-white" size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
