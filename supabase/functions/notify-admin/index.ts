import { SMTPClient } from 'denomailer/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { subject, html, text } = await req.json();

    if (!subject || (!html && !text)) {
      return Response.json({ error: 'subject und html oder text erforderlich.' }, { status: 400, headers: corsHeaders });
    }

    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST')!,
        port: 465,
        tls: true,
        auth: {
          username: Deno.env.get('SMTP_USER')!,
          password: Deno.env.get('SMTP_PASS')!,
        },
      },
    });

    try {
      await client.send({
        from: Deno.env.get('SMTP_FROM')!,
        to: Deno.env.get('NOTIFY_TO')!,
        subject,
        content: text ?? '',
        html: html ?? '',
      });
    } catch (sendErr: unknown) {
      const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
      // denomailer wirft BadResource/connection not recoverable beim Verbindungsabbau,
      // obwohl die Mail bereits gesendet wurde – diese Fehler ignorieren
      if (!msg.includes('BadResource') && !msg.includes('connection not recoverable')) {
        throw sendErr;
      }
      console.log('notify-admin: mail sent, ignoring close error:', msg);
    }
    try { await client.close(); } catch { /* ignorieren */ }

    return Response.json({ ok: true }, { headers: corsHeaders });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('notify-admin error:', msg);
    return Response.json({ error: msg }, { status: 500, headers: corsHeaders });
  }
});
