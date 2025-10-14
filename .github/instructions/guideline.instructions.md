---
applyTo: '**'
---

Le Projet Flotio utilise [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) pour la gestion des messages de commit. Veuillez suivre les directives ci-dessous lors de la rédaction de vos messages de commit.

# Structure des messages de commit

Un message de commit doit être structuré comme suit :

```
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]
```


## Types de commit
Voici les types de commit couramment utilisés dans le Projet Flotio :
- **feat**: Une nouvelle fonctionnalité
- **fix**: Une correction de bug
- **docs**: Des modifications de documentation
- **style**: Des modifications de style (formatage, espaces, etc.) qui n'affectent pas le code
- **refactor**: Un changement de code qui n'ajoute ni une fonctionnalité ni ne corrige un bug
- **perf**: Un changement de code qui améliore les performances
- **test**: Ajout ou modification de tests
- **chore**: Des tâches de maintenance (par exemple, mise à jour des dépendances, scripts de build, etc.)

## Scope (optionnel)
Le scope est une partie optionnelle du message de commit qui indique la section du code affectée par le commit. Par exemple, si vous travaillez sur la fonctionnalité d'authentification, vous pouvez utiliser `auth` comme scope.

## Description
La description doit être concise et claire, résumant le changement apporté par le commit.
## Body (optionnel)
Le corps du message de commit est optionnel et peut être utilisé pour fournir des détails supplémentaires sur le changement. Il peut inclure des informations sur le pourquoi du changement, les implications, etc.

## Footer (optionnel)
Le footer est également optionnel et peut être utilisé pour référencer des issues ou des tickets liés au commit. Par exemple, vous pouvez utiliser `Closes #123` pour indiquer que le commit ferme l'issue numéro 123.

### Exemples de messages de commit
- `feat(auth): ajouter la fonctionnalité de réinitialisation de mot de passe`
- `fix(api): corriger le bug de pagination des utilisateurs`
- `docs: mettre à jour le README avec les instructions d'installation`
- `style: formater le code avec Prettier`
- `refactor(database): optimiser les requêtes SQL`
- `perf(cache): améliorer les performances de mise en cache`
- `test(auth): ajouter des tests pour la fonctionnalité de connexion`
- `chore(deps): mettre à jour les dépendances du projet`

## Règles supplémentaires
- Utilisez l'impératif dans la description (par exemple, "ajouter" au lieu de "ajouté" ou "ajoute").
- Limitez la ligne de description à 50 caractères.
- Séparez le corps du message de commit de la description par une ligne vide.
- Limitez les lignes du corps à 72 caractères.

## Ignorer les commits temporaires
Pour les commits temporaires ou de travail en cours, ajoutez `--- IGNORE ---` à la fin du message de commit. Ces commits seront ignorés dans l'historique officiel du projet.

## Language utilisés

Les language utilisé sont Golang, Typescript avec React.

## Commandes utiles
- Pour lint le "front" : `npm run lint`
- Pour lint le "back" : `go build $folder` (ex: `go build api`)

# Code structure

La structure de l'ensemble des projets Golang respecte la [convention officielle](https://go.dev/doc/modules/gomod-ref#go-mod-file) avec un dossier `cmd` pour les exécutables, un dossier `pkg` pour les packages réutilisables, et un dossier `internal` pour les packages internes.

# Gestion des branches

Le Projet Flotio utilise une stratégie de branchement Git simple :
- `main`: Branche principale contenant le code de production stable.
- `develop`: Branche de développement où les nouvelles fonctionnalités sont intégrées avant d'être fusionnées dans `main`.
- `feature/<nom-fonctionnalité>`: Branches pour le développement de nouvelles fonctionnalités.
- `fix/<nom-bug>`: Branches pour la correction de bugs.
- `release/<version>`: Branches pour préparer les nouvelles versions.
- `hotfix/<nom-bug>`: Branches pour les corrections de bugs critiques en production.

# Pull Requests

Les Pull Requests (PR) doivent être utilisées pour intégrer des changements dans les branches `develop` ou `main`. Chaque PR doit être liée à une issue correspondante et doit être revue par au moins un autre membre de l'équipe avant d'être fusionnée.

# Revue de code

Chaque PR doit être revue par au moins un autre membre de l'équipe. Les reviewers doivent vérifier que le code respecte les conventions de codage, que les tests passent, et que la fonctionnalité fonctionne comme prévu.

# Tests

Les tests unitaires et d'intégration doivent être écrits pour toutes les nouvelles fonctionnalités et les corrections de bugs. Utilisez des frameworks de test appropriés pour le langage utilisé (par exemple, `testing` pour Go, `Jest` pour JavaScript/TypeScript).

# Documentation

La documentation doit être maintenue à jour avec le code. Utilisez des outils de génération de documentation appropriés pour le langage utilisé (par exemple, `godoc` pour Go, `TypeDoc` pour TypeScript).

# Gestion des dépendances

Les dépendances doivent être gérées à l'aide des outils appropriés pour le langage utilisé (par exemple, `go mod` pour Go, `npm` ou `yarn` pour JavaScript/TypeScript). Les mises à jour des dépendances doivent être effectuées régulièrement pour bénéficier des dernières fonctionnalités et correctifs de sécurité.

# Formatage du code

Le code doit être formaté automatiquement à l'aide d'outils de formatage appropriés pour le langage utilisé (par exemple, `gofmt` pour Go, `Prettier` pour JavaScript/TypeScript). Le formatage doit être appliqué avant de committer les changements.

# Gestion des versions

Le Projet Flotio utilise le versionnage sémantique (SemVer) pour la gestion des versions. Les versions sont au format `MAJOR.MINOR.PATCH`, où :
- `MAJOR` est incrémenté pour les changements incompatibles avec les versions précédentes
- `MINOR` est incrémenté pour les nouvelles fonctionnalités compatibles avec les versions précédentes
- `PATCH` est incrémenté pour les corrections de bugs compatibles avec les versions précédentes

# Déploiement

Le déploiement des applications doit être automatisé à l'aide de pipelines CI/CD. Utilisez des outils appropriés pour le langage et l'infrastructure utilisés (par exemple, GitHub Actions, Jenkins, GitLab CI/CD).

# Sécurité

Les meilleures pratiques de sécurité doivent être suivies lors du développement du code. Cela inclut la gestion sécurisée des secrets, la validation des entrées utilisateur, et la protection contre les vulnérabilités courantes (par exemple, injection SQL, XSS).

