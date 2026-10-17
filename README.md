# Moodly

MVP d'une app mobile de suivi du moral des salariés (projet Epitech Digital School, démarche RSE /
bien-être au travail). Les salariés partagent leur moral du jour de façon **anonyme** ; le manager
voit le moral de son équipe sur 30 jours, uniquement en données agrégées.

| Dossier                                   | Contenu                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| [`Moodly/moodly-back`](Moodly/moodly-back) | API **Strapi 5** (SQLite) : auth, rôles, saisies anonymes, stats |
| [`Moodly/moodly-native`](Moodly/moodly-native) | App **React Native (Expo)** pour iPhone et Android, connexion Google / Apple / Microsoft |

## Démarrage rapide

```bash
# 1. Le back (terminal 1)
cd Moodly/moodly-back
npm install && npm run setup && npm run seed
npm run develop                      # http://localhost:1337

# 2. L'app React Native (terminal 2)
cd Moodly/moodly-native
npm install && cp .env.example .env.local
npm run web                          # navigateur : http://localhost:8081
npm run telephone                    # iPhone / Android avec l'app Expo Go (même Wi-Fi)
```

Connexion : agence **AG-0001**, `camille.durand@entreprise.fr` (salarié) ou
`julien.moreau@entreprise.fr` (manager), mot de passe **`Moodly2026!`**.

Les détails (routes de l'API, anonymat / RGPD, connexion Google / Apple / Microsoft) sont dans le README de chaque dossier.

## Documentation

Tout est dans [`docs/`](docs/README.md) : tutoriel, vidéo de démo, éthique et vie privée, protocole
d'échange, mise en œuvre, gestion de projet. La [présentation aux salariés](https://claude.ai/artifact/HPQhMHhaaG6JAXsdqq6gni)
est en ligne (à partager depuis son menu « Partager »).

Sauvegarder la base : `npm run backup` dans `Moodly/moodly-back` (copie automatique chaque nuit à 2h30).
