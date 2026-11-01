"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Activity, PieChart as PieIcon, BarChart3 } from 'lucide-react'

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

  let totalSortiesSemaine = 0;
  mouvementsRecents.forEach(mvt => {
    if (mvt.type === 'Depart' || mvt.type === 'Consomme') {
      const dayStr = new Date(mvt.date).toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayData = sortiesData.find(d => d.name === dayStr);
      if (dayData) {
        dayData.sorties += mvt.quantite;
        totalSortiesSemaine += mvt.quantite;
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

  const COLORS = ['#2563eb', '#059669', '#d97706', '#6366f1', '#e11d48', '#64748b'];

  // 3. Top 5 des articles les plus consommés
  const consoMap = new Map<string, number>();
  articles.forEach(article => {
    let consoTotal = 0;
    (article.mouvements || []).forEach((mvt: any) => {
      if (mvt.type === 'Consomme' || mvt.type === 'Depart') {
        consoTotal += mvt.quantite;
      }
    });
    if (consoTotal > 0) consoMap.set(article.designation, consoTotal);
  });

  const topConsoData = Array.from(consoMap.entries())
    .map(([name, quantite]) => ({ name, quantite }))
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Graphique : Sorties récentes */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] p-5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Flux Sorties (7 derniers jours)
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Matériel affecté sur chantiers</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
            {totalSortiesSemaine} unité(s)
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortiesData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <RechartsTooltip 
                cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  backgroundColor: '#0c1017',
                  color: '#ffffff',
                  fontSize: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)' 
                }}
              />
              <Bar dataKey="sorties" fill="#2563eb" radius={[6, 6, 0, 0]} name="Unités sorties" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique : Répartition valeur */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] p-5 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 flex items-center justify-center">
              <PieIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Répartition de la Valeur
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Valorisation financière par catégorie</p>
            </div>
          </div>
        </div>

        <div className="h-48 w-full flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    backgroundColor: '#0c1017',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)' 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-slate-400 dark:text-slate-500">Aucune valorisation disponible pour le moment.</p>
            </div>
          )}
        </div>

        {pieData.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
            {pieData.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="truncate max-w-[100px]">{entry.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Graphique : Top 5 Consommés (si disponible) */}
      {topConsoData.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] p-5 shadow-2xs lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 flex items-center justify-center">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Top Consommations Chantiers
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Articles les plus sollicités</p>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topConsoData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" width={140} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    backgroundColor: '#0c1017',
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)' 
                  }} 
                />
                <Bar dataKey="quantite" fill="#059669" radius={[0, 6, 6, 0]} name="Unités utilisées" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
