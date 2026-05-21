const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendPasswordResetEmail(toEmail, resetToken) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"NCCU DARS 系統" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "【NCCU DARS】密碼重設通知",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#071f3f;margin-bottom:8px;">密碼重設</h2>
        <p style="color:#475569;">我們收到您的密碼重設請求。請點擊下方按鈕完成重設：</p>
        <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#071f3f;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
          重設密碼
        </a>
        <p style="color:#94a3b8;font-size:13px;">此連結將於 1 小時後失效。若您沒有發出此請求，請忽略此信件。</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;">國立政治大學 應用數學系畢業審核系統</p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
