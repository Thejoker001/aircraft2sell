import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { firstName, lastName, email, subject, message } = await req.json()

    const BREVO_KEY = Deno.env.get('BREVO_API_KEY')
    console.log('BREVO_KEY présente:', !!BREVO_KEY)
    console.log('BREVO_KEY début:', BREVO_KEY ? BREVO_KEY.slice(0, 15) + '...' : 'NULL')

    if (!BREVO_KEY) {
      return new Response(JSON.stringify({ error: 'BREVO_API_KEY manquante' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const brevoPayload = {
      sender: { name: 'Aircraft2Sell', email: 'contact@aircraft2sell.eu' },
      to: [{ email: 'contact@aircraft2sell.eu' }],
      replyTo: { email: email || 'contact@aircraft2sell.eu' },
      subject: `[Contact A2S] ${firstName} ${lastName || ''} — ${subject || 'Message'}`,
      htmlContent: `<p><b>De:</b> ${firstName} ${lastName || ''} (${email})</p><p><b>Sujet:</b> ${subject}</p><p><b>Message:</b></p><p>${message}</p>`
    }

    console.log('Envoi vers Brevo...')
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(brevoPayload)
    })

    const brevoData = await brevoRes.json()
    console.log('Brevo status:', brevoRes.status)
    console.log('Brevo response:', JSON.stringify(brevoData))

    if (!brevoRes.ok) {
      return new Response(JSON.stringify({ error: 'Brevo error', detail: brevoData }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ ok: true, messageId: brevoData.messageId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Erreur:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
