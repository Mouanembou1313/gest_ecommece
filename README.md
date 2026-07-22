# Premium Affiliate Shop

MVP d'un site e-commerce moderne et premium pour vendre par affiliation. Le site presente des categories, des produits, une fiche detaillee, puis redirige l'utilisateur vers le site partenaire via un lien d'affiliation.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de donnees: MongoDB + Mongoose

## Installation

```bash
npm install
cp backend/.env.example backend/.env
npm run seed
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000/api`

## Configuration

Dans `backend/.env`, configure:

```bash
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/premium_affiliate_shop
CLIENT_URL=http://localhost:5173
```

Les liens d'affiliation sont stockes dans chaque produit avec le champ `affiliateUrl`.

## Fonctionnement affiliation

Sur la fiche produit, le bouton principal ouvre:

`/api/products/:slug/redirect`

Le backend peut ainsi incrementer `clicks` avant de rediriger vers `affiliateUrl`.

## Page admin

L'interface contient un onglet `Admin` dans la barre de navigation. Elle permet d'ajouter, modifier et supprimer les produits sans toucher au code.

Champs principaux:

- `Nom du produit`
- `Slug`
- `Marque`
- `Categorie`
- `Prix`
- `Note`
- `Image URL`
- `Lien d'affiliation`
- `Description`
- `Mettre en avant`

Important: cette page admin est prevue pour le developpement local. Avant une mise en ligne, ajoute une authentification pour proteger la gestion des produits.

## Idees de look

La boutique contient aussi:

- un bloc `Look de la semaine` sur la page boutique;
- une page publique `Idees de look`;
- un onglet admin `Idees de look` pour ajouter, modifier et supprimer des looks.

Pour utiliser une image locale generee par IA, place-la dans `frontend/public/images`, puis utilise un chemin du type:

```text
/images/nom-de-ton-image.png
```

Chaque look peut contenir plusieurs pieces individuelles avec leur image et, si besoin, leur lien d'affiliation.

La page publique `Idees de look` fonctionne maintenant comme une galerie premium:

- compteur de vues;
- bouton like;
- commentaires;
- pieces individuelles achetables par lien d'affiliation.

Pistes de monetisation futures: affiliation sur chaque piece, looks sponsorises, placement de marque, newsletter premium ou guide PDF payant.
