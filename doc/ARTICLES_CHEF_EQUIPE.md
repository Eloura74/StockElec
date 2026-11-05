# Onglet « Articles » pour les chefs d'équipe

## Ce qui change

Dans l'interface chef d'équipe (`/depart-matin`), un 5ᵉ onglet **Articles** s'ajoute à Départ / Retour / Outils / Stock.
Il permet, depuis un téléphone ou une tablette :

- **Scanner** un code-barres : article trouvé → fiche d'édition ; code inconnu → formulaire de création pré-rempli avec le code.
- **Créer** un article (désignation, référence — auto si vide —, code-barres avec bouton scan, fournisseur, réf. fournisseur, catégorie, unité, seuil d'alerte, quantité par lot, stock de départ).
- **Modifier** les informations d'un article et **ajuster le stock** (stock réel compté).
- **Rechercher** (plusieurs mots, sur nom / référence / code-barres / fournisseur) et filtrer le **stock bas**.

## Règles de sécurité / droits

| Action | Chef d'équipe | Gérant |
|---|---|---|
| Créer un article | oui | oui |
| Modifier les infos (hors prix) | oui | oui |
| Ajuster le stock | oui (mouvement de correction tracé au nom du chef) | oui |
| Prix unitaire | non (non transmis à l'interface, jamais modifié) | oui |
| Supprimer un article | non | oui |

- Doublons refusés : référence ou code-barres déjà utilisé → message explicite.
- Chaque création de stock / ajustement crée un mouvement `Correction_Plus` / `Correction_Moins` (visible dans « Mouvements »).
- Les actions serveur historiques (`createArticle`, `updateArticle`, `deleteArticle`, …) vérifient désormais la session ; `deleteArticle` est réservé au gérant. Avant, elles étaient appelables sans contrôle côté serveur.

## Fichiers

- `src/app/actions/chef-articles.ts` : actions serveur (création, modification en liste blanche de champs, ajustement de stock).
- `src/components/ArticlesChefPanel.tsx` : interface mobile-first (liste, fiche en « bottom sheet » sur téléphone, modale centrée sur tablette).
- `src/app/depart-matin/DepartMatinClient.tsx` : nouvel onglet.
- `src/app/depart-matin/page.tsx` : le stock affiché utilise désormais la même règle de calcul que le catalogue (`calculerStocksDepuisAgregats`) et la requête est agrégée (plus de chargement de tous les mouvements).
- `src/components/BarcodeScanner.tsx` : formats supportés étendus (EAN-8, UPC-A, Code 39 en plus de EAN-13, Code 128, QR).

## Tester en local

```powershell
cd app
npm run db:up      # ou une base Postgres locale
npm run db:push
npm run dev
```

Créer un utilisateur « Chef d'équipe » depuis l'interface gérant (page Équipe), se connecter avec ce compte sur mobile ou en mode responsive du navigateur, onglet **Articles**.

> Le scan caméra exige HTTPS (ou `localhost`) et l'autorisation caméra du navigateur. Sur Vercel (HTTPS) c'est automatique.

## Limites connues

- Le scan caméra n'a pas pu être testé avec un vrai code-barres (test automatisé en navigateur sans caméra) : à valider sur un téléphone via l'URL de preview.
- Une modification + ajustement de stock = deux appels serveur : si le second échoue, les infos sont enregistrées et un message l'indique.

