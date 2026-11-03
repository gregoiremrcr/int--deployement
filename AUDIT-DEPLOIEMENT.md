# Audit de préparation au déploiement

Date de l’audit : 3 novembre 2026

## Conclusion

Le projet est proche d’un déploiement fonctionnel, mais il manque encore la chaîne de déploiement de l’API et la configuration des variables d’environnement de production.

L’architecture prévue semble être :

- frontend Nuxt déployé sur Vercel ;
- API Hono déployée sur AWS Lambda + API Gateway avec SAM ;
- données stockées dans Supabase.

En l’état, le frontend pointe par défaut vers `http://localhost:8787`. Il ne pourra donc pas communiquer avec l’API en production tant que `NUXT_PUBLIC_API_BASE_URL` n’est pas défini avec l’URL publique API Gateway.

## État vérifié

| Élément | État | Commentaire |
|---|---|---|
| Typecheck backend | OK | `npm.cmd run typecheck:backend` passe |
| Tests backend | OK | 4 tests passent |
| Build backend | OK | `npm.cmd run build:backend` passe |
| Lint / locales / format | OK | Le lint ne remonte que 4 warnings Vue |
| Build/typecheck Nuxt | À corriger | Échec lors de l’appel réseau à PokeAPI dans `nuxt.config.ts` |
| CI GitHub | Partiel | Vérifie et build, mais ne déploie que le frontend Vercel |
| Déploiement API AWS | Manquant | Aucun workflow, script npm ou procédure automatisée |
| AWS SAM CLI | Manquant localement | La commande `sam` n’est pas installée sur la machine auditée |
| Base Supabase | OK | Les migrations `000_schema_migrations.sql` et `001_likes.sql` ont été appliquées avec succès sur la base cible |
| Docker | Présent | À valider avec un build et un démarrage en environnement de déploiement |

## Bloquants à traiter

### 1. Déployer l’API et récupérer son URL publique

Le fichier `template.yaml` décrit bien une Lambda et une API Gateway, mais rien dans `.github/workflows/ci.yml` ne lance `sam build` ou `sam deploy`.

À faire :

1. Installer/configurer AWS SAM CLI pour un déploiement manuel, ou ajouter un job GitHub Actions dédié.
2. Configurer une identité AWS ayant les droits nécessaires pour CloudFormation, Lambda, API Gateway, S3 et IAM.
3. Créer `samconfig.toml` à partir de `samconfig.toml.example`.
4. Renseigner `SupabaseUrl`, `SupabasePublishableKey` et `AllowedOrigin`.
5. Exécuter et vérifier :

   ```bash
   sam build
   sam deploy --guided
   ```

6. Tester l’URL produite avec `GET /health`.

Le `AllowedOrigin` ne devrait pas rester à `*` en production : il doit être l’URL Vercel réelle, par exemple `https://mon-projet.vercel.app`.

### 2. Configurer Vercel avec l’URL de l’API

Le pipeline Vercel attend déjà les secrets suivants :

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Il faut également définir dans Vercel, pour l’environnement **Production** :

```text
NUXT_PUBLIC_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com
```

Cette variable est lue au build Nuxt. Après sa création ou modification, il faut relancer un déploiement Vercel.

Ne pas mettre `http://localhost:8787` en production.

### 3. Stabiliser le build Nuxt sans dépendance réseau fragile

`nuxt.config.ts` appelle PokeAPI pendant `nitro:config` pour générer environ 2 000 routes. Cela rend le build dépendant de la disponibilité de PokeAPI et du réseau du runner.

Le build/typecheck a échoué pendant l’audit avec `fetch failed` sur cet appel.

Solutions recommandées :

- déplacer cette génération vers une étape contrôlée et gérer les erreurs réseau ; ou
- ne pas pré-rendre les 2 000 pages et laisser les pages être rendues à la demande ; ou
- utiliser une liste/version de données mise en cache dans le dépôt si le pré-rendu est indispensable.

Le choix doit être fait avant le déploiement, sinon un incident PokeAPI peut bloquer chaque mise en production.

### 4. Vérifier la base Supabase cible

Le fichier `supabase/init.sql` doit être exécuté sur le projet Supabase de production. Il crée la table `public.wishlist`, l’index, le trigger de limite à 6 éléments et les policies RLS.

À vérifier :

- l’URL Supabase correspond au projet de production ;
- la clé utilisée est bien une clé publishable/anon, jamais une `service_role` exposée ;
- `GET`, `POST` et `DELETE` fonctionnent avec cette clé ;
- les policies anonymes sont acceptées par le besoin métier.

Attention : les policies actuelles permettent à n’importe quel client anonyme de lire, ajouter et supprimer des éléments. C’est fonctionnel pour une wishlist publique, mais ce n’est pas sécurisé pour des données privées ou multi-utilisateurs. Une authentification et des policies par utilisateur seront nécessaires si le projet doit gérer plusieurs comptes.

## Configuration à harmoniser

Les fichiers `.env.example` utilisent :

```text
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

Les fichiers locaux utilisent plutôt les noms `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Le backend accepte les deux formats, mais cette duplication peut provoquer des erreurs de configuration.

À faire : choisir un seul format documenté pour le backend, idéalement :

```text
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<publishable-or-anon-key>
ALLOWED_ORIGIN=https://<frontend>.vercel.app
NUXT_PUBLIC_API_BASE_URL=https://<api-gateway-url>
```

Ajouter `ALLOWED_ORIGIN` dans `.env.example` et documenter séparément les variables Vercel et AWS. Les fichiers `.env` locaux ne sont pas suivis par Git, ce qui est correct.

## Déploiement Docker

Le `Dockerfile` démarre le frontend Nuxt et l’API Hono dans le même conteneur, sur les ports 3000 et 8787. C’est pratique en local mais moins adapté à une plateforme qui attend un seul port ou un seul processus.

Avant de considérer Docker prêt pour la production :

- exécuter `docker build -t pokemon-wishlist .` ;
- démarrer le conteneur avec des variables de production ;
- tester `/` sur le port 3000 et `/health` sur le port 8787 ;
- ajouter un healthcheck et une stratégie de gestion des deux processus, ou séparer frontend et API en deux services ;
- vérifier que la plateforme cible autorise bien deux ports exposés.

Le conteneur utilise `tsx` au runtime et lance deux processus via `sh`. Une séparation en deux déploiements est préférable si Docker devient le mode de production principal.

## CI/CD manquant

Le workflow actuel :

- valide le code ;
- construit le backend ;
- exécute les tests E2E ;
- déploie le frontend sur Vercel lors d’un push sur `main`.

Il ne :

- déploie pas la Lambda/API Gateway ;
- ne vérifie pas `sam validate` ;
- ne teste pas une API déployée ;
- ne lance pas le test d’intégration Supabase dans le pipeline ;
- ne vérifie pas explicitement la présence des variables de production.

Pour une chaîne complète, ajouter un job AWS après les validations, avec des secrets ou une OIDC GitHub vers AWS. Le job devrait faire `sam build`, `sam deploy` puis un smoke test de `/health`.

## Ordre conseillé avant mise en production

1. Décider si le déploiement cible est Vercel + AWS Lambda, ou Docker uniquement.
2. Corriger le build Nuxt pour supprimer sa dépendance réseau non gérée.
3. Créer/valider la table Supabase en production.
4. Déployer l’API AWS et tester `/health`, `/wishlist`, `POST` et `DELETE`.
5. Configurer `NUXT_PUBLIC_API_BASE_URL` dans Vercel avec l’URL API réelle.
6. Configurer `ALLOWED_ORIGIN` avec le domaine frontend réel.
7. Ajouter le déploiement AWS au CI/CD, ou documenter une procédure manuelle reproductible.
8. Faire un déploiement Vercel et valider le parcours complet dans le navigateur.
9. Ajouter un domaine, HTTPS, logs/alertes et une stratégie de sauvegarde Supabase si le projet est destiné à être utilisé réellement.

## Commandes de validation utiles

```bash
npm ci
npm run ci
npm run api
npm run build
npm run build:backend
sam validate --template-file template.yaml
sam build
sam deploy

## Mise a jour du 3 novembre 2026

La connexion PostgreSQL de migration a ete validee avec :

```bash
npm run db:migrate
```

Resultat confirme :

- `000_schema_migrations.sql` appliquee ;
- `001_likes.sql` appliquee ;
- la table `public.schema_migrations` est suivie par le runner.

Le script `scripts/migrate.mjs` charge automatiquement `.env` via `dotenv/config`. La variable `DATABASE_URL` reste reservee aux migrations et ne doit pas etre exposee au frontend ni commitee dans Git.
```

Sur Windows, si PowerShell bloque `npm.ps1`, utiliser `npm.cmd` ou ajuster la policy d’exécution de la machine.
