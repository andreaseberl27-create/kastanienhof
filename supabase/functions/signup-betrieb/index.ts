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
    const { betriebName, email, password } = await req.json();

    if (!betriebName || !email || !password) {
      return Response.json({ error: 'Alle Felder sind erforderlich.' }, { status: 400, headers: corsHeaders });
    }
    if (!email.includes('@')) {
      return Response.json({ error: 'Bitte eine gültige E-Mail eingeben.' }, { status: 400, headers: corsHeaders });
    }
    if (password.length < 8) {
      return Response.json({ error: 'Passwort muss mindestens 8 Zeichen haben.' }, { status: 400, headers: corsHeaders });
    }

    // Anon-Client für Signup (löst Bestätigungsmail aus)
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    // Service-Role-Client für DB-Operationen
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Auth-User anlegen via signUp → sendet Bestätigungs-E-Mail
    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://ripelog.com/ernte-app.html',
        data: { betrieb_name: betriebName },
      },
    });

    if (signUpError) {
      return Response.json({ error: signUpError.message }, { status: 400, headers: corsHeaders });
    }

    const userId = signUpData.user!.id;

    // 2. Betrieb anlegen
    const { data: betrieb, error: betriebError } = await adminClient
      .from('betriebe')
      .insert({ name: betriebName })
      .select('id')
      .single();

    if (betriebError) {
      await adminClient.auth.admin.deleteUser(userId);
      return Response.json({ error: betriebError.message }, { status: 500, headers: corsHeaders });
    }

    // 3. betrieb_mitglieder-Eintrag (Admin-Rolle)
    const { error: memberError } = await adminClient
      .from('betrieb_mitglieder')
      .insert({ betrieb_id: betrieb.id, user_id: userId, rolle: 'admin', username: email });

    if (memberError) {
      await adminClient.from('betriebe').delete().eq('id', betrieb.id);
      await adminClient.auth.admin.deleteUser(userId);
      return Response.json({ error: memberError.message }, { status: 500, headers: corsHeaders });
    }

    return Response.json({
      ok: true,
      message: 'Betrieb angelegt. Bitte E-Mail bestätigen.',
    }, { headers: corsHeaders });

  } catch (err) {
    return Response.json({ error: 'Interner Fehler: ' + err.message }, { status: 500, headers: corsHeaders });
  }
});
