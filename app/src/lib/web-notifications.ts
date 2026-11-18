/**
 * Gestionnaire de notifications Web / PWA multiplateforme (PC, Mac, Android, iPhone iOS 16.4+)
 */

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission():
  | NotificationPermission
  | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (e) {
    console.warn("Erreur demande permission notification:", e);
    return false;
  }
}

export interface WebNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

/**
 * Envoie une notification système compatible :
 * - iOS Safari 16.4+ (PWA écran d'accueil via registration.showNotification)
 * - Android Chrome PWA
 * - Navigateurs desktop (Mac / Windows / Linux)
 */
export async function sendWebNotification(
  title: string,
  options: WebNotificationOptions = {},
): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  if (Notification.permission !== "granted") {
    return false;
  }

  const notifOptions: NotificationOptions = {
    body: options.body || "Notification StockElec",
    icon: options.icon || "/icon-192x192.png",
    badge: options.badge || "/icon-192x192.png",
    tag: options.tag || "stockelec-general",
    data: options.data,
  };

  // 1. Privilégier le Service Worker (obligatoire pour iOS PWA et recommandé sur mobile)
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === "function") {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    } catch (swErr) {
      console.warn("Échec notification Service Worker, tentative repli classique:", swErr);
    }
  }

  // 2. Repli constructeur Notification direct (Desktop classique)
  try {
    const n = new Notification(title, notifOptions);

    // Fermeture automatique après 6 secondes si non cliquée
    setTimeout(() => {
      try {
        n.close();
      } catch {}
    }, 6000);

    return true;
  } catch (e) {
    console.warn("Erreur envoi notification locale:", e);
    return false;
  }
}

/**
 * Notifie un départ chantier validé avec succès
 */
export async function notifierDepartValide(
  chantierNom: string,
  nbArticles: number,
  nbPieces: number,
) {
  return sendWebNotification("🚚 Départ Chantier Validé", {
    body: `${chantierNom} : ${nbArticles} référence(s) (${nbPieces} pièces) embarquées.`,
    tag: "depart-chantier",
  });
}

/**
 * Notifie un emprunt ou retour d'outillage
 */
export async function notifierMouvementOutillage(
  nomMachine: string,
  type: "Emprunt" | "Retour",
  utilisateur: string,
) {
  return sendWebNotification(
    type === "Emprunt" ? "🔧 Machine Empruntée" : "✅ Machine Restituée",
    {
      body: `${nomMachine} par ${utilisateur}.`,
      tag: "outillage-mouvement",
    },
  );
}

/**
 * Notifie une alerte de stock critique
 */
export async function notifierAlerteStock(
  designation: string,
  stockRestant: number,
  unite: string = "u",
) {
  return sendWebNotification("⚠️ Alerte Stock Minimum", {
    body: `Attention : « ${designation} » est à ${stockRestant} ${unite} en dépôt.`,
    tag: `stock-${designation.slice(0, 10)}`,
  });
}
