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
    const { betriebName, subdomain, email, password } = await req.json();

    // Eingaben validieren
    if (!betriebName || !subdomain || !email || !password) {
      return Response.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400, headers: corsHeaders });
    }
    if (!/^[a-z0-9-]{2,30}$/.test(subdomain)) {
      return Response.json({ error: 'Subdomain: nur Kleinbuchstaben, Zahlen und Bindestriche (2–30 Zeichen).' }, { status: 400, headers: corsHeaders });
    }
    if (password.length < 8) {
      return Response.json({ error: 'Passwort muss mindestens 8 Zeichen haben.' }, { status: 400, headers: corsHeaders });
    }

    // Admin-Client mit service_role (darf Auth-User anlegen)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Subdomain auf Verfügbarkeit prüfen
    const { data: existing } = await supabase
      .from('betriebe')
      .select('id')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (existing) {
      return Response.json({ error: 'Diese Subdomain ist bereits vergeben.' }, { status: 409, headers: corsHeaders });
    }

    // 2. Auth-User anlegen
    const loginEmail = `admin@${subdomain}.ripelog.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: loginEmail,
      password,
      email_confirm: false, // Bestätigungsmail wird gesendet
      user_metadata: { betrieb_name: betriebName, subdomain },
    });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400, headers: corsHeaders });
    }

    const userId = authData.user.id;

    // 3. Betrieb anlegen
    const { data: betrieb, error: betriebError } = await supabase
      .from('betriebe')
      .insert({ name: betriebName, subdomain })
      .select('id')
      .single();

    if (betriebError) {
      // Rollback: Auth-User wieder löschen
      await supabase.auth.admin.deleteUser(userId);
      return Response.json({ error: betriebError.message }, { status: 500, headers: corsHeaders });
    }

    // 4. betrieb_mitglieder-Eintrag (Admin-Rolle)
    const { error: memberError } = await supabase
      .from('betrieb_mitglieder')
      .insert({ betrieb_id: betrieb.id, user_id: userId, rolle: 'admin', username: 'admin' });

    if (memberError) {
      // Rollback
      await supabase.from('betriebe').delete().eq('id', betrieb.id);
      await supabase.auth.admin.deleteUser(userId);
      return Response.json({ error: memberError.message }, { status: 500, headers: corsHeaders });
    }

    return Response.json({
      success: true,
      subdomain,
      loginEmail,
      message: 'Betrieb angelegt. Bitte E-Mail bestätigen.',
    }, { headers: corsHeaders });

  } catch (err) {
    return Response.json({ error: 'Interner Fehler: ' + err.message }, { status: 500, headers: corsHeaders });
  }
});
