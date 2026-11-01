"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Package, 
  Truck, 
  AlertTriangle, 
  TrendingDown, 
  ArrowRight, 
  Wrench, 
  HardHat, 
  ArrowRightLeft, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  SlidersHorizontal,
  BarChart2,
  DollarSign,
  Activity,
  Layers,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { ExportExcelComptableButton } from "@/components/ExportExcelComptableButton";

interface ChantierItem {
  id: string;
  nom: string;
  statut: string;
  adresse?: string | null;
  client?: string | null;
  materielCount: number;
  valeurSurSite: number;
  materielDetails: {
    reference: string;
    designation: string;
    quantite: number;
    prixUnitaire: number;
  }[];
}

interface ArticleAlerteItem {
  id: string;
  reference: string;
  designation: string;
  categorie?: string | null;
  unite: string;
  stockDepot: number;
  stockMinimum: number;
  prixUnitaire: number;
  aCommander: number;
}

interface DynamicDashboardClientProps {
  articlesCount: number;
  articlesEnStockCount?: number;
  totalPiecesStock?: number;
  chantiersActifsCount: number;
  valeurTotaleDépôt: number;
  valeurTotaleChantiers: number;
  articlesEnAlerte: number;
  chantiersList: ChantierItem[];
  alertesList: ArticleAlerteItem[];
  topImmobilisations: {
    article: any;
    valeur: number;
  }[];
  dataDepot: any[];
  dataChantiers: any[];
  sortiesData: any[];
  pieData: any[];
  topConsoData: any[];
}

export function DynamicDashboardClient({
  articlesCount,
  articlesEnStockCount,
  totalPiecesStock,
  chantiersActifsCount,
  valeurTotaleDépôt,
  valeurTotaleChantiers,
  articlesEnAlerte,
  chantiersList,
  alertesList,
  topImmobilisations,
  dataDepot,
  dataChantiers,
  sortiesData,
  pieData,
  topConsoData,
}: DynamicDashboardClientProps) {
  // 1. État de la navigation dynamique (Onglets)
  const [activeTab, setActiveTab] = useState<"general" | "chantiers" | "alertes" | "finance">("general");

  // 2. État du Carrousel Hero (Slide d'en-tête)
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const heroSlidesCount = 3;

  // Auto-play du hero carrousel toutes les 6 secondes avec pause au survol
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % heroSlidesCount);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, heroSlidesCount]);

  // 3. Références pour le défilement horizontal des carrousels
  const chantiersScrollRef = useRef<HTMLDivElement>(null);
  const alertesScrollRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // 4. Slide-Over Drawer (Tiroir latéral coulissant d'inspection)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<{
    type: "chantier" | "article";
    data: any;
  } | null>(null);

  const openDrawer = (type: "chantier" | "article", data: any) => {
    setDrawerContent({ type, data });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  // Fermeture par touche Echap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // Date actuelle formatée
  const todayFormatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      
      {/* ========================================================= */}
      {/* 1. HERO CARROUSEL INTERACTIF // VITRINE DYNAMIQUE         */}
      {/* ========================================================= */}
      <div 
        className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#111622]/90 backdrop-blur-md shadow-sm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Contenu des Slides avec transition fluide */}
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentHeroSlide * 100}%)` }}
        >
          {/* SLIDE 1 : SYNTHÈSE GLOBALE */}
          <div className="min-w-full p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                  Pilotage Exécutif
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                  {todayFormatted}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Tableau de Bord StockElec
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Supervision centralisée en direct de l'activité, des chantiers actifs et de la valorisation des stocks de Quentin Électricité.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link 
                href="/mouvements" 
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm flex items-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Nouveau Mouvement</span>
              </Link>
              <Link 
                href="/chantiers" 
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center gap-2 transition-all"
              >
                <HardHat className="w-4 h-4" />
                <span>Voir Chantiers ({chantiersActifsCount})</span>
              </Link>
            </div>
          </div>

          {/* SLIDE 2 : FOCUS CHANTIERS */}
          <div className="min-w-full p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent">
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                  Déploiement Opérationnel
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {chantiersActifsCount} Chantier{chantiersActifsCount > 1 ? "s" : ""} Actif{chantiersActifsCount > 1 ? "s" : ""} en Cours
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {valeurTotaleChantiers.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € de matériel et fournitures engagés sur vos différents sites d'intervention.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button 
                type="button"
                onClick={() => setActiveTab("chantiers")}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Parcourir les Chantiers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SLIDE 3 : FOCUS RUPTURES & RÉASSORT */}
          <div className="min-w-full p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent">
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                  Surveillance des Stocks
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {articlesEnAlerte} Référence{articlesEnAlerte > 1 ? "s" : ""} en Alerte de Stock
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Anticipez vos besoins avant le départ sur les chantiers en déclenchant un réassort auprès de vos fournisseurs.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button 
                type="button"
                onClick={() => setActiveTab("alertes")}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Voir les Alertes Stock</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Contrôles du Carrousel (Boutons Précédent / Suivant et Points de navigation) */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[...Array(heroSlidesCount)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentHeroSlide(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentHeroSlide === i 
                    ? "w-7 bg-slate-900 dark:bg-white" 
                    : "w-2 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/40"
                }`}
                aria-label={`Aller au slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentHeroSlide((prev) => (prev - 1 + heroSlidesCount) % heroSlidesCount)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              aria-label="Slide précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentHeroSlide((prev) => (prev + 1) % heroSlidesCount)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              aria-label="Slide suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. NAVIGATION DYNAMIQUE PAR ONGLETS COULISSANTS (TABS)     */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-[#111622] border border-slate-200/80 dark:border-white/[0.08] shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "general"
                ? "bg-white text-slate-900 dark:bg-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Vue Globale</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chantiers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "chantiers"
                ? "bg-white text-slate-900 dark:bg-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Chantiers & Projets ({chantiersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("alertes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "alertes"
                ? "bg-white text-slate-900 dark:bg-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>Stocks & Alertes ({articlesEnAlerte})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finance")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "finance"
                ? "bg-white text-slate-900 dark:bg-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Finances & Flux</span>
          </button>
        </div>

        {/* Boutons d'action rapide */}
        <div className="flex items-center gap-2">
          <Link 
            href="/catalogue" 
            className="bg-white dark:bg-[#111622] hover:bg-slate-50 dark:hover:bg-[#161d2d] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span>Nouvel Article</span>
          </Link>
          <ExportExcelComptableButton dataDepot={dataDepot} dataChantiers={dataChantiers} />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. VUE PRINCIPALE : VUE GLOBALE & SYNTHÈSE               */}
      {/* ========================================================= */}
      {activeTab === "general" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 5 Indicateurs Clés (KPIs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* KPI 1 : Articles */}
            <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  Articles en Stock
                </span>
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {(articlesEnStockCount ?? articlesCount).toLocaleString('fr-FR')}
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">réf. avec stock</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {(totalPiecesStock ?? 0) > 0 ? `${totalPiecesStock?.toLocaleString('fr-FR')} pièces · ` : ""}
                  <Link href="/catalogue" className="hover:underline hover:text-blue-500">
                    {articlesCount.toLocaleString('fr-FR')} au catalogue
                  </Link>
                </p>
              </div>
            </div>

            {/* KPI 2 : Chantiers */}
            <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  Chantiers Actifs
                </span>
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 flex items-center justify-center">
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {chantiersActifsCount.toLocaleString('fr-FR')}
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">en cours d'exécution</p>
              </div>
            </div>

            {/* KPI 3 : Valeur Dépôt */}
            <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  Valeur Dépôt
                </span>
                <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-slate-800 dark:text-amber-400 flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {valeurTotaleDépôt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">matériel disponible</p>
              </div>
            </div>

            {/* KPI 4 : Valeur Chantiers */}
            <div className="p-4.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  Valeur Chantiers
                </span>
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 flex items-center justify-center">
                  <Wrench className="h-4 w-4" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {valeurTotaleChantiers.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">en cours d'installation</p>
              </div>
            </div>

            {/* KPI 5 : Alertes Stock */}
            <div className={`p-4.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
              articlesEnAlerte > 0
                ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                : "bg-white dark:bg-[#111622] border-slate-200/80 dark:border-white/[0.08] shadow-2xs"
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold tracking-wider uppercase ${articlesEnAlerte > 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
                  Alertes Stock
                </span>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                  articlesEnAlerte > 0 
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div>
                <h2 className={`text-2xl font-bold tracking-tight tabular-nums ${articlesEnAlerte > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                  {articlesEnAlerte.toLocaleString('fr-FR')}
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">articles à réapprovisionner</p>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CARROUSEL HORIZONTAL DES CHANTIERS EN COURS               */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Carrousel des Chantiers</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Faites défiler horizontalement pour visualiser le matériel et les budgets engagés.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollCarousel(chantiersScrollRef, "left")}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  aria-label="Faire défiler vers la gauche"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(chantiersScrollRef, "right")}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  aria-label="Faire défiler vers la droite"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Slider container */}
            <div 
              ref={chantiersScrollRef}
              className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1"
            >
              {chantiersList.map((chantier) => (
                <div
                  key={chantier.id}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[320px] shrink-0 snap-start p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        chantier.statut === "Actif"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {chantier.statut}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white tabular-nums">
                        {chantier.valeurSurSite.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {chantier.nom}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {chantier.adresse || "Aucune adresse spécifiée"}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {chantier.materielCount} article{chantier.materielCount > 1 ? "s" : ""} sur place
                    </span>
                    <button
                      type="button"
                      onClick={() => openDrawer("chantier", chantier)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspecter</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {chantiersList.length === 0 && (
                <div className="w-full p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Aucun chantier enregistré.</p>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* CARROUSEL HORIZONTAL DES ARTICLES EN RUPTURE / RÉASSORT   */}
          {/* ========================================================= */}
          {alertesList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Carrousel des Alertes de Stock</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Glissez pour inspecter les articles prioritaires à réapprovisionner.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollCarousel(alertesScrollRef, "left")}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    aria-label="Faire défiler vers la gauche"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel(alertesScrollRef, "right")}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    aria-label="Faire défiler vers la droite"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Slider container */}
              <div 
                ref={alertesScrollRef}
                className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1"
              >
                {alertesList.slice(0, 10).map((art) => {
                  const healthPercent = Math.min(100, Math.round((art.stockDepot / (art.stockMinimum * 2 || 1)) * 100));
                  return (
                    <div
                      key={art.id}
                      className="min-w-[280px] sm:min-w-[320px] max-w-[320px] shrink-0 snap-start p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/30 bg-rose-50/20 dark:bg-[#151119] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                            {art.stockDepot === 0 ? "Rupture totale" : "Seuil critique"}
                          </span>
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                            {art.stockDepot} / min {art.stockMinimum} {art.unite}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {art.designation}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          {art.reference}
                        </p>

                        {/* Jauge visuelle de niveau de stock */}
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span>Niveau de réserve</span>
                            <span>{healthPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-rose-500 rounded-full transition-all"
                              style={{ width: `${healthPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          À cder : {art.aCommander} {art.unite}
                        </span>
                        <button
                          type="button"
                          onClick={() => openDrawer("article", art)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Fiche</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Graphiques Exécutifs */}
          <DashboardCharts sortiesData={sortiesData} pieData={pieData} topConsoData={topConsoData} />
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. VUE ONGLETS : CHANTIERS & PROJETS                      */}
      {/* ========================================================= */}
      {activeTab === "chantiers" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Portefeuille des Chantiers
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Liste complète des chantiers avec détail du matériel mobilisé et des valorisations.
              </p>
            </div>
            <Link 
              href="/chantiers" 
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Gérer les chantiers</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chantiersList.map((chantier) => (
              <div 
                key={chantier.id} 
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                      {chantier.statut}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                      {chantier.valeurSurSite.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {chantier.nom}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {chantier.adresse || "Pas d'adresse renseignée"}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {chantier.materielCount} référence(s) sur site
                  </span>
                  <button
                    type="button"
                    onClick={() => openDrawer("chantier", chantier)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Détail rapide</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. VUE ONGLETS : STOCKS & ALERTES                         */}
      {/* ========================================================= */}
      {activeTab === "alertes" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Articles sous le Seuil de Sécurité ({alertesList.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Liste ordonnée par criticité pour générer vos commandes de réapprovisionnement.
              </p>
            </div>
            <Link 
              href="/reassort" 
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Module Réassort</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alertesList.map((art) => (
              <div 
                key={art.id} 
                className="p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-white dark:bg-[#111622] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                      {art.stockDepot === 0 ? "Rupture" : "Seuil d'alerte"}
                    </span>
                    <span className="font-bold text-xs text-rose-600 dark:text-rose-400 tabular-nums">
                      {art.stockDepot} {art.unite}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {art.designation}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {art.reference} • {art.categorie || "Sans catégorie"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Stock Minimum</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{art.stockMinimum} {art.unite}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Commande Suggérée</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{art.aCommander} {art.unite}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => openDrawer("article", art)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Fiche Matériel</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. VUE ONGLETS : ANALYSES FINANCIÈRES & CAPITAL           */}
      {/* ========================================================= */}
      {activeTab === "finance" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Bilan Financier & Valorisation Dépôt
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Répartition des capitaux investis entre le stock entreposé au dépôt et le matériel engagé sur vos chantiers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/[0.04]">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Valeur Dépôt</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {valeurTotaleDépôt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Matériel en rayonnage</p>
              </div>

              <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/[0.04]">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase">Valeur Chantiers</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {valeurTotaleChantiers.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Matériel sur le terrain</p>
              </div>

              <div className="p-4.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase">Actif Total</span>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1 tabular-nums">
                  {(valeurTotaleDépôt + valeurTotaleChantiers).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </p>
                <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1">Valeur totale des stocks</p>
              </div>
            </div>
          </div>

          {/* Graphiques */}
          <DashboardCharts sortiesData={sortiesData} pieData={pieData} topConsoData={topConsoData} />
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. SLIDE-OVER DRAWER (TIROIR COULISSANT LATÉRAL)          */}
      {/* ========================================================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop sombre */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Panneau coulissant */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-[#0c1017] border-l border-slate-200/80 dark:border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    {drawerContent?.type === "chantier" ? <Truck className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {drawerContent?.type === "chantier" ? "Fiche Chantier" : "Fiche Matériel"}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[240px]">
                      {drawerContent?.type === "chantier" ? drawerContent?.data.nom : drawerContent?.data.designation}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Fermer le tiroir"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {drawerContent?.type === "chantier" && (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111622] border border-slate-200/60 dark:border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Statut</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{drawerContent.data.statut}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Valeur Matériel Déployé</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                          {drawerContent.data.valeurSurSite.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Total Références</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{drawerContent.data.materielCount}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Matériel actuellement sur site
                      </h4>
                      <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {drawerContent.data.materielDetails?.map((item: any, idx: number) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{item.designation}</p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">{item.reference}</p>
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0 pl-2">
                              {item.quantite}x
                            </span>
                          </div>
                        ))}
                        {(!drawerContent.data.materielDetails || drawerContent.data.materielDetails.length === 0) && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">Aucun matériel n'est actuellement affecté à ce chantier.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {drawerContent?.type === "article" && (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111622] border border-slate-200/60 dark:border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Référence</span>
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{drawerContent.data.reference}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Stock en Dépôt</span>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{drawerContent.data.stockDepot} {drawerContent.data.unite}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Seuil de Sécurité</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{drawerContent.data.stockMinimum} {drawerContent.data.unite}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Prix Unitaire</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{drawerContent.data.prixUnitaire} €</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                        Conseil Réapprovisionnement
                      </p>
                      <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-1">
                        Quantité recommandée pour restaurer le stock tampon : <span className="font-bold">{drawerContent.data.aCommander} {drawerContent.data.unite}</span>.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02]">
                <Link
                  href={drawerContent?.type === "chantier" ? "/chantiers" : "/catalogue"}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-colors"
                >
                  <span>Ouvrir la fiche complète</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
