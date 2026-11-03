# Audit CI/CD — Pokémon Wishlist

Mise à jour du 3 novembre 2026. Ce document décrit les changements préparés dans le dépôt; aucun déploiement ni contrôle d’un compte AWS, Supabase ou Vercel n’a été effectué.

## Architecture retenue

- Frontend Nuxt rendu côté serveur sur Vercel.
- API Hono sur AWS Lambda et API Gateway avec AWS SAM.
- Données wishlist et likes dans Supabase.

Les exemples S3/CloudFront du cours sont des variantes statiques, hors périmètre de cette architecture.

## État du dépôt

| Élément              | État                                                                                                                                                          | Vérification ou configuration restante                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Build Nuxt           | L’appel de génération des 2 000 routes PokeAPI a été retiré. Les routes dynamiques sont servies en SSR à la demande.                                          | Le build local passe sur le Node disponible, avec un avertissement de version; le workflow utilise Node 22. |
| CI                   | Lint, locales, format, types, tests, couverture, E2E, builds frontend/backend et validation/build SAM sont déclarés.                                          | Confirmer le résultat du prochain run GitHub après configuration.                                           |
| Tests Supabase       | Appelés par la CI avec `SUPABASE_TEST_*`; ignorés si les identifiants dédiés manquent. Nettoyage des seules fixtures `900001`, `900002`, `900010` à `900016`. | Créer et utiliser un projet de test dédié.                                                                  |
| Migrations           | Le runner transactionnel/idempotent existant s’exécute avant le déploiement Lambda sur `main`.                                                                | Configurer `DATABASE_URL` PostgreSQL de production dans l’environnement GitHub protégé.                     |
| Déploiement API      | Workflow SAM préparé avec OIDC et smoke test `GET /health`.                                                                                                   | Rôle IAM, confiance OIDC, paramètres Supabase et origine CORS restent à configurer.                         |
| Déploiement frontend | Vercel déployé après l’API; le workflow transmet l’URL API issue de SAM et lance un smoke test SSR.                                                           | Secrets Vercel, domaine public et variables Production restent à configurer.                                |
| Smoke tests          | Scripts non destructifs: health API, lecture wishlist, accueil et fiche SSR Pokémon.                                                                          | Les tests distants ne s’exécutent qu’après un vrai déploiement, non demandé ici.                            |
| Rollback             | Procédure documentée pour Vercel, AWS et migrations Supabase compensatoires.                                                                                  | À exécuter et vérifier par le propriétaire dans les comptes de production.                                  |
| Couverture           | Vitest produit texte, JSON et LCOV; le workflow publie l’artefact et un tableau de pourcentages. L’upload Codecov et le badge sont préparés mais désactivés.  | Créer le projet Codecov puis configurer `CODECOV_TOKEN` et `CODECOV_ENABLED=true` si souhaité.              |

## Variables à configurer

Les valeurs d’exemple sont dans `.env.example`, `.env.test.example` et `samconfig.toml.example`; elles sont fictives. Les variables requises et leur emplacement sont détaillés dans [README.md](README.md) et [docs/CI-CD-EXERCICES.md](docs/CI-CD-EXERCICES.md).

En résumé, l’environnement GitHub `production` doit contenir les secrets AWS/Supabase/Vercel et les variables non secrètes de région, origine autorisée et URL publique. Le rôle AWS doit accepter le sujet OIDC `repo:gregoiremrcr/int--deployement:environment:production`, tandis que l’environnement GitHub limite les déploiements à `main`. Les tests Supabase utilisent exclusivement un projet distinct et les secrets `SUPABASE_TEST_*`.

## Vérifications locales réalisées

- `npm ci`: réussi après autorisation réseau; npm signale que Node local `24.8.0` est antérieur au minimum demandé par cette version de Nuxt.
- `npm run lint`, vérification des locales, formatage, typecheck Nuxt/backend et lint/format backend: réussis; ESLint conserve quatre avertissements Vue préexistants sur les balises HTML autofermantes.
- `npm test`: 9 tests réussis.
- `npm run test:integration`: 3 tests ignorés faute d’identifiants de test dédiés.
- `npm run test:coverage`: 47 % de lignes sur les fichiers couverts par Vitest; rapport généré localement.
- E2E Playwright: les quatre scénarios ont réussi après isolation de PokeAPI et de Supabase par des fixtures locales. Sous Windows, le processus n’a pas quitté après les résultats; il a été arrêté manuellement.
- `npm run build`: réussi; l’appel réseau PokeAPI n’apparaît plus dans le build.
- `npm run smoke:production`: réussi contre le build Nuxt local et l’API Hono en mémoire; health, lecture wishlist, accueil SSR et fiche Pokémon SSR répondent HTTP 200.
- SAM CLI non installé localement; le template n’a donc pas été validé par SAM sur cette machine.

L’intégration réelle Supabase, la validation SAM distante, les builds GitHub, les smoke tests de production, les variables de comptes, les permissions IAM et les déploiements restent non vérifiés.
