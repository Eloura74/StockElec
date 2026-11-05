# Workflow de développement sécurisé

Objectif : modifier et tester l'application **sans jamais toucher** à la production (Vercel + base Prisma Postgres du client), puis publier en un geste.

## Principe

| Environnement | Branche Git | Base de données | Qui l'utilise |
|---|---|---|---|
| **Production** | `main` | Base actuelle du client | Le client |
| **Preview** (test en ligne) | `dev` ou toute branche ≠ `main` | Base de TEST dédiée | Toi / démo au client |
| **Local** | `dev` | PostgreSQL Docker local | Toi |

Règle d'or : **seule la branche `main` déclenche un déploiement production sur Vercel.** Tout le reste produit une URL de preview.

## 1. Développer en local (aucun risque pour la prod)

```powershell
cd app
copy .env.example .env      # une seule fois (DATABASE_URL locale)
npm install
npm run db:up               # démarre PostgreSQL local (Docker Desktop requis)
npm run db:push             # crée les tables dans la base locale
npm run dev                 # http://localhost:3000
```

Connexion sur une base vide : le compte gérant est créé automatiquement au premier login (voir `initAdmin` dans `src/app/actions/auth.ts`).

> `app/.env` ne doit **jamais** contenir l'URL de production. Le code n'a plus aucune URL en dur : sans `DATABASE_URL`, l'application refuse de démarrer au lieu de se connecter à la prod.

Avant de commiter : `npm run lint` et `npm run build`.

## 2. Tester en ligne (preview Vercel)

```powershell
git checkout dev
git add -A; git commit -m "feat: ..."
git push origin dev
```

Vercel génère automatiquement une URL de preview pour `dev`. **Prérequis (une seule fois, dans le dashboard Vercel)** :

1. Créer une base de TEST distincte (Vercel → Storage → Prisma Postgres, ou Neon gratuit).
2. Project `stock-elec` → Settings → Environment Variables : définir `DATABASE_URL` = base de TEST **uniquement pour l'environnement « Preview »**.
3. Vérifier que la `DATABASE_URL` de la base client est cochée **« Production » uniquement** (pas Preview, pas Development).
4. Appliquer le schéma sur la base de test : `DATABASE_URL="<url test>"; npx prisma db push`.

## 3. Publier chez le client (remplacer l'existant)

Checklist :

1. `npm run lint` et `npm run build` OK en local.
2. Preview `dev` testée en ligne.
3. **Sauvegarde de la prod** : `DATABASE_URL="<url prod>"; npm run backup` (fichier JSON dans `app/backups/`, ignoré par Git).
4. **Si le schéma Prisma a changé** : appliquer manuellement sur la prod *avant* la fusion (`npx prisma db push` avec l'URL prod). Le build Vercel n'applique plus le schéma automatiquement (sécurité).
5. Fusion :
   ```powershell
   git checkout main
   git pull
   git merge --no-ff dev
   git push origin main        # → déploiement production automatique
   ```
6. Vérifier le site de production (login, dashboard).

### Retour arrière immédiat

Vercel → Deployments → ancien déploiement stable → **Promote to Production** (instantané, sans toucher au code). Pour le code : `git revert -m 1 <commit de merge>` puis push.

> Attention : un rollback Vercel ne restaure **pas** la base. Toute modification de schéma doit donc être **rétrocompatible** (ajout de colonnes/tables optionnelles, pas de suppression/renommage en une seule fois).

## Scripts de maintenance (`app/scripts/`)

Ils lisent `DATABASE_URL` (obligatoire). Les scripts destructifs (`reset-articles`, `clean-factures-and-prices`, `import-articles-clean`) **refusent** de tourner sur une base distante sauf `CONFIRM_REMOTE_DB=oui`.


### Variante sans Docker : serveur Postgres local Prisma

Si Docker Desktop n'est pas disponible : `npx prisma dev --name stockelec-dev` démarre un Postgres local et affiche une `DATABASE_URL`. Ce serveur n'accepte qu'une seule session : ajouter **`&pgbouncer=true&connection_limit=1`** à l'URL, sinon les requêtes échouent avec l'erreur `prepared statement "s0" already exists`. Cette contrainte ne concerne pas le Postgres Docker.
