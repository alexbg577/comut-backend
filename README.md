# Comut — Backend API

API REST Node.js pour l'application Comut. Hébergée sur Render.

## Stack

- **Node.js** + Express
- **MongoDB** Atlas (Mongoose)
- **Cloudinary** — stockage médias (photo/vidéo/musique)
- **Resend** — emails transactionnels
- **JWT** + bcrypt — auth sécurisée

## Endpoints

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| GET | `/api/auth/verify-email/:token` | Vérification email |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/forgot-password` | Mot de passe oublié |
| POST | `/api/auth/reset-password` | Réinitialiser MDP |
| POST | `/api/auth/change-password` | Changer MDP (auth) |
| GET | `/api/auth/me` | Profil connecté |

### Groupes
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/groups/create` | Créer un groupe |
| POST | `/api/groups/join` | Rejoindre via code |
| GET | `/api/groups/me` | Info groupe actuel |
| POST | `/api/groups/leave` | Quitter le groupe |
| POST | `/api/groups/promote/:userId` | Promouvoir admin |
| POST | `/api/groups/demote/:userId` | Rétrograder admin |
| POST | `/api/groups/kick/:userId` | Exclure un membre |
| PATCH | `/api/groups/settings` | Paramètres groupe |

### Contenu
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/content/upload` | Upload fichier (≤3GB) |
| POST | `/api/content/upload-zip` | Upload ZIP |
| GET | `/api/content` | Liste contenus du groupe |
| GET | `/api/content/shorts` | Feed shorts |
| GET | `/api/content/favorites` | Favoris |
| POST | `/api/content/:id/like` | Like/Unlike |
| POST | `/api/content/:id/favorite` | Favori/Unfavori |
| DELETE | `/api/content/:id` | Supprimer contenu |

### Commentaires
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/comments` | Ajouter commentaire |
| GET | `/api/comments/:contentId` | Liste commentaires |
| DELETE | `/api/comments/:id` | Supprimer commentaire |
| POST | `/api/comments/:id/like` | Liker commentaire |

### Admin (Owner Comut uniquement)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/admin/users` | Tous les utilisateurs |
| DELETE | `/api/admin/users/:id` | Supprimer utilisateur |
| PATCH | `/api/admin/users/:id/password` | Changer MDP |
| GET | `/api/admin/groups` | Tous les groupes |
| DELETE | `/api/admin/groups/:id` | Supprimer groupe |
| GET | `/api/admin/stats` | Statistiques globales |

## Variables d'environnement

Copiez `.env.example` en `.env` et remplissez les valeurs.

## Déploiement

Push sur `main` → Render redéploie automatiquement.

```bash
git add -A && git commit -m "update" && git push
```
