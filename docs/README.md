# Documentation Moodly

| Document | Pour qui | Contenu |
| --- | --- | --- |
| [TUTORIEL.md](TUTORIEL.md) | Salariés et managers | Utiliser l'app écran par écran, avec captures |
| Vidéo de démo (jointe à la pull request « docs-competences » sur GitHub) | Tout le monde | Le parcours salarié puis manager (≈ 1 min 30) |
| [ETHIQUE-VIE-PRIVEE-RISQUES.md](ETHIQUE-VIE-PRIVEE-RISQUES.md) | Jury, client, DPO | Anonymat, RGPD, risques pour le bien-être |
| [PROTOCOLE.md](PROTOCOLE.md) | Développeurs | Échanges téléphone ↔ serveur, sécurité, codes d'erreur |
| [MISE-EN-OEUVRE.md](MISE-EN-OEUVRE.md) | Client, jury | Hébergement, sauvegardes, coûts, calendrier de déploiement |
| [GESTION-DE-PROJET.md](GESTION-DE-PROJET.md) | Équipe | Tableau des tâches, règles Git, pull requests, relecture |
| [COMPTE-RENDU-MODELE.md](COMPTE-RENDU-MODELE.md) | Équipe | Modèle de compte rendu de réunion |
| [Présentation aux salariés](https://claude.ai/artifact/HPQhMHhaaG6JAXsdqq6gni) | Salariés | 10 diapositives : pourquoi Moodly, anonymat, lancement |

## Où trouver la preuve de chaque compétence

| Compétence | Preuve |
| --- | --- |
| Communiquer clairement avec coéquipiers, clients et parties prenantes | READMEs, [comptes rendus](COMPTE-RENDU-MODELE.md), descriptions de pull requests |
| Rendre des données complexes compréhensibles visuellement | Tableau de bord manager ([tutoriel, partie 2](TUTORIEL.md#partie-2--je-suis-manager)) |
| Identifier des critères d'analyse pertinents | Moyenne, tendance, participation, répartition, raisons : `Moodly/moodly-back/src/api/team/services/team.js` |
| Fournir des retours constructifs à ses pairs | [Grille de relecture](GESTION-DE-PROJET.md#4-relire-le-code-dun-coéquipier--la-grille) + commentaires sur les pull requests |
| Créer un tutoriel | [TUTORIEL.md](TUTORIEL.md), [guide de connexion sociale](../Moodly/moodly-native/GUIDE-CONNEXION-SOCIALE.md) |
| Utiliser un outil de versioning pour collaborer | Branches, pull requests, [règles Git](GESTION-DE-PROJET.md#2-règles-git) |
| Utiliser des outils de gestion de projet | Tableau GitHub Projects ([backlog](GESTION-DE-PROJET.md#1-le-tableau-des-tâches-kanban)) |
| Respecter la vie privée et la confidentialité | [ETHIQUE-VIE-PRIVEE-RISQUES.md](ETHIQUE-VIE-PRIVEE-RISQUES.md) §2 et §3 |
| Rédiger la documentation du code | Commentaires en français dans tout le code, READMEs, `requests.http` |
| Composer une image / vidéo numérique | Mascotte et icônes de l'app, vidéo de démo (jointe à la pull request « docs-competences ») |
| Concevoir une UX ergonomique | L'app ([tutoriel](TUTORIEL.md)) : 3 étapes, une main, mode sombre |
| Utiliser des bibliothèques spécifiques | `jose`, `better-sqlite3`, `expo-secure-store`, `google-signin`, `react-native-svg`… |
| Développer une méthode d'authentification | [PROTOCOLE.md](PROTOCOLE.md) §2 et §3.1 à 3.3 |
| Concevoir un protocole de transmission entre deux appareils | [PROTOCOLE.md](PROTOCOLE.md) |
| Développer en utilisant un framework | Strapi 5 (back), React Native / Expo (app) |
| Utiliser Git | Historique du dépôt, préfixes `feat` / `fix` / `docs` |
| Évaluer les risques pour la santé et le bien-être | [ETHIQUE-VIE-PRIVEE-RISQUES.md](ETHIQUE-VIE-PRIVEE-RISQUES.md) §4 |
| Utiliser le numérique pour améliorer le bien-être | Le produit lui-même |
| Prendre en compte la morale et l'éthique | [ETHIQUE-VIE-PRIVEE-RISQUES.md](ETHIQUE-VIE-PRIVEE-RISQUES.md) §1 et §5 |
| Suggérer une mise en œuvre réaliste | [MISE-EN-OEUVRE.md](MISE-EN-OEUVRE.md) |
| Fournir un prototype convaincant | L'app qui tourne (web + téléphone), vidéo de démo (jointe à la pull request) |
| Communiquer les bénéfices de la transformation digitale aux employés | [Présentation aux salariés](https://claude.ai/artifact/HPQhMHhaaG6JAXsdqq6gni) |
