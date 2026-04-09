# Formation SST

Application web V1 de gestion de formation SST en presentiel.

## Installation

```bash
npm install
```

## Configuration

1. Copier `.env.example` vers `.env.local`
2. Renseigner les variables Supabase
3. Executer `supabase/schema.sql` dans Supabase
4. Optionnel : executer `supabase/seed.sql` pour charger des donnees de demonstration

## Commandes utiles

```bash
npm run dev
```

Lance le projet en developpement sur `http://localhost:3000`.

```bash
npm run lint
```

Execute le lint du projet.

```bash
npm run typecheck
```

Verifie les types TypeScript.

```bash
npm run test
```

Lance les tests Vitest. La commande passe meme s'il n'existe pas encore de tests.

```bash
npm run build
```

Construit la version de production.
