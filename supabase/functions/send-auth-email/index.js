import { Resend } from 'npm:resend@4';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const SUPABASE_URL = 'https://txqrvdnurrkyishcbtcx.supabase.co';
const FROM = 'Groene Vingers <onboarding@resend.dev>';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { user, email_data } = payload;
  if (!user?.email || !email_data?.token_hash) {
    return new Response('Invalid payload', { status: 400 });
  }

  const { token_hash, redirect_to, email_action_type } = email_data;
  const redirectParam = redirect_to ? `&redirect_to=${encodeURIComponent(redirect_to)}` : '';
  const confirmUrl = `${SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}${redirectParam}`;

  const templates = {
    signup: {
      subject: 'Bevestig je e-mailadres – Groene Vingers',
      html: signupHtml(user, confirmUrl),
    },
    recovery: {
      subject: 'Wachtwoord opnieuw instellen – Groene Vingers',
      html: recoveryHtml(confirmUrl),
    },
    email_change: {
      subject: 'Bevestig je nieuw e-mailadres – Groene Vingers',
      html: emailChangeHtml(confirmUrl),
    },
  };

  const template = templates[email_action_type] ?? {
    subject: 'Actie vereist – Groene Vingers',
    html: genericHtml(confirmUrl),
  };

  const { error } = await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: template.subject,
    html: template.html,
  });

  if (error) {
    console.error('Resend send failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`Email sent (${email_action_type}) to ${user.email}`);
  return new Response(JSON.stringify({ sent: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

function wrapHtml(body) {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f0; margin: 0; padding: 40px 0; }
  .card { background: #fff; max-width: 520px; margin: 0 auto; border-radius: 12px; padding: 40px; }
  h1 { font-size: 22px; color: #1a1a1a; margin: 0 0 12px; }
  p { color: #555; line-height: 1.6; margin: 0 0 24px; }
  a.btn { display: inline-block; background: #3d7a4f; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; }
  .footer { margin-top: 32px; font-size: 12px; color: #999; }
</style>
</head>
<body>
<div class="card">
${body}
<div class="footer">Groene Vingers &bull; Dit is een automatisch bericht.</div>
</div>
</body>
</html>`;
}

function signupHtml(user, url) {
  const name = user.user_metadata?.first_name || 'daar';
  return wrapHtml(`
    <h1>Welkom bij Groene Vingers, ${name}!</h1>
    <p>Bedankt voor je registratie. Klik op de knop hieronder om je e-mailadres te bevestigen en aan de slag te gaan.</p>
    <a class="btn" href="${url}">E-mailadres bevestigen</a>
    <p style="margin-top:24px;font-size:13px;color:#999;">Als je je niet hebt geregistreerd bij Groene Vingers, kan je deze mail negeren.</p>
  `);
}

function recoveryHtml(url) {
  return wrapHtml(`
    <h1>Wachtwoord opnieuw instellen</h1>
    <p>We hebben een aanvraag ontvangen om je wachtwoord opnieuw in te stellen. Klik op de knop hieronder om een nieuw wachtwoord in te stellen.</p>
    <a class="btn" href="${url}">Wachtwoord opnieuw instellen</a>
    <p style="margin-top:24px;font-size:13px;color:#999;">Als je dit niet hebt aangevraagd, kan je deze mail negeren. Je wachtwoord blijft ongewijzigd.</p>
  `);
}

function emailChangeHtml(url) {
  return wrapHtml(`
    <h1>Bevestig je nieuw e-mailadres</h1>
    <p>Klik op de knop hieronder om je nieuw e-mailadres te bevestigen.</p>
    <a class="btn" href="${url}">E-mailadres bevestigen</a>
  `);
}

function genericHtml(url) {
  return wrapHtml(`
    <h1>Actie vereist</h1>
    <p>Klik op de knop hieronder om verder te gaan.</p>
    <a class="btn" href="${url}">Doorgaan</a>
  `);
}
