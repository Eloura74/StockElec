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

export function sendWebNotification(
  title: string,
  options: WebNotificationOptions = {},
): boolean {
  if (!isNotificationSupported()) return false;

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    const n = new Notification(title, {
      body: options.body || "Notification StockElec",
      icon: options.icon || "/favicon.ico",
      tag: options.tag || "stockelec-general",
      ...options,
    });

    // Fermeture automatique après 6 secondes si non cliquée
    setTimeout(() => {
      try {
        n.close();
      } catch {
        // ignore
      }
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
export function notifierDepartValide(
  chantierNom: string,
  nbArticles: number,
  nbPieces: number,
) {
  sendWebNotification("🚚 Départ Chantier Validé", {
    body: `${chantierNom} : ${nbArticles} référence(s) (${nbPieces} pièces) embarquées.`,
    tag: "depart-chantier",
  });
}

/**
 * Notifie un emprunt ou retour d'outillage
 */
export function notifierMouvementOutillage(
  nomMachine: string,
  type: "Emprunt" | "Retour",
  utilisateur: string,
) {
  sendWebNotification(
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
export function notifierAlerteStock(
  designation: string,
  stockRestant: number,
  unite: string = "u",
) {
  sendWebNotification("⚠️ Alerte Stock Minimum", {
    body: `Attention : « ${designation} » est à ${stockRestant} ${unite} en dépôt.`,
    tag: `stock-${designation.slice(0, 10)}`,
  });
}
