"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export function DashboardCharts({ 
  mouvementsRecents, 
  articles 
}: { 
  mouvementsRecents: any[],
  articles: any[]
}) {
  // 1. Préparer les données pour le graphique des sorties (Départs et Consommés sur les 7 derniers jours)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  }).reverse();

  const sortiesData = last7Days.map(dayStr => ({
    name: dayStr,
    sorties: 0
  }));

  mouvementsRecents.forEach(mvt => {
    if (mvt.type === 'Depart' || mvt.type === 'Consomme') {
      const dayStr = new Date(mvt.date).toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayData = sortiesData.find(d => d.name === dayStr);
      if (dayData) {
        dayData.sorties += mvt.quantite;
      }
    }
  });

  // 2. Préparer les données pour le graphique de répartition de la valeur par catégorie
  const categoriesMap = new Map<string, number>();
  
  articles.forEach(article => {
    let stockCourant = 0;
    (article.mouvements || []).forEach((mvt: any) => {
      if (mvt.type === 'Achat' || mvt.type === 'Retour') stockCourant += mvt.quantite;
      if (mvt.type === 'Depart' || mvt.type === 'Consomme' || mvt.type === 'Perte') stockCourant -= mvt.quantite;
    });
    
    if (stockCourant > 0) {
      const val = stockCourant * (article.prixUnitaire || 0);
      const cat = article.categorie || 'Autre';
      categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + val);
    }
  });

  const pieData = Array.from(categoriesMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Graphique : Sorties récentes */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Matériel sorti (7 derniers jours)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortiesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <RechartsTooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="sorties" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Unités sorties" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique : Répartition valeur */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Répartition de la valeur en stock</h3>
        <div className="h-64 w-full flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => `${value.toFixed(2)} €`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm">Aucune valeur en stock</p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          {pieData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1 text-xs text-gray-600">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
              {entry.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
