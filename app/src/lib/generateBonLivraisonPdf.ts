import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface LigneBonLivraison {
  reference: string;
  designation: string;
  quantite: number;
  unite?: string | null;
  categorie?: string | null;
}

export interface BonLivraisonData {
  numeroBL?: string;
  date?: Date | string;
  chantierNom: string;
  chantierAdresse?: string | null;
  utilisateur?: string | null;
  observation?: string | null;
  lignes: LigneBonLivraison[];
}

export function buildBonLivraisonPdf(data: BonLivraisonData) {
  const doc = new jsPDF("portrait", "mm", "a4");
  const now = data.date ? new Date(data.date) : new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const heureStr = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const numero =
    data.numeroBL ||
    `BL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;

  // En-tête de marque
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("QUENTIN ÉLECTRICITÉ", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text("Gestion & Suivi du Stock Chantier", 14, 18);
  doc.text("Installation Électrique • Dépannage • Rénovation", 14, 23);

  // Titre du Document
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("BON DE SORTIE CHANTIER", 196, 13, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text(`N° ${numero}`, 196, 19, { align: "right" });
  doc.text(`${dateStr} à ${heureStr}`, 196, 24, { align: "right" });

  // Bloc Chantier & Équipe (2 colonnes)
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 34, 88, 30, 2, 2, "FD");
  doc.roundedRect(108, 34, 88, 30, 2, 2, "FD");

  // Colonne Chantier
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("CHANTIER DESTINATAIRE", 18, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.chantierNom || "Chantier Général", 18, 47);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const adresseTexte = data.chantierAdresse || "Adresse sur site";
  doc.text(doc.splitTextToSize(adresseTexte, 80), 18, 54);

  // Colonne Collaborateur & Véhicule
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("AFFECTATION & ÉQUIPE", 112, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.utilisateur || "Chef d'Équipe", 112, 47);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Départ Véhicule Camion", 112, 54);
  if (data.observation) {
    doc.text(`Note : ${data.observation.slice(0, 45)}`, 112, 60);
  }

  // Tableau du Matériel
  const totalPieces = data.lignes.reduce(
    (sum, l) => sum + (Number(l.quantite) || 0),
    0,
  );
  const tableData = data.lignes.map((l) => [
    l.reference || "-",
    l.designation || "-",
    l.categorie || "Matériel",
    `${l.quantite} ${l.unite || "u"}`,
  ]);

  autoTable(doc, {
    startY: 70,
    head: [["Référence", "Désignation Matériel", "Famille", "Quantité"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 3.5,
    },
    styles: {
      fontSize: 9,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 32 },
      3: { cellWidth: 26, halign: "center", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  // Récapitulatif Total
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, finalY + 4, 182, 10, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Total : ${data.lignes.length} référence(s) distincte(s)`,
    18,
    finalY + 10.5,
  );
  doc.text(
    `Quantité totale embarquée : ${totalPieces} pièce(s)`,
    192,
    finalY + 10.5,
    {
      align: "right",
    },
  );

  // Signatures
  const signY = Math.min(finalY + 22, 245);
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);

  doc.roundedRect(14, signY, 88, 30, 2, 2, "D");
  doc.roundedRect(108, signY, 88, 30, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("VISA / SIGNATURE CHEF D'ÉQUIPE :", 18, signY + 6);
  doc.text("SIGNATURE RÉCEPTION CHANTIER :", 112, signY + 6);

  // Pied de page
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Document édité via StockElec Quentin Électricité • Traçabilité certifiée du stock et des chantiers",
    105,
    288,
    { align: "center" },
  );

  const filename = `${numero}_${data.chantierNom
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 20)}.pdf`;

  return {
    doc,
    filename,
    save: () => doc.save(filename),
    getBlob: () => doc.output("blob"),
    getDataUri: () => doc.output("datauristring"),
  };
}

/**
 * Partage natif via Web Share API avec fichier PDF attaché (supporté sur smartphones récents),
 * avec fallback universel WhatsApp texte.
 */
export async function partagerBonLivraison(data: BonLivraisonData) {
  const { filename, getBlob } = buildBonLivraisonPdf(data);
  const totalPieces = data.lignes.reduce(
    (sum, l) => sum + (Number(l.quantite) || 0),
    0,
  );

  const textResume =
    `📄 *BON DE SORTIE CHANTIER - QUENTIN ÉLECTRICITÉ*\n` +
    `🏗️ *Chantier :* ${data.chantierNom}\n` +
    `👤 *Équipe :* ${data.utilisateur || "Électricien"}\n` +
    `📦 *Matériel :* ${data.lignes.length} référence(s) (${totalPieces} pièces)\n` +
    `📅 *Date :* ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}\n` +
    (data.observation ? `📝 *Note :* ${data.observation}\n` : "");

  // Essai Web Share API avec le fichier PDF
  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare
  ) {
    try {
      const blob = getBlob();
      const file = new File([blob], filename, { type: "application/pdf" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Bon de Sortie - ${data.chantierNom}`,
          text: textResume,
          files: [file],
        });
        return { shared: true, method: "native-file" };
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.warn("Échec partage fichier, fallback texte WhatsApp:", e);
      } else {
        return { shared: false, method: "aborted" };
      }
    }
  }

  // Fallback 1: Web Share avec texte
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: `Bon de Sortie - ${data.chantierNom}`,
        text: textResume,
      });
      return { shared: true, method: "native-text" };
    } catch (e: any) {
      if (e.name === "AbortError") return { shared: false, method: "aborted" };
    }
  }

  // Fallback 2: Ouverture WhatsApp Web / App
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(textResume)}`;
  window.open(whatsappUrl, "_blank");
  return { shared: true, method: "whatsapp-web" };
}
