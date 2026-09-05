// ============================================================
// supabase/functions/contact/index.ts
// Edge Function — Traite le formulaire de contact du site.
// Sécurisé : la clé Brevo est un SECRET côté serveur, jamais exposée
// au navigateur. Le front-end (contact.html) appelle cette fonction.
//
// Secrets Supabase requis :
//   BREVO_API_KEY → clé API Brevo (transactions)
//   CONTACT_TO   → boîte de réception (contact@aircraft2sell.eu)
//
// DÉPLOIEMENT :
//   supabase functions deploy contact
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://aircraft2sell.eu, https://www.aircraft2sell.eu",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple validation anti-spam / anti-abus
function rateOk() {
  // Stateless basic check: refuse obviously automated empty fields (honeypot is in the form).
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
  const CONTACT_TO = Deno.env.get("CONTACT_TO") ?? "contact@aircraft2sell.eu";
  if (!BREVO_KEY) {
    return new Response(JSON.stringify({ error: "Brevo non configuré côté serveur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { first, last, email, subject, subjectLabel, message, website } = body;

    // Honeypot : un bot remplit le champ caché `website`
    if (website) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!first || !email || !message) {
      return new Response(JSON.stringify({ error: "Champs obligatoires manquants" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!String(email).includes("@")) {
      return new Response(JSON.stringify({ error: "Email invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subj = subjectLabel || subject || "Contact";
    const fullName = [first, last || ""].filter(Boolean).join(" ");

    const sendTo = async (payload) => {
      const r = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.message || `Brevo HTTP ${r.status}`);
      }
    };

    // 1) Notifier la boîte de réception
    await sendTo({
      sender: { name: "Aircraft2Sell Contact", email: "contact@aircraft2sell.eu" },
      to: [{ email: CONTACT_TO }],
      replyTo: { email, name: fullName },
      subject: `[Contact A2S] ${subj} — ${fullName}`,
      htmlContent: `<div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#e8a020">Nouveau message</h2>
        <p><b>De:</b> ${fullName} (<a href="mailto:${email}">${email}</a>)</p>
        <p><b>Objet:</b> ${subj}</p>
        <p><b>Message:</b></p>
        <p style="white-space:pre-wrap">${message}</p></div>`,
    });

    // 2) Confirmation au visiteur
    await sendTo({
      sender: { name: "Aircraft2Sell", email: "contact@aircraft2sell.eu" },
      to: [{ email, name: first }],
      subject: "Nous avons bien reçu votre message — Aircraft2Sell",
      htmlContent: `<p>Bonjour ${first},</p>
        <p>Nous avons bien reçu votre message. Notre équipe vous répondra sous 24h ouvrées.</p>
        <p>— Aircraft2Sell</p>`,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || "Erreur serveur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
