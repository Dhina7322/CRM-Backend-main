const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmailOtp = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"OTP Service" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Registration OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verification Code</h2>
          <p>Your OTP for registration is: <strong style="font-size: 24px; color: #1694CE;">${otp}</strong></p>
          <p>This code is valid for 5 minutes.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Mailer Error:", error);
    throw error;
  }
};

module.exports = sendEmailOtp;
