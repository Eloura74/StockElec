"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export interface ChartDataPoint {
  name: string
  [key: string]: any
}

export function DashboardCharts({ 
  sortiesData, 
  pieData,
  topConsoData
}: { 
  sortiesData: ChartDataPoint[]
  pieData: ChartDataPoint[]
  topConsoData: ChartDataPoint[]
}) {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Graphique : Sorties récentes */}
      <div className="rounded-xl border bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-zinc-50 mb-4">Matériel sorti (7 derniers jours)</h3>
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
      <div className="rounded-xl border bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-zinc-50 mb-4">Répartition de la valeur en stock</h3>
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
                  formatter={(value: any) => `${Number(value).toFixed(2)} €`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 dark:text-zinc-500 text-sm">Aucune valeur en stock</p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          {pieData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1 text-xs text-gray-600 dark:text-zinc-300">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
              {entry.name}
            </div>
          ))}
        </div>
      </div>

      {/* Graphique : Top 5 Consommés */}
      <div className="rounded-xl border bg-white dark:bg-zinc-900 p-6 shadow-sm lg:col-span-2">
        <h3 className="font-semibold text-gray-900 dark:text-zinc-50 mb-4">Top 5 des articles les plus utilisés</h3>
        <div className="h-64 w-full">
          {topConsoData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topConsoData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={150} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <RechartsTooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="quantite" fill="#10b981" radius={[0, 4, 4, 0]} name="Unités utilisées" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">Aucune donnée disponible</div>
          )}
        </div>
      </div>
    </div>
  )
}
