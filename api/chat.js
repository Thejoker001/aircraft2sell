/**
 * api/chat.js — Agent IA conversationnel (second niveau de l'assistant).
 *
 * Le moteur principal reste assistant.js (recherche locale dans faq-data.js,
 * 0 appel réseau, 0 coût) : il gère la majorité des questions courantes.
 * Cette fonction ne prend le relais QUE lorsque la recherche locale échoue
 * (score sous le seuil), pour une conversation plus ouverte tout en restant
 * ancrée sur le contenu réel de la FAQ (pas d'invention sur les sujets
 * sensibles : prix, transactions, litiges).
 *
 * Fournisseur : Groq (plan gratuit, aucune carte bancaire — voir
 * console.groq.com). Modèle qwen/qwen3.8-27b : rapide, pas de champ
 * "reasoning" à filtrer, bonnes réponses en français.
 *
 *   POST /api/chat   { message: string, lang: 'fr'|'en', history?: [...] }
 *
 * Variables d'environnement Vercel requises :
 *   GROQ_API_KEY   clé API Groq (jamais exposée au navigateur)
 */
import { preambule } from './_lib.js';
import { FAQ_CONTEXT } from './_faq-context.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'qwen/qwen3.8-27b';

/* Longueur maximale acceptée côté visiteur : évite l'abus du quota gratuit
   Groq (14 400 requêtes/jour, partagées par tout le site). */
const MAX_MSG_LEN = 500;
const MAX_HISTORY = 6; /* derniers échanges seulement, pas tout l'historique */

function systemPrompt(lang) {
  const ctx = FAQ_CONTEXT[lang] || FAQ_CONTEXT.fr;
  if (lang === 'en') {
    return `You are the assistant for Aircraft2Sell, a European aviation marketplace ` +
      `(zero commission, listings for light aircraft, business jets, turboprops, ` +
      `helicopters, ULMs, airliners).

Answer ONLY using the facts below (the site's official FAQ). If the question is not ` +
      `covered by these facts, or concerns a specific transaction, price negotiation, ` +
      `legal/safety liability, or personal account data, say clearly you don't know and ` +
      `invite the visitor to email contact@aircraft2sell.eu — NEVER invent an answer.

Keep answers short (2-4 sentences), factual, no marketing tone. Reply in English.

=== OFFICIAL FAQ ===
${ctx}
=== END FAQ ===`;
  }
  return `Tu es l'assistant du site Aircraft2Sell, une marketplace aéronautique ` +
    `européenne (zéro commission, annonces d'avions légers, jets d'affaires, ` +
    `turbopropulseurs, hélicoptères, ULM, avions de ligne).

Réponds UNIQUEMENT à partir des faits ci-dessous (la FAQ officielle du site). Si la ` +
    `question n'est pas couverte par ces faits, ou concerne une transaction précise, une ` +
    `négociation de prix, une responsabilité légale/sécurité, ou des données de compte ` +
    `personnelles, dis clairement que tu ne sais pas et invite le visiteur à écrire à ` +
    `contact@aircraft2sell.eu — N'INVENTE JAMAIS de réponse.

Réponses courtes (2 à 4 phrases), factuelles, sans ton commercial. Réponds en français.

=== FAQ OFFICIELLE ===
${ctx}
=== FIN FAQ ===`;
}

export default async function handler(req, res) {
  if (preambule(req, res)) return;

  const cle = process.env.GROQ_API_KEY;
  if (!cle) return res.status(503).json({ error: 'GROQ_API_KEY absente' });

  const body = req.body || {};

  const message = String(body.message || '').trim();
  if (!message) return res.status(400).json({ error: 'message requis' });
  if (message.length > MAX_MSG_LEN) {
    return res.status(400).json({ error: `message trop long (max ${MAX_MSG_LEN} caractères)` });
  }

  let lang = String(body.lang || 'fr').slice(0, 2).toLowerCase();
  if (lang !== 'en') lang = 'fr';

  /* Historique : limité, et uniquement role/content (pas de champ arbitraire
     transmis par le client vers l'API Groq). */
  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];
  const messages = [{ role: 'system', content: systemPrompt(lang) }];
  for (const h of history) {
    const role = h && h.role === 'assistant' ? 'assistant' : 'user';
    const content = String((h && h.content) || '').slice(0, MAX_MSG_LEN);
    if (content) messages.push({ role, content });
  }
  messages.push({ role: 'user', content: message });

  try {
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 300,
        temperature: 0.3,
      }),
    });
    const txt = await r.text();
    if (!r.ok) {
      /* Quota gratuit dépassé ou erreur Groq : échec silencieux côté site,
         le front doit retomber sur le message de contact humain. */
      return res.status(503).json({ error: `Groq ${r.status} : ${txt.slice(0, 200)}` });
    }
    let data;
    try { data = JSON.parse(txt); } catch { return res.status(502).json({ error: 'Réponse Groq invalide' }); }
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: 'Réponse Groq vide' });
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(503).json({ error: e.message });
  }
}
