import { getCloudflareContext } from '@opennextjs/cloudflare';

async function getEnv() {
  const ctx = await getCloudflareContext({ async: true });
  return ctx?.env || {};
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendEmailResend({ apiKey, from, to, subject, text, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend error ${res.status}: ${body || 'request failed'}`);
  }
}

async function sendSmsTwilio({ accountSid, authToken, from, to, body }) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = btoa(`${accountSid}:${authToken}`);

  const payload = new URLSearchParams();
  payload.set('From', from);
  payload.set('To', to);
  payload.set('Body', body);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: payload.toString()
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Twilio error ${res.status}: ${text || 'request failed'}`);
  }
}

export async function sendForumReplyOutbound({
  requestUrl,
  recipient,
  actorUsername,
  threadTitle,
  threadId,
  replyBody
}) {
  // Best-effort outbound send. Failures should not break posting.
  const env = await getEnv();

  const baseUrl = String(env.SITE_URL || new URL(requestUrl).origin);
  const link = `${baseUrl}/lobby/${encodeURIComponent(threadId)}`;
  const subject = `New reply from ${actorUsername}: ${threadTitle}`;
  const smsText = `New reply from ${actorUsername}: ${threadTitle}\n${link}`;

  const safeTitle = escapeHtml(threadTitle);
  const safeActor = escapeHtml(actorUsername);
  const safeSnippet = escapeHtml(String(replyBody || '').slice(0, 240));

  const emailText = `New reply from ${actorUsername} on "${threadTitle}".\n\nView it here: ${link}`;
  const emailHtml = `<p><strong>New reply from ${safeActor}</strong> on <strong>${safeTitle}</strong>.</p>
<p>${safeSnippet ? `${safeSnippet}…` : ''}</p>
<p><a href="${escapeHtml(link)}">Open the thread</a></p>`;

  const jobs = [];

  if (recipient?.notify_email_enabled && recipient?.email && env.RESEND_API_KEY && env.EMAIL_FROM) {
    jobs.push(
      sendEmailResend({
        apiKey: env.RESEND_API_KEY,
        from: env.EMAIL_FROM,
        to: recipient.email,
        subject,
        text: emailText,
        html: emailHtml
      }).catch(() => null)
    );
  }

  if (
    recipient?.notify_sms_enabled &&
    recipient?.phone &&
    env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    env.TWILIO_FROM_NUMBER
  ) {
    jobs.push(
      sendSmsTwilio({
        accountSid: env.TWILIO_ACCOUNT_SID,
        authToken: env.TWILIO_AUTH_TOKEN,
        from: env.TWILIO_FROM_NUMBER,
        to: recipient.phone,
        body: smsText
      }).catch(() => null)
    );
  }

  if (!jobs.length) return;
  await Promise.all(jobs);
}

