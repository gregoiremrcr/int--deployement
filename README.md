# Pokémon Wishlist

![CI/CD](https://github.com/gregoiremrcr/int--deployement/actions/workflows/ci.yml/badge.svg?branch=main)
[![Coverage](https://codecov.io/gh/gregoiremrcr/int--deployement/branch/main/graph/badge.svg)](https://codecov.io/gh/gregoiremrcr/int--deployement)

Application Nuxt avec des pages Pokémon rendues côté serveur, API Hono sur AWS Lambda/API Gateway et persistance Supabase.

## Développement et validations

```bash
npm ci
npm run dev
```

Commandes utiles:

```bash
npm run lint
npm run typecheck
npm run typecheck:backend
npm test
npm run test:integration
npm run test:coverage
npm run test:e2e
npm run build
npm run ci
```

Les tests d’intégration locaux ne s’exécutent que si `SUPABASE_TEST_URL` et `SUPABASE_TEST_PUBLISHABLE_KEY` sont définies. Dans GitHub, le workflow lit les secrets `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` de l’environnement `integration-tests`, puis les transmet aux tests sous ces noms internes. Utiliser exclusivement un projet Supabase de test. Les tests E2E utilisent le stockage mémoire (`WISHLIST_STORAGE=memory`) et ne modifient pas Supabase.

Le rapport de couverture Vitest est écrit dans `coverage/`. La CI le publie comme artefact GitHub et ajoute les pourcentages au résumé du workflow. Le badge Codecov est facultatif: activer `CODECOV_ENABLED=true` et définir `CODECOV_TOKEN` après avoir créé le projet Codecov.

## Variables et secrets

`.env.example` contient uniquement les variables nécessaires à l’application locale. `.env.test.example` documente les variables d’intégration et de migration; il ne contient que des valeurs fictives.

| Usage                           | Noms                                                                          | Emplacement                                                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Frontend local                  | `NUXT_PUBLIC_API_BASE_URL`                                                    | `.env` local; URL racine de Hono                                                                                              |
| API locale                      | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ALLOWED_ORIGIN`                         | `.env` local; URL et clé publishable/anon, jamais `service_role`                                                              |
| Vercel                          | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`                          | Secrets de l’environnement GitHub `production`                                                                                |
| Frontend en production          | `NUXT_PUBLIC_API_BASE_URL`                                                    | Variable Production des paramètres du projet Vercel; le workflow la transmet aussi depuis la sortie SAM                       |
| AWS                             | `AWS_ROLE_ARN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`    | Secrets de l’environnement GitHub `production`; rôle AWS fédéré par OIDC et connexion Postgres uniquement pour les migrations |
| Configuration AWS non secrète   | `AWS_REGION`, `AWS_SAM_STACK_NAME`, `ALLOWED_ORIGIN`, `VERCEL_PRODUCTION_URL` | Variables de l’environnement GitHub `production`                                                                              |
| Tests Supabase                  | Secrets GitHub `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; variables locales `SUPABASE_TEST_URL`, `SUPABASE_TEST_PUBLISHABLE_KEY` | Projet de test dédié dans l’environnement GitHub `integration-tests`; le workflow les transmet sous les noms `SUPABASE_TEST_*` aux tests |
| Badge de couverture (optionnel) | `CODECOV_TOKEN`, `CODECOV_ENABLED=true`                                       | Secret et variable GitHub Actions; activer après création du projet Codecov                                                   |

Créer l’environnement GitHub `production` et autoriser le rôle AWS à faire confiance au fournisseur OIDC GitHub pour ce dépôt et la branche `main`. Le domaine Vercel et `ALLOWED_ORIGIN` doivent être des origines HTTPS sans chemin ni slash final. Le workflow n’utilise aucun secret pour les pull requests.

Pour une exécution SAM manuelle, copier `samconfig.toml.example` vers `samconfig.toml` puis renseigner les paramètres localement. `samconfig.toml` est ignoré par Git. La CI passe les paramètres SAM sans les enregistrer dans le dépôt.

## Supabase et migrations

`supabase/init.sql` initialise la wishlist et ses politiques RLS. Les migrations versionnées sont appliquées par `npm run db:migrate`; le runner prend un verrou PostgreSQL, applique chaque fichier dans une transaction et enregistre les versions dans `public.schema_migrations`.

Le workflow de production exécute les migrations en attente avant la mise à jour de Lambda. Les migrations doivent rester compatibles avec la version applicative précédente pendant le déploiement. Le runner ne propose pas de migrations descendantes automatiques: corriger une migration déjà appliquée avec une nouvelle migration vers l’avant.

## Déploiement et smoke tests

Un push validé sur `main` déploie d’abord les migrations et l’API avec SAM, vérifie `GET /health`, puis construit et déploie Nuxt sur Vercel. Après le déploiement frontend, la CI vérifie l’API, la lecture de `/wishlist`, la page d’accueil SSR et `/pokemon/pikachu`.

Ces vérifications distantes ne sont exécutées que par le workflow de déploiement; elles n’ont pas été lancées pendant cet audit. Pour tester une API ou une production manuellement sans écrire de données:

```bash
API_BASE_URL=https://api.example.com npm run smoke:api
API_BASE_URL=https://api.example.com FRONTEND_BASE_URL=https://app.example.com npm run smoke:production
```

Sous PowerShell, définir les mêmes variables avec `$env:API_BASE_URL` et `$env:FRONTEND_BASE_URL` avant `npm.cmd run smoke:production`.

## SSR, SSG et retour arrière

Le projet conserve le rendu SSR Nuxt pour les pages dynamiques `/pokemon/:name`. Les routes ne sont plus énumérées à partir de PokeAPI pendant le build: celui-ci ne contacte pas PokeAPI, et une fiche est rendue à la demande. Le pré-rendu SSG est une option alternative du cours; il n’est pas retenu car il demanderait une liste locale/versionnée des Pokémon ou un appel réseau contrôlé.

Pour restaurer une version frontend stable, utiliser la fonction de rollback du projet dans Vercel. Pour l’API, rétablir le code stable par un revert Git sur `main`, ce qui déclenche une nouvelle livraison SAM. Les changements de schéma Supabase se réparent par une migration compensatoire; ne pas restaurer une ancienne version d’application si elle n’est pas compatible avec le schéma courant.

La procédure détaillée, l’état des exercices et les éléments de configuration manuelle figurent dans [docs/CI-CD-EXERCICES.md](docs/CI-CD-EXERCICES.md).
