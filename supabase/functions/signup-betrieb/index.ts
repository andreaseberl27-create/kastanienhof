import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Seed-Daten für neue Betriebe
async function seedDemoData(adminClient: ReturnType<typeof createClient>, betriebId: string) {
  // 1. Fruchtarten
  const { data: fruchtarten } = await adminClient.from('fruchtarten').insert([
    { betrieb_id: betriebId, name: 'Äpfel',      emoji: '🍎', farbe: '#e74c3c', sort_order: 1, aktiv: true },
    { betrieb_id: betriebId, name: 'Birnen',     emoji: '🍐', farbe: '#f39c12', sort_order: 2, aktiv: true },
    { betrieb_id: betriebId, name: 'Kirschen',   emoji: '🍒', farbe: '#c0392b', sort_order: 3, aktiv: true },
    { betrieb_id: betriebId, name: 'Erdbeeren',  emoji: '🍓', farbe: '#e91e8c', sort_order: 4, aktiv: true },
  ]).select('id, name');

  const aepfelId   = fruchtarten?.find(f => f.name === 'Äpfel')?.id;
  const birnenId   = fruchtarten?.find(f => f.name === 'Birnen')?.id;
  const kirschenId = fruchtarten?.find(f => f.name === 'Kirschen')?.id;

  // 2. Sorten (max. 5 – passt ins kostenlose Kontingent)
  await adminClient.from('sorten').insert([
    { betrieb_id: betriebId, name: 'Elstar',     fruchtart_id: aepfelId,   aktiv: true },
    { betrieb_id: betriebId, name: 'Gala',       fruchtart_id: aepfelId,   aktiv: true },
    { betrieb_id: betriebId, name: 'Williams',   fruchtart_id: birnenId,   aktiv: true },
    { betrieb_id: betriebId, name: 'Conference', fruchtart_id: birnenId,   aktiv: true },
    { betrieb_id: betriebId, name: 'Kordia',     fruchtart_id: kirschenId, aktiv: true },
  ]);

  // 3. Felder
  await adminClient.from('felder').insert([
    { betrieb_id: betriebId, name: 'Feld Nord',    fruchtart_id: aepfelId, aktiv: true },
    { betrieb_id: betriebId, name: 'Feld Süd',     fruchtart_id: aepfelId, aktiv: true },
    { betrieb_id: betriebId, name: 'Obstgarten',   fruchtart_id: birnenId, aktiv: true },
  ]);

  // 4. Qualitäten
  await adminClient.from('qualitaeten').insert([
    { betrieb_id: betriebId, code: 'K1',  label: 'Klasse I',   emoji: '⭐', sort_order: 1, aktiv: true },
    { betrieb_id: betriebId, code: 'K2',  label: 'Klasse II',  emoji: '✅', sort_order: 2, aktiv: true },
    { betrieb_id: betriebId, code: 'IND', label: 'Industrie',  emoji: '🏭', sort_order: 3, aktiv: true },
  ]);

  // 5. Gebinde
  await adminClient.from('gebinde').insert([
    { betrieb_id: betriebId, label: 'Steige 5 kg',         gewicht_kg: 5,   sort_order: 1, aktiv: true },
    { betrieb_id: betriebId, label: 'Holzkiste 20 kg',     gewicht_kg: 20,  sort_order: 2, aktiv: true },
    { betrieb_id: betriebId, label: 'Großbehälter 300 kg', gewicht_kg: 300, sort_order: 3, aktiv: true },
  ]);

  // 6. Pflücker
  await adminClient.from('pfluecker').insert([
    { betrieb_id: betriebId, vorname: 'Max',   nachname: 'Mustermann', mitarbeiter_nr: 1, aktiv: true },
    { betrieb_id: betriebId, vorname: 'Anna',  nachname: 'Beispiel',   mitarbeiter_nr: 2, aktiv: true },
    { betrieb_id: betriebId, vorname: 'Peter', nachname: 'Demo',       mitarbeiter_nr: 3, aktiv: true },
  ]);
}

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

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    // 1. Auth-User per Admin-API anlegen (User ist sofort in auth.users vorhanden)
    const { data: createData, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { betrieb_name: betriebName },
    });

    if (signUpError) {
      return Response.json({ error: signUpError.message }, { status: 400, headers: corsHeaders });
    }

    const userId = createData.user.id;

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

    // 4. FREE-Lizenz anlegen
    await adminClient.from('lizenzen').insert({ betrieb_id: betrieb.id, stufe: 'free' });

    // 5. Admin-Benachrichtigung (fire & forget)
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
      },
      body: JSON.stringify({
        subject: `[Ripelog] Neuer Betrieb: ${betriebName}`,
        html: `<p><strong>Betrieb:</strong> ${betriebName}</p><p><strong>E-Mail:</strong> ${email}</p>`,
      }),
    }).catch(() => {});

    // 7. Demo-Daten einfügen (Fehler hier nicht kritisch)
    await seedDemoData(adminClient, betrieb.id);

    // 8. Bestätigungsmail senden (resend schickt die Mail an den unbestätigten User)
    await anonClient.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: Deno.env.get('APP_URL') + '/admin.html' },
    });

    return Response.json({
      ok: true,
      message: 'Betrieb angelegt. Bitte E-Mail bestätigen.',
    }, { headers: corsHeaders });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: 'Interner Fehler: ' + msg }, { status: 500, headers: corsHeaders });
  }
});
