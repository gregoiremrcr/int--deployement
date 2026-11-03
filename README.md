# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Migrations SQL

Initialiser d'abord la base avec `supabase/init.sql`, puis appliquer les migrations versionnées :

```bash
npm run db:migrate
```

Le runner utilise `DATABASE_URL` ou `SUPABASE_DB_URL`. Il crée automatiquement la table `public.schema_migrations`, applique les fichiers de `supabase/migrations` dans l'ordre, et ignore ceux déjà enregistrés.

La connexion PostgreSQL directe est réservée au runner et ne doit jamais être exposée au frontend. La clé Supabase `anon`/publishable ne permet pas d'exécuter ces migrations.
