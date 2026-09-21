'use server'

import prisma from '@/lib/prisma'
import { ImapFlow } from 'imapflow'
import { revalidatePath } from 'next/cache'
import { simpleParser } from 'mailparser'
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai'
import { saveFactureAndCheckPrices } from './factures'

export async function getConfigMail() {
  try {
    const config = await prisma.configMail.findFirst()
    if (!config) {
      return {
        imapHost: process.env.IMAP_HOST || 'imap.gmail.com',
        imapPort: parseInt(process.env.IMAP_PORT || '993', 10),
        imapUser: process.env.IMAP_USER || '',
        imapPassword: process.env.IMAP_PASSWORD || '',
        nomBoite: 'Boîte Factures',
        derniereSynchro: null
      }
    }
    return config
  } catch (error) {
    console.error("Erreur getConfigMail:", error)
    return null
  }
}

export async function saveConfigMail(data: {
  imapHost: string
  imapPort: number
  imapUser: string
  imapPassword?: string
  nomBoite?: string
}) {
  try {
    const existing = await prisma.configMail.findFirst()
    
    if (existing) {
      const updated = await prisma.configMail.update({
        where: { id: existing.id },
        data: {
          imapHost: data.imapHost.trim(),
          imapPort: Number(data.imapPort) || 993,
          imapUser: data.imapUser.trim(),
          ...(data.imapPassword ? { imapPassword: data.imapPassword } : {}),
          nomBoite: data.nomBoite || 'Boîte Factures',
        }
      })
      revalidatePath('/fournisseurs')
      return { success: true, config: updated }
    } else {
      const created = await prisma.configMail.create({
        data: {
          id: 'default',
          imapHost: data.imapHost.trim(),
          imapPort: Number(data.imapPort) || 993,
          imapUser: data.imapUser.trim(),
          imapPassword: data.imapPassword || '',
          nomBoite: data.nomBoite || 'Boîte Factures',
        }
      })
      revalidatePath('/fournisseurs')
      return { success: true, config: created }
    }
  } catch (error: any) {
    console.error("Erreur saveConfigMail:", error)
    return { success: false, error: error?.message || "Erreur lors de la sauvegarde" }
  }
}

export async function testConfigMail(data: {
  imapHost: string
  imapPort: number
  imapUser: string
  imapPassword?: string
}) {
  try {
    // Si pas de mot de passe fourni, on va chercher celui enregistré en base
    let passwordToUse = data.imapPassword
    if (!passwordToUse) {
      const existing = await prisma.configMail.findFirst()
      passwordToUse = existing?.imapPassword || process.env.IMAP_PASSWORD || ''
    }

    if (!data.imapUser || !passwordToUse || !data.imapHost) {
      return { success: false, error: "Veuillez renseigner le serveur, l'adresse e-mail et le mot de passe." }
    }

    const client = new ImapFlow({
      host: data.imapHost.trim(),
      port: Number(data.imapPort) || 993,
      secure: true,
      auth: {
        user: data.imapUser.trim(),
        pass: passwordToUse
      },
      logger: false
    })

    await client.connect()
    const lock = await client.getMailboxLock('INBOX')
    let unreadCount = 0
    try {
      const status = await client.status('INBOX', { unseen: true, messages: true })
      unreadCount = status.unseen || 0
    } finally {
      lock.release()
      await client.logout()
    }

    return { 
      success: true, 
      message: `Connexion réussie ! Boîte accessible (${unreadCount} e-mail(s) non lu(s) disponible(s)).` 
    }
  } catch (error: any) {
    console.error("Erreur test IMAP:", error)
    let msg = error?.message || "Erreur de connexion inconnue"
    if (msg.includes("Invalid credentials") || msg.includes("Authentication failed")) {
      msg = "Identifiant ou mot de passe incorrect. Pour Gmail ou Outlook, pensez à utiliser un 'Mot de passe d'application'."
    }
    return { success: false, error: msg }
  }
}

export async function syncMailboxNow() {
  try {
    const config = await prisma.configMail.findFirst()
    
    const host = config?.imapHost || process.env.IMAP_HOST
    const port = config?.imapPort || parseInt(process.env.IMAP_PORT || '993', 10)
    const user = config?.imapUser || process.env.IMAP_USER
    const pass = config?.imapPassword || process.env.IMAP_PASSWORD

    if (!host || !user || !pass) {
      return { success: false, error: "Configuration e-mail non renseignée. Veuillez cliquer sur 'Paramètres E-mail'." }
    }

    const client = new ImapFlow({
      host: host.trim(),
      port: Number(port) || 993,
      secure: true,
      auth: {
        user: user.trim(),
        pass: pass
      },
      logger: false
    })

    await client.connect()
    const lock = await client.getMailboxLock('INBOX')
    let processedCount = 0
    const importedInvoices: string[] = []

    try {
      const messages = client.fetch({ seen: false }, { source: true, uid: true })

      for await (const message of messages) {
        try {
          if (!message.source) continue
          const parsedMail = await simpleParser(message.source as Buffer)
          const pdfAttachment = parsedMail.attachments?.find((att: any) => att.contentType === 'application/pdf')

          if (pdfAttachment && pdfAttachment.content) {
            const apiKey = process.env.GEMINI_API_KEY
            if (!apiKey) {
              console.warn("Clé GEMINI_API_KEY manquante pour la relève automatique.")
              continue
            }

            const base64Data = (pdfAttachment.content as Buffer).toString('base64')
            const genAI = new GoogleGenerativeAI(apiKey)
            
            const responseSchema: Schema = {
              type: SchemaType.OBJECT,
              properties: {
                fournisseur: { type: SchemaType.STRING },
                numeroFacture: { type: SchemaType.STRING },
                dateFacture: { type: SchemaType.STRING },
                totalHT: { type: SchemaType.NUMBER },
                totalTVA: { type: SchemaType.NUMBER },
                totalTTC: { type: SchemaType.NUMBER },
                dateEcheance: { type: SchemaType.STRING },
                modePaiement: { type: SchemaType.STRING },
                lignes: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      reference: { type: SchemaType.STRING },
                      designation: { type: SchemaType.STRING },
                      quantite: { type: SchemaType.NUMBER },
                      prixUnitaire: { type: SchemaType.NUMBER },
                      chantier: { type: SchemaType.STRING },
                    },
                    required: ['reference', 'designation', 'quantite', 'prixUnitaire'],
                  }
                }
              },
              required: ['fournisseur', 'numeroFacture', 'lignes'],
            }

            const model = genAI.getGenerativeModel({
              model: "gemini-3.6-flash",
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
              }
            })

            const prompt = `Tu es un assistant expert en facturation de matériel électrique pour artisans (Rexel, Sonepar, YESSS, etc.).
Extrais les totaux financiers, le nom du fournisseur, le numéro de facture, l'échéance, la date d'émission ou date de livraison (au format JJ/MM/AAAA ou AAAA-MM-JJ) et toutes les lignes avec références, désignations, quantités, prix unitaires nets et chantiers imputés.`

            const result = await model.generateContent([
              {
                inlineData: {
                  data: base64Data,
                  mimeType: "application/pdf"
                }
              },
              prompt
            ])

            const parsed = JSON.parse(result.response.text())
            if (parsed.fournisseur && parsed.numeroFacture && Array.isArray(parsed.lignes) && parsed.lignes.length > 0) {
              const fournisseur = parsed.fournisseur.trim()
              const numeroFacture = parsed.numeroFacture.trim()

              // Anti-doublon
              const existing = await prisma.factureFournisseur.findFirst({
                where: { fournisseur, numeroFacture }
              })

              if (!existing) {
                const items = parsed.lignes.map((l: any) => ({
                  ...l,
                  originalReference: l.reference,
                  chantier: l.chantier || 'STOCK',
                  id: Math.random().toString(36).substring(7)
                }))

                await saveFactureAndCheckPrices(fournisseur, numeroFacture, items, {
                  totalHT: parsed.totalHT || null,
                  totalTVA: parsed.totalTVA || null,
                  totalTTC: parsed.totalTTC || null,
                  dateEcheance: parsed.dateEcheance || null,
                  modePaiement: parsed.modePaiement || null,
                  dateFacture: parsed.dateFacture || null
                })

                importedInvoices.push(`${fournisseur} (${numeroFacture})`)
                processedCount++
              }
            }
          }

          // Marquer comme lu
          await client.messageFlagsAdd({ uid: message.uid }, ['\\Seen'], { uid: true })
        } catch (msgErr) {
          console.error("Erreur sur message UID:", msgErr)
        }
      }
    } finally {
      lock.release()
      await client.logout()
    }

    // Mise à jour de la date de dernière synchro
    if (config) {
      await prisma.configMail.update({
        where: { id: config.id },
        data: { derniereSynchro: new Date() }
      })
    }

    revalidatePath('/fournisseurs')

    return { 
      success: true, 
      processed: processedCount,
      importedInvoices,
      message: processedCount > 0 
        ? `${processedCount} nouvelle(s) facture(s) importée(s) et contrôlée(s) avec succès !`
        : "Aucune nouvelle facture PDF trouvée dans les e-mails non lus."
    }
  } catch (error: any) {
    console.error("Erreur syncMailboxNow:", error)
    return { success: false, error: error?.message || "Erreur de relève de boîte mail" }
  }
}
