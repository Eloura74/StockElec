"use client"

import React from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'
import { Activity, PieChart as PieIcon, TrendingUp } from 'lucide-react'

export interface ChartDataPoint {
  name: string
  [key: string]: any
}

// Composant Tooltip Personnalisé Prestige
function CyberChartTooltip({ active, payload, label, unit = "unités", isCurrency = false }: any) {
  if (active && payload && payload.length) {
    const item = payload[0]
    const rawVal = Number(item.value) || 0
    const formattedVal = isCurrency 
      ? `${rawVal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT`
      : `${rawVal.toLocaleString('fr-FR')} ${unit}`

    return (
      <div className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#111622]/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl text-xs space-y-1 z-50 pointer-events-none min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-1.5">
          <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[150px]">
            {label || item.name}
          </span>
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color || item.fill || '#3b82f6' }} />
        </div>
        <div className="flex items-baseline justify-between gap-3 pt-0.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {item.name || "Quantité"} :
          </span>
          <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
            {formattedVal}
          </span>
        </div>
      </div>
    )
  }
  return null
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
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Graphique 1 : Sorties récentes */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] p-5 sm:p-6 shadow-2xs hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Matériel sorti (7 derniers jours)
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Survolez les colonnes pour inspecter les départs par date
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortiesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/[0.06]" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <RechartsTooltip 
                cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }}
                content={<CyberChartTooltip unit="pcs" />}
              />
              <Bar 
                dataKey="sorties" 
                fill="#3b82f6" 
                radius={[6, 6, 0, 0]} 
                name="Unités sorties"
                className="transition-all hover:opacity-85 cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique 2 : Répartition valeur */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] p-5 sm:p-6 shadow-2xs hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-slate-800 dark:text-amber-400 flex items-center justify-center">
              <PieIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Répartition de la valeur en stock
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Survolez un segment pour afficher le montant valorisé
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  className="cursor-pointer"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="transition-all hover:opacity-80"
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CyberChartTooltip isCurrency={true} />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 text-xs">Aucune valeur immobilisée</p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          {pieData.map((entry, index) => (
            <div 
              key={entry.name} 
              className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
              <span className="font-medium">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graphique 3 : Top 5 Consommés */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] p-5 sm:p-6 shadow-2xs hover:shadow-md transition-shadow lg:col-span-2 group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Top 5 des articles les plus consommés
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Survolez les barres horizontales pour consulter les débits cumulés
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {topConsoData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topConsoData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-white/[0.06]" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" width={160} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }} 
                  content={<CyberChartTooltip unit="unités consommées" />} 
                />
                <Bar 
                  dataKey="quantite" 
                  fill="#10b981" 
                  radius={[0, 6, 6, 0]} 
                  name="Sorties cumulées" 
                  className="transition-all hover:opacity-85 cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400 dark:text-slate-500">
              Aucune donnée de consommation enregistrée
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
