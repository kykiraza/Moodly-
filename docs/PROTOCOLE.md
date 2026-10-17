# Moodly : protocole d'échange entre le téléphone et le serveur

L'app (sur le téléphone) et le serveur Strapi communiquent par une **API REST** : des requêtes
HTTP(S) qui transportent du **JSON**. Ce document décrit les règles de cet échange : qui envoie
quoi, dans quel ordre, avec quelles preuves d'identité, et comment chaque erreur est signalée.

---

## 1. Vue d'ensemble

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Transport | HTTP en local, **HTTPS (TLS)** en production | Chiffre tout l'échange, empêche l'espionnage sur le Wi-Fi |
| Format | JSON (`Content-Type: application/json`) | Lisible, natif en JavaScript des deux côtés |
| Identité | **Jeton JWT** signé par le serveur, valable 7 jours | Le serveur vérifie la signature sans stocker de session |
| Cloisonnement | En-tête **`X-Agency-Id`** (code entreprise) | Une requête ne peut toucher que les données de **son** entreprise |
| Anti-abus | Limiteur d'essais sur les routes publiques | Bloque les attaques par force brute |
| Adresse de base | `http://<serveur>:1337/api` | Réglée dans l'app par `EXPO_PUBLIC_API_URL` |

## 2. Les deux en-têtes de sécurité

Chaque requête d'un utilisateur connecté porte :

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...   ← « qui je suis » (jeton signé)
X-Agency-Id: AG-0001                            ← « dans quelle entreprise »
```

Le serveur vérifie, dans cet ordre :
1. **La signature et la date du jeton** : faux ou expiré, il répond `401` et l'app déconnecte.
2. **Le rôle** (salarié ou manager) a-t-il le droit d'appeler cette route ? Sinon, `403`.
3. **L'entreprise** (règle `agency-match`) : le code `X-Agency-Id` doit être celui du compte.
   Sinon, `403`. Un jeton volé ne permet donc pas de lire une autre entreprise.

## 3. Les échanges, étape par étape

### 3.1 Connexion
```mermaid
sequenceDiagram
  autonumber
  participant T as Téléphone (app)
  participant S as Serveur Strapi
  participant B as Base de données
  T->>S: POST /api/auth/login { agencyId, email, password }
  Note over S: limiteur : 10 essais / min (email + IP)
  S->>B: compte avec cet email ?
  B-->>S: empreinte bcrypt du mot de passe, entreprise
  Note over S: compare le mot de passe à l'empreinte<br/>(même durée si le compte n'existe pas)
  alt identifiants corrects et bonne entreprise
    S-->>T: 200 { jwt, agencyId, role, user }
    Note over T: jeton rangé dans le coffre-fort<br/>du téléphone (Trousseau / Keystore)
  else sinon
    S-->>T: 401 « Email, mot de passe ou ID agence incorrect »
  end
```
Le message d'erreur est **le même** quel que soit le champ faux : on ne peut pas deviner quels
emails ont un compte.

### 3.2 Connexion avec Google, Apple ou Microsoft
```mermaid
sequenceDiagram
  autonumber
  participant T as Téléphone
  participant F as Google / Apple / Microsoft
  participant S as Serveur Strapi
  T->>F: connexion (écran du fournisseur)
  F-->>T: ID token (jeton signé par le fournisseur)
  T->>S: POST /api/auth/social { provider, idToken, agencyId }
  S->>F: clés publiques du fournisseur (JWKS, mises en cache)
  Note over S: vérifie la signature, l'émetteur, le destinataire<br/>(nos identifiants), l'expiration, l'email vérifié
  S-->>T: 200 { jwt, ... } (compte existant) ou 201 (compte créé)
```

### 3.3 Inscription
```mermaid
sequenceDiagram
  autonumber
  participant T as Téléphone
  participant S as Serveur Strapi
  T->>S: GET /api/auth/agency?code=AG-0001
  Note over S: limiteur : 20 essais / min par IP
  S-->>T: 200 { code, name: "Agence démo Moodly" } (ou 404)
  Note over T: affiche « ✓ Agence démo Moodly »
  T->>S: POST /api/auth/register { agencyId, name?, email, password }
  S-->>T: 201 { jwt, ... } (compte salarié dans l'équipe de l'entreprise)
```

### 3.4 Envoyer son humeur du jour (le cœur de l'anonymat)
```mermaid
sequenceDiagram
  autonumber
  participant T as Téléphone
  participant S as Serveur Strapi
  participant B as Base de données
  T->>S: GET /api/moods/today (jeton + X-Agency-Id)
  S-->>T: 200 { hasAnswered: false }
  Note over T: le message libre est gardé<br/>SUR LE TÉLÉPHONE, jamais envoyé
  T->>S: POST /api/moods { level: 4, factors: ["ambiance","missions"] }
  Note over S: équipe lue dans le compte (jamais dans la requête)<br/>empreinte = HMAC(clé secrète, utilisateur + jour)
  S->>B: enregistre { jour, note, raisons, équipe, empreinte }<br/>SANS identifiant d'utilisateur
  alt première réponse du jour
    S-->>T: 201 { data: { day, score, tags } }
  else empreinte déjà présente aujourd'hui
    S-->>T: 409 « déjà répondu aujourd'hui »
  end
```
**Point clé :** l'humeur arrive sur le serveur **sans lien avec la personne**. L'empreinte sert
seulement à refuser une 2e réponse le même jour. Elle change chaque jour, et sans la clé
secrète on ne peut pas remonter à la personne.

### 3.5 Le manager consulte son équipe
```mermaid
sequenceDiagram
  autonumber
  participant T as Téléphone du manager
  participant S as Serveur Strapi
  T->>S: GET /api/team/stats?days=30 (jeton + X-Agency-Id)
  Note over S: équipe du manager uniquement<br/>jours < 3 réponses, week-ends et aujourd'hui masqués<br/>et retirés de tous les calculs
  S-->>T: 200 { series, summary, distribution, tags }
```
Le serveur ne renvoie **que des agrégats** : moyennes, pourcentages et nombres de réponses.
Aucune réponse individuelle ne quitte le serveur.

## 4. Les routes

| Méthode | Route | Qui | Envoi → Réponse |
| --- | --- | --- | --- |
| POST | `/auth/login` | tout le monde | `{ agencyId, email, password }` → session |
| POST | `/auth/register` | tout le monde | `{ agencyId, name?, email, password }` → session |
| POST | `/auth/social` | tout le monde | `{ agencyId, provider, idToken, name? }` → session |
| GET | `/auth/agency?code=` | tout le monde | → `{ code, name }` |
| GET | `/profile` | connecté | → nom, email, rôle, entreprise, équipe |
| GET | `/tags` | connecté | → les 8 raisons |
| GET | `/moods/today` | salarié | → `{ hasAnswered }` |
| POST | `/moods` | salarié | `{ level 1..5, factors ≤ 3 }` → `201` |
| GET | `/team/stats?days=7..90` | manager | → statistiques agrégées |

## 5. Codes de réponse

| Code | Signification | Réaction de l'app |
| --- | --- | --- |
| `200` / `201` | OK / créé | Affiche le résultat |
| `400` | Donnée invalide (note hors 1..5, raison inconnue…) | Affiche le message du serveur |
| `401` | Identifiants incorrects (connexion), ou jeton absent, faux ou expiré | Connexion : message d'erreur. Sinon : **déconnexion automatique**, retour à l'écran de connexion |
| `403` | Pas le droit (mauvais rôle ou mauvaise entreprise) | Message d'erreur |
| `404` | Introuvable (ex. code entreprise inconnu) | « Code entreprise inconnu » |
| `409` | Conflit : déjà répondu aujourd'hui, ou email déjà utilisé | « Tu as déjà partagé ton moral aujourd'hui » |
| `429` | Trop d'essais | « Réessaie dans une minute » |
| pas de réponse | Serveur injoignable | « Connexion au serveur impossible » |

## 6. Le tester soi-même
- Le fichier `Moodly/moodly-back/requests.http` contient toutes ces requêtes, prêtes à lancer
  depuis VS Code (extension « REST Client »).
- Le client de l'app : `Moodly/moodly-native/src/lib/api.js`.
- Les routes du serveur : `Moodly/moodly-back/src/api/*/routes/`.
