"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Send,
} from "lucide-react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendWebNotification,
} from "@/lib/web-notifications";
import { toast } from "sonner";

export function NotificationSettingsCard() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    setLoading(false);

    if (granted) {
      toast.success("Notifications activées avec succès !");
      sendWebNotification("🎉 Notifications StockElec Actives", {
        body: "Vous recevrez désormais les alertes de chantier, outillage et réassort.",
      });
    } else {
      toast.error(
        "Autorisation refusée ou fermée. Vous pouvez l'autoriser dans les paramètres de votre navigateur.",
      );
    }
  };

  const handleTest = () => {
    if (permission !== "granted") {
      toast.error("Veuillez d'abord autoriser les notifications.");
      return;
    }

    sendWebNotification("⚡ Test Notification StockElec", {
      body: "Le système de notifications PWA Quentin Électricité fonctionne parfaitement !",
      tag: "test-notification",
    });
    toast.success("Notification de test envoyée !");
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111622] shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              permission === "granted"
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-white/10"
            }`}
          >
            {permission === "granted" ? (
              <BellRing className="w-5 h-5" />
            ) : (
              <BellOff className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Notifications Web & Mobile PWA
              </h3>
              {permission === "granted" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Activé
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> Non actif
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Recevez les confirmations de départ chantier, rappels d'outillage
              et alertes de stock directement sur votre écran.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {permission !== "granted" ? (
            <button
              type="button"
              onClick={handleEnable}
              disabled={loading || !supported}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {loading ? "Autorisation..." : "Activer les notifications"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-blue-500" />
              <span>Tester une notification</span>
            </button>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-slate-100 dark:border-white/[0.04]">
        💡{" "}
        <strong className="text-slate-600 dark:text-slate-300">
          Sur iPhone (iOS 16.4+) :
        </strong>{" "}
        Pour activer les notifications push sur iPhone, ouvrez Safari, appuyez
        sur le bouton Partager puis choisissez{" "}
        <span className="underline font-semibold">
          « Sur l'écran d'accueil »
        </span>
        .
      </div>
    </div>
  );
}
