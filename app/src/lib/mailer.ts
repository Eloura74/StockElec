'use server'

import nodemailer from 'nodemailer'

/**
 * Crée un transporteur SMTP pour l'envoi d'emails.
 * Utilise les variables d'environnement SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD.
 * Si les variables ne sont pas configurées, retourne null.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // SSL si port 465, STARTTLS sinon
    auth: { user, pass },
  })
}

/**
 * Envoie un email de réinitialisation de mot de passe.
 * @param to - Adresse email du destinataire
 * @param resetLink - Lien complet avec le token
 * @returns true si envoyé, false sinon
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
  const transporter = createTransporter()
  if (!transporter) {
    console.error('[Mailer] Configuration SMTP manquante (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)')
    return false
  }

  try {
    await transporter.sendMail({
      from: `"StockPro - Quentin Elec" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe — StockPro',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background-color: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background-color: #2563eb; border-radius: 12px; transform: rotate(3deg);">
              <span style="color: white; font-size: 20px; font-weight: 900; transform: rotate(-3deg);">QE</span>
            </div>
          </div>
          <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 16px;">
            Réinitialisation du mot de passe
          </h2>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
            Vous avez demandé à réinitialiser votre mot de passe StockPro. Cliquez sur le bouton ci-dessous pour en définir un nouveau.
          </p>
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${resetLink}" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: white; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 8px;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
            Ce lien est valable <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #cbd5e1; font-size: 11px; text-align: center;">
            StockPro — Gestion de stocks Quentin Elec
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('[Mailer] Erreur envoi email :', error)
    return false
  }
}
