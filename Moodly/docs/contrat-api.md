# Moodly — Contrat d'API (front ↔ back)

Version 3 questions. Toutes les routes sauf le login demandent le header :
`Authorization: Bearer <token>`

| # | Action | Route | Le front envoie | Le back renvoie |
|---|---|---|---|---|
| 1 | Se connecter | `POST /auth/login` | `{ email, password }` | `{ token, role, name }` |
| 2 | Envoyer les 3 réponses | `POST /moods` | `{ mood, workload, atmosphere }` (chacun de 1 à 5) | `{ success: true }` |
| 3 | Déjà répondu aujourd'hui ? | `GET /moods/today` | rien | `{ hasAnswered: true/false }` |
| 4 | Dashboard manager | `GET /team/stats?days=30` | rien | voir ci-dessous |

- `role` : `"employee"` ou `"manager"`
- Login raté : code HTTP **401**

## Réponse de la route 4

```json
{
  "daily": [{ "date": "2026-10-01", "mood": 3.6, "workload": 2.9, "atmosphere": 3.8, "count": 5 }],
  "summary": { "mood": 3.8, "workload": 3.2, "atmosphere": 3.9, "responseRate": 78 }
}
```

- `daily` : une entrée par jour sur 30 jours, avec la moyenne de l'équipe **pour chaque question**
  (le dashboard a un seul graphe avec 3 onglets : Humeur, Charge, Ambiance)
- `summary` : moyenne de chaque question sur la période + taux de réponse en %

## Anonymat (obligatoire)

- Jamais de nom ni de réponse individuelle dans la route 4, uniquement des moyennes d'équipe.
- Si `count` < 3 pour un jour, le front n'affiche pas ce jour.
- Route 4 réservée au rôle `manager` (403 sinon).

## Besoin pour la démo

- 1 compte manager + 4-5 comptes employés
- 30 jours de fausses données
