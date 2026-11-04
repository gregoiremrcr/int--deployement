# Exercices CI/CD — audit Pokémon Wishlist

Ce relevé distingue les exercices du support de cours des choix d’architecture demandés pour ce dépôt. Il ne lance aucun déploiement et ne vérifie aucun service distant.

## Checklist

| Exercice / sujet du support                               | État constaté ou final                                                                                                                         | Fichiers et commandes                                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Pipeline CI, lint, vérifications de types, tests et build | Déjà présent, complété avec couverture, migrations et validation SAM                                                                           | `.github/workflows/ci.yml`, `package.json`, `npm run ci`                                           |
| Tests unitaires et API                                    | Déjà présents; exécutés par `npm test` dans la CI                                                                                              | `tests/`, `npm test`                                                                               |
| Tests Playwright de parcours complet                      | Déjà présents; l’API E2E utilise maintenant le stockage mémoire                                                                                | `e2e/`, `playwright.config.ts`, `backend/app.ts`, `npm run test:e2e`                               |
| Tests d’intégration Supabase                              | À exécuter avec un projet de test dédié; la CI les lance sans injecter les secrets aux PR; le nettoyage est limité aux identifiants de fixture | `tests/integration/supabase.test.ts`, secrets GitHub `SUPABASE_TEST_*`, `npm run test:integration` |
| Persistance Supabase et RLS                               | Déjà présente; la base cible doit être contrôlée par le propriétaire du compte                                                                 | `supabase/init.sql`, `backend/app.ts`                                                              |
| Migrations transactionnelles et idempotentes              | Déjà présentes; le workflow de production les applique avant Lambda                                                                            | `supabase/migrations/`, `scripts/migrate.mjs`, `DATABASE_URL`, `npm run db:migrate`                |
| Déploiement API AWS SAM                                   | Préparé dans le workflow; nécessite rôle OIDC et secrets de l’environnement GitHub `production`                                                | `template.yaml`, `.github/workflows/ci.yml`, `samconfig.toml.example`                              |
| Déploiement frontend Vercel                               | Déjà présent, complété pour attendre l’API et recevoir son URL                                                                                 | `.github/workflows/ci.yml`, variables/secrets Vercel dans GitHub et Vercel                         |
| Smoke tests après déploiement                             | Préparés pour health API, lecture wishlist, accueil SSR et fiche Pokémon                                                                       | `scripts/smoke.mjs`, `npm run smoke:api`, `npm run smoke:production`                               |
| SSR et SSG                                                | SSR choisi pour les fiches dynamiques; SSG recensé comme option, sans pré-rendu de 2 000 pages                                                 | `nuxt.config.ts`, `app/pages/pokemon/[name].vue`, README                                           |
| Retour arrière                                            | Procédure documentée: rollback Vercel, revert Git pour AWS, migration compensatoire pour Supabase                                              | README, `scripts/migrate.mjs`, historique Git                                                      |
| Couverture Vitest dans GitHub                             | Préparée; rapport JSON/LCOV et texte, artefact CI, tableau du résumé et publication/badge Codecov facultatifs                                  | `package.json`, `.github/workflows/ci.yml`, README                                                 |
| S3/CloudFront et publication Nuxt statique                | Hors périmètre: variante alternative du support, incompatible avec le déploiement Vercel + SSR retenu                                          | Slides d’exemple S3/CloudFront du PDF                                                              |

## Variables par environnement

### Vercel

Dans le projet Vercel, définir `NUXT_PUBLIC_API_BASE_URL` avec l’URL racine API Gateway en environnement Production. Dans les secrets de l’environnement GitHub `production`, configurer `VERCEL_TOKEN`, `VERCEL_ORG_ID` et `VERCEL_PROJECT_ID`. Définir la variable GitHub `VERCEL_PRODUCTION_URL` avec le domaine HTTPS public pour le smoke test.

### AWS SAM et Supabase de production

Dans les secrets GitHub `production`, définir `AWS_ROLE_ARN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` et `DATABASE_URL`. Le dernier est une connexion PostgreSQL directe utilisée uniquement par le runner de migrations. Dans les variables GitHub `production`, définir `AWS_REGION` (par défaut `eu-west-3`), `AWS_SAM_STACK_NAME` (par défaut `pokemon-wishlist-api`) et `ALLOWED_ORIGIN` (origine du site Vercel). Le rôle IAM doit limiter la confiance OIDC au dépôt et à `main` et autoriser SAM/CloudFormation, Lambda, API Gateway, S3 et IAM selon le template.

### Tests d’intégration

Créer un projet Supabase distinct, appliquer `supabase/init.sql` et les migrations, puis définir `SUPABASE_TEST_URL` et `SUPABASE_TEST_PUBLISHABLE_KEY` comme secrets de l’environnement GitHub `integration-tests`. Le job ne tourne que sur un push vers `main`; les PR ne reçoivent aucun secret et ne dépendent pas du projet de test. Les fixtures utilisent les IDs `900001`, `900002` et `900010` à `900016`; seuls ces IDs sont nettoyés. Ne pas réutiliser les identifiants de production.

## Commandes de vérification

```bash
npm ci
npm run lint
npm run check:locales
npm run format:check
npm run typecheck
npm run typecheck:backend
npm test
npm run test:integration
npm run test:coverage
npm run build:backend
npm run test:e2e
npm run build
sam validate --template-file template.yaml --region eu-west-3
sam build --template-file template.yaml --region eu-west-3
```

`sam validate` s’exécute dans le job de déploiement après l’authentification AWS par OIDC. Le job de validation des pull requests n’utilise pas de secrets AWS; il exécute `sam build` avec la région explicite.

Pour un smoke test API non destructif, `API_BASE_URL` doit être l’URL racine API Gateway. Pour le test complet, fournir aussi `FRONTEND_BASE_URL`. Le script n’effectue que des GET.

OIDC GitHub subject for the AWS role: `repo:gregoiremrcr/int--deployement:environment:production`. Restrict the GitHub production environment to deployments from `main`.

For the coverage badge, create the repository in Codecov, add `CODECOV_TOKEN` as a GitHub Actions secret, and set `CODECOV_ENABLED=true` as a GitHub Actions variable. The upload step is disabled unless explicitly enabled and runs only on `main`.

## Retour arrière et limites des migrations

1. Identifier le dernier déploiement Vercel stable et le restaurer depuis l’interface de déploiement Vercel.
2. Pour AWS, créer un revert du commit fautif vers le dernier code stable et le fusionner sur `main`; la CI redéploie le template et le code Lambda correspondants.
3. Si une migration a déjà été appliquée, écrire et livrer une migration compensatoire testée. Le runner et le workflow ne suppriment pas automatiquement une migration ni ses données.
4. Rejouer les smoke tests puis vérifier les parcours navigateur et les logs des services avec les comptes de production.

Le déploiement AWS/Vercel, le CRUD de production, le statut de la base distante, les identifiants et les règles IAM restent à valider dans les comptes du propriétaire. Le présent travail prépare les scripts et le workflow; il ne les déclenche pas.
