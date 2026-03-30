# 🔒 Guide de sécurité Cloudflare — Aircraft2Sell
## À faire MAINTENANT (dans l'ordre)

---

## ÉTAPE 1 — Changer le mot de passe admin (URGENT)

Le mot de passe `A2S@Admin2026!` était exposé en clair dans le code source.
**Il est potentiellement compromis. Changez-le immédiatement :**

1. Allez sur https://supabase.com → votre projet → Authentication → Users
2. Trouvez `contact.aircraft2sell@gmail.com`
3. Cliquez sur les 3 points → "Send password reset"
4. Choisissez un mot de passe fort (16+ caractères, chiffres, symboles)

---

## ÉTAPE 2 — Activer Cloudflare Access sur l'admin (CRITIQUE)

Cloudflare Access ajoute une vraie couche d'authentification AVANT que la page se charge.

1. **Tableau de bord Cloudflare** → Zero Trust → Access → Applications
2. Cliquez **"Add an application"** → **"Self-hosted"**
3. Remplissez :
   - App name : `Aircraft2Sell Admin`
   - Session Duration : `4 hours`
   - Application domain : `www.aircraft2sell.eu`
   - Path : `/admin-a2s00760.html`
4. **Policy** → Add a policy :
   - Policy name : `Admin only`
   - Action : `Allow`
   - Rule : `Emails` → `contact.aircraft2sell@gmail.com`
5. Sauvegardez

Résultat : Cloudflare demandera une vérification email OTP avant même d'afficher la page admin.

**Faites la même chose pour `/diag.html`**

---

## ÉTAPE 3 — Règles WAF Custom (bloquer brute force + fichiers sensibles)

1. **Security** → **WAF** → **Custom Rules** → "Create rule"

### Règle 1 : Bloquer accès direct au SQL
- Name : `Block SQL migration file`
- Expression : `(http.request.uri.path contains "migration_supabase.sql")`
- Action : **Block**

### Règle 2 : Rate limiting sur login
- Name : `Rate limit login attempts`
- Expression : `(http.request.uri.path eq "/login.html" and http.request.method eq "POST")`
- Action : **Rate limit** → 5 requests / 1 minute / IP → Block 10 minutes

### Règle 3 : Bot protection sur la page admin
- Name : `Challenge admin page`
- Expression : `(http.request.uri.path contains "admin-a2s00760")`
- Action : **Managed Challenge** (affiche un captcha aux bots)

---

## ÉTAPE 4 — Déployer les fichiers de sécurité

Placez ces fichiers à la **racine** de votre déploiement Cloudflare Pages :

| Fichier | Action |
|---------|--------|
| `_headers` | ✅ Copier tel quel à la racine |
| `_redirects` | ✅ Copier tel quel à la racine |
| `robots.txt` | ✅ Copier tel quel à la racine |
| `migration_supabase.sql` | ❌ **NE PAS déployer** — fichier local uniquement |

---

## ÉTAPE 5 — Vérifier les RLS Supabase

1. Supabase → votre projet → **Table Editor** → Table `listings`
2. Cliquez sur **"RLS"** (Row Level Security)
3. Vérifiez que ces politiques existent :

```sql
-- Lecture publique : seulement les annonces "live"
CREATE POLICY "Public read live listings"
ON public.listings FOR SELECT
USING (status = 'live');

-- Écriture : seulement l'utilisateur authentifié peut créer ses annonces
CREATE POLICY "Authenticated insert own listing"
ON public.listings FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Modification : seulement le propriétaire ou admin
CREATE POLICY "Owner or admin update"
ON public.listings FOR UPDATE
USING (
  seller_email = auth.jwt()->>'email'
  OR auth.jwt()->>'role' = 'service_role'
);

-- Suppression : admin seulement
CREATE POLICY "Admin delete"
ON public.listings FOR DELETE
USING (auth.jwt()->>'role' = 'service_role');
```

4. Faites **la même chose** pour la table `users`

---

## ÉTAPE 6 — Vérification finale

Testez depuis un navigateur privé (pas connecté) :
- [ ] `https://www.aircraft2sell.eu/admin-a2s00760.html` → doit demander auth Cloudflare Access
- [ ] `https://www.aircraft2sell.eu/diag.html` → doit demander auth Cloudflare Access  
- [ ] `https://www.aircraft2sell.eu/migration_supabase.sql` → doit retourner 403
- [ ] Headers : vérifiez sur https://securityheaders.com avec votre domaine

---

## Résumé des corrections appliquées dans le code

| Problème | Correction |
|----------|-----------|
| ❌ Mot de passe admin en clair | ✅ Supprimé — auth via Supabase Auth |
| ❌ Vérification auth côté client uniquement | ✅ Auth Supabase + vérification JWT |
| ❌ `sessionStorage` avec flag `'1'` contournable | ✅ Token JWT Supabase vérifié |
| ❌ Email admin pré-rempli au chargement | ✅ Supprimé |
| ❌ Pas d'anti-bruteforce | ✅ Blocage après 5 tentatives |
| ❌ XSS via innerHTML non-échappé | ✅ Fonction `esc()` sur toutes les données |
| ❌ `diag.html` accessible sans auth | ✅ Gate de sécurité obligatoire |
| ❌ Headers HTTP manquants | ✅ `_headers` avec CSP, HSTS, X-Frame |
| ❌ Pas de `robots.txt` | ✅ Fichiers sensibles exclus |
| ❌ `migration_supabase.sql` déployable | ✅ Bloqué par `_redirects` |

