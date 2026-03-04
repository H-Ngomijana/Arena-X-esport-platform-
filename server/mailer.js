import nodemailer from "nodemailer";

const SMTP_HOST = (process.env.SMTP_HOST || "").trim();
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const SMTP_USER = (process.env.SMTP_USER || "").trim();
const SMTP_PASS = (process.env.SMTP_PASS || "").trim();
const SMTP_FROM = (process.env.SMTP_FROM || SMTP_USER || "no-reply@arenax.gg").trim();

const mailerEnabled = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

const transporter = mailerEnabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  : null;

export async function sendPasswordResetEmail({ to, resetUrl }) {
  if (!mailerEnabled || !transporter) {
    console.log(`[auth] SMTP not configured. Password reset link for ${to}: ${resetUrl}`);
    return { sent: false, skipped: true };
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: "Reset Your Arena X Password",
    html: `
      <p>We received a request to reset your Arena X password.</p>
      <p>Click the link below to reset it:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });

  return { sent: true };
}

