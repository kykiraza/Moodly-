# Moodly : éthique, vie privée et risques pour le bien-être

Moodly demande aux salariés comment ils vont. C'est une donnée sensible : mal protégée, elle
peut servir à surveiller, juger ou mettre la pression. Ce document explique **les choix faits pour
que l'outil aide les salariés sans se retourner contre eux**, et les risques qui restent.

---

## 1. Principes éthiques

| Principe | Ce que ça veut dire dans Moodly |
| --- | --- |
| **Anonymat réel** (pas seulement promis) | Le serveur est construit pour **ne pas pouvoir** dire qui a répondu quoi, même pour un administrateur. |
| **Le manager voit une équipe, jamais une personne** | Uniquement des moyennes et des répartitions, et seulement à partir de 3 réponses. |
| **Minimisation des données** (RGPD, art. 5) | On ne collecte que la note (1 à 5) et jusqu'à 3 raisons. Le message libre ne quitte jamais le téléphone. |
| **Durée de conservation limitée** | Les réponses sont supprimées automatiquement après 90 jours. |
| **Participation libre** | Pas de relance insistante, pas de classement, aucune sanction si on ne répond pas. |
| **Transparence** | L'app dit à chaque écran ce qui est anonyme et ce qui reste sur le téléphone. |

## 2. Comment l'anonymat est garanti techniquement

### 2.1 Une réponse n'est jamais reliée à un compte
La table des humeurs (`moods`) contient : **le jour, la note, les raisons, l'équipe**. Il n'y a
**aucune colonne « utilisateur »**. C'est une règle du projet : on n'ajoute jamais de relation
entre une humeur et un compte.

### 2.2 « Une réponse par jour » sans savoir qui a répondu
Pour empêcher de répondre 10 fois, il faut pourtant reconnaître un doublon. Le serveur calcule une
**empreinte HMAC** à partir de l'identifiant de la personne, du jour et d'une **clé secrète**
(`MOOD_SALT`) : `HMAC(clé, utilisateur + jour)`.
- La même personne obtient la même empreinte le même jour, donc le doublon est refusé.
- À partir de l'empreinte, **impossible de retrouver la personne** sans la clé secrète. De plus,
  l'empreinte change chaque jour : on ne peut pas suivre quelqu'un d'un jour à l'autre.

### 2.3 Ce que le manager peut voir… et ne pas voir
- **Seuil de 3 réponses** (`MOOD_MIN_RESPONSES`) : un jour avec moins de 3 réponses est **masqué**.
  Sinon, dans une équipe où une seule personne a répondu, la « moyenne » serait sa note.
- **Les jours masqués sont retirés de tous les calculs**, y compris des moyennes sur la période.
  Sans cette précaution, un manager pourrait comparer deux moyennes (avec et sans le jour masqué)
  et retrouver la note cachée par soustraction : c'est l'attaque par **différence**.
- **La journée en cours n'est jamais affichée.** Sinon, en regardant l'écran juste après qu'une
  personne a répondu, on verrait sa note.
- **Les statistiques demandent au moins 7 jours**, pour la même raison.

### 2.4 Ce qui reste sur le téléphone
- Le **message libre** (« Grosse semaine… ») et **l'historique personnel** (le calendrier
  « Mon espace ») sont stockés uniquement sur le téléphone. Le serveur ne les reçoit jamais.
- La session (jeton de connexion) est rangée dans le **coffre-fort chiffré du téléphone**
  (Trousseau sur iPhone, Keystore sur Android).

### 2.5 Les comptes
- Les mots de passe ne sont jamais stockés : seulement une **empreinte bcrypt**, irréversible.
- Connexion Google, Apple ou Microsoft : le serveur **vérifie la signature** du jeton du
  fournisseur et ne garde que l'email. Il ne garde ni le jeton ni l'identifiant de la personne
  chez le fournisseur.
- Les tentatives de connexion sont **limitées** (anti force brute). Une erreur ne dit jamais si
  c'est l'email ou le mot de passe qui est faux.
- Chaque entreprise est cloisonnée : un manager ne voit que **son** équipe, dans **son** entreprise.

## 3. Conformité RGPD (résumé)

| Exigence | Réponse de Moodly |
| --- | --- |
| Base légale | Intérêt légitime de l'employeur (qualité de vie au travail) **avec participation volontaire** ; à valider avec le DPO de l'entreprise cliente. |
| Minimisation | Note + raisons uniquement ; le texte libre reste sur le téléphone. |
| Limitation de conservation | Purge automatique à 90 jours (tâche planifiée chaque nuit à 3h). |
| Sécurité | Mots de passe hachés, jetons signés, coffre-fort du téléphone, cloisonnement par entreprise, sauvegardes. |
| Droits des personnes | Les réponses étant anonymes, on ne peut pas les rattacher à une personne (donc ni les lui montrer, ni les effacer individuellement). Le compte, lui, peut être supprimé. |
| Information | Écrans d'accueil et mentions « Ta réponse est anonyme », « Stocké uniquement sur ce téléphone ». |
| Analyse d'impact (AIPD) | Recommandée avant un déploiement réel, car il s'agit de données de bien-être de salariés. |

## 4. Risques pour la santé et le bien-être liés à l'outil

| Risque | Gravité | Ce que Moodly fait | Ce qui reste à faire |
| --- | --- | --- | --- |
| **Sentiment de surveillance** : « mon chef voit mon humeur » | Élevée | Anonymat technique (§2), seuil de 3, rien d'individuel côté manager | Expliquer l'anonymat aux équipes lors du lancement |
| **Pression à répondre** ou à « bien » répondre | Moyenne | Pas de classement ni de relance, pas de taux par personne | Charte d'usage : la participation ne doit jamais être évaluée |
| **Sur-sollicitation / notifications** | Faible | **Une seule** notification par jour (10h), désactivable dans les paramètres | Permettre de choisir l'heure |
| **Temps d'écran** | Faible | Saisie en quelques secondes, pas de fil d'actualité, rien qui pousse à rester dans l'app | — |
| **Fausse sécurité** : l'outil remplace l'écoute humaine | Moyenne | Le manager reçoit des **pistes d'action**, pas un diagnostic | Rappeler que Moodly ouvre la discussion mais ne la remplace pas |
| **Détresse non prise en charge** (une personne va très mal) | Élevée | L'anonymat empêche de l'identifier, c'est voulu | Afficher les ressources d'aide (médecine du travail, numéro national **3114**) quand quelqu'un choisit « Pas bien » |
| **Mauvaise interprétation des chiffres** | Moyenne | Moyenne sur 30 jours, tendance comparée, jours masqués expliqués | Former les managers à la lecture du tableau |
| **Fuite de données** | Moyenne | Pas de nom dans les humeurs, mots de passe hachés, sauvegardes hors Git | Hébergement en France/UE, HTTPS obligatoire (voir MISE-EN-OEUVRE.md) |

## 5. Choix assumés (et leurs limites)

- **Pas d'alerte individuelle**, même si quelqu'un répond « Pas bien » plusieurs jours de suite.
  C'est le prix de l'anonymat. La compensation : des ressources d'aide visibles par tous (à
  ajouter, voir §4).
- **Les équipes de moins de 3 personnes** n'auront presque jamais de statistiques. C'est voulu.
- **Le mot de passe libre** (`STRONG_PASSWORD=false`) est réservé à la démo. En production, on
  active `STRONG_PASSWORD=true` (8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial).

## 6. Où le vérifier dans le code

| Point | Fichier |
| --- | --- |
| Empreinte HMAC quotidienne | `Moodly/moodly-back/src/utils/moodly.js` (`dailyKey`) |
| Seuil, jours masqués, journée en cours | `Moodly/moodly-back/src/api/team/services/team.js` |
| Purge à 90 jours | `Moodly/moodly-back/src/api/mood/services/mood.js`, `config/cron-tasks.js` |
| Ce qui est envoyé (note + raisons, pas le message) | `Moodly/moodly-native/src/lib/api.js` (`sendMood`) |
| Journal personnel sur le téléphone | `Moodly/moodly-native/src/lib/moods.js` |
| Vérification des jetons Google / Apple / Microsoft | `Moodly/moodly-back/src/api/session/services/social.js` |
