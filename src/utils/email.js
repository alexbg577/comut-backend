import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Comut <onboarding@resend.dev>';
const BASE = process.env.BASE_URL;

export const sendVerificationEmail = async (email, token) => {
  const url = `${BASE}/api/auth/verify-email/${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: '✅ Vérifiez votre email — Comut',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(99,102,241,0.1)">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px">Comut</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0">Partagez avec vos proches</p>
        </div>
        <div style="padding:40px">
          <h2 style="color:#1f2937;margin:0 0 16px">Bienvenue sur Comut ! 🎉</h2>
          <p style="color:#6b7280;line-height:1.6">Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px">Vérifier mon email</a>
          </div>
          <p style="color:#9ca3af;font-size:13px;text-align:center">Ce lien expire dans 24h. Si vous n'avez pas créé de compte, ignorez cet email.</p>
        </div>
      </div>
    `
  });
};

export const sendPasswordResetEmail = async (email, token) => {
  const url = `${BASE}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: '🔑 Réinitialisation de mot de passe — Comut',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(99,102,241,0.1)">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px">Comut</h1>
        </div>
        <div style="padding:40px">
          <h2 style="color:#1f2937;margin:0 0 16px">Réinitialisation du mot de passe</h2>
          <p style="color:#6b7280;line-height:1.6">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez ci-dessous pour en créer un nouveau.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px">Réinitialiser mon mot de passe</a>
          </div>
          <p style="color:#9ca3af;font-size:13px;text-align:center">Ce lien expire dans 1h. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        </div>
      </div>
    `
  });
};
