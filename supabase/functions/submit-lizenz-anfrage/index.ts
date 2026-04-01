import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { betrieb_id, betrieb_name, kontakt_name, kontakt_email, nachricht } = await req.json();

    if (!betrieb_id || !kontakt_email) {
      return Response.json({ error: 'betrieb_id und kontakt_email sind erforderlich.' }, { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Anfrage in DB speichern
    const { error: dbError } = await adminClient.from('lizenz_anfragen').insert({
      betrieb_id,
      betrieb_name:      betrieb_name || null,
      kontakt_email,
      kontakt_name:      kontakt_name || null,
      gewuenschte_stufe: 'pro',
      nachricht:         nachricht || null,
    });

    if (dbError) {
      return Response.json({ error: dbError.message }, { status: 500, headers: corsHeaders });
    }

    // 2. Admin benachrichtigen (awaited – fire-and-forget würde von Deno abgebrochen)
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': Deno.env.get('SUPABASE_ANON_KEY')! },
      body: JSON.stringify({
        subject: `[Ripelog] PRO-Anfrage von ${betrieb_name || kontakt_email}`,
        html: `<p><strong>Betrieb:</strong> ${betrieb_name || '–'}</p>
               <p><strong>Name:</strong> ${kontakt_name || '–'}</p>
               <p><strong>E-Mail:</strong> ${kontakt_email}</p>
               <p><strong>Nachricht:</strong> ${nachricht || '–'}</p>`,
      }),
    }).catch(() => {});

    return Response.json({ ok: true }, { headers: corsHeaders });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: 'Interner Fehler: ' + msg }, { status: 500, headers: corsHeaders });
  }
});
