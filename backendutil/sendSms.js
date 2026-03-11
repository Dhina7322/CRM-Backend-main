const nodemailer = require("nodemailer");

// Create the transporter using environment variables
// For Gmail: EMAIL_USER and EMAIL_PASS (App Password)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mailer Connection Error:", error.message);
  } else {
    console.log("✅ Mailer is ready to send emails");
  }
});

/**
 * Sends an OTP email to the specified recipient.
 * @param {string} email - Recipient email address
 * @param {string} otp - The 6-digit OTP code
 */
const sendEmailOtp = async (email, otp) => {
  const mailOptions = {
    from: `"Madhura CRM Account Service" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Registration OTP: ${otp}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #1694CE; text-align: center;">Verification Code</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">Your One-Time Password (OTP) for registration is:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <strong style="font-size: 32px; color: #1694CE; letter-spacing: 5px;">${otp}</strong>
        </div>
        <p style="font-size: 14px; color: #666;">This code is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">&copy; ${new Date().getFullYear()} Madhura CRM. All rights reserved.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Mailer Error:", error);
    const mailError = new Error("Failed to send OTP email");
    mailError.name = "EmailError";
    throw mailError;
  }
};

module.exports = sendEmailOtp;
