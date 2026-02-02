import nodemailer from "nodemailer";
import envConfig from "../configs/config.sequelize.js";

export class EmailServices {
  static transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: envConfig.email.admin,
      pass: envConfig.email.appPassword,
    },
    logger: true,
    debug: true,
    // Relax TLS to skip self-signed cert errors (for dev behind proxy). Remove in production.
    tls: {
      rejectUnauthorized: false,
    },
  });

  /**
   * @param {string} userEmail
   * @param {string} url
   */
  static async sendVerifyEmail(userEmail, verifyUrl) {
    const mailOptions = {
      from: `🛍️ TechShop <${envConfig.email.admin}>`,
      to: userEmail,
      subject: "Verify your email address – TechShop",
      html: `
      <div style="
        max-width: 600px;
        margin: 0 auto;
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
        background-color: #f4f6fb;
        padding: 24px;
      ">

        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #4f46e5, #9333ea);
          border-radius: 12px;
          padding: 32px;
          color: #ffffff;
          text-align: center;
        ">
          <h1 style="margin: 0; font-size: 28px;">Welcome to TechShop 🎉</h1>
          <p style="margin-top: 12px; font-size: 16px;">
            One last step to get started
          </p>
        </div>

        <!-- Content -->
        <div style="
          background: #ffffff;
          border-radius: 12px;
          padding: 32px;
          margin-top: 24px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        ">
          <h2 style="margin-top: 0; color: #222;">Verify your email address</h2>

          <p style="font-size: 15px; color: #444;">
            Thanks for signing up for <b>TechShop</b>!  
            Please confirm your email address by clicking the button below.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a
              href="${verifyUrl}"
              style="
                display: inline-block;
                padding: 14px 28px;
                background: #4f46e5;
                color: #ffffff;
                text-decoration: none;
                font-size: 16px;
                font-weight: 600;
                border-radius: 8px;
              "
              target="_blank"
            >
              Verify Email
            </a>
          </div>

          <!-- Fallback link -->
          <p style="font-size: 14px; color: #666;">
            If the button doesn’t work, copy and paste this link into your browser:
          </p>

          <p style="
            font-size: 13px;
            color: #4f46e5;
            word-break: break-all;
          ">
            ${verifyUrl}
          </p>

          <p style="font-size: 14px; color: #666; margin-top: 24px;">
            ⏰ This link will <b>expire in 10 minutes</b>.
            <br />
            If you didn’t create a TechShop account, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="
          text-align: center;
          margin-top: 24px;
          font-size: 12px;
          color: #888;
        ">
          <p>© ${new Date().getFullYear()} TechShop. All rights reserved.</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>

      </div>
    `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("sendVerifyEmail info:", info.messageId, info.response);
      return true;
    } catch (error) {
      console.error("sendVerifyEmail error:", error);
      return false;
    }
  }

  static async sendPasswordResetOTP(userEmail, otp) {
    const mailOptions = {
      from: `TechShop <${envConfig.email.admin}>`,
      to: userEmail,
      subject: "Your password reset code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #f7f8fb;">
          <h2 style="color: #111; margin-bottom: 8px;">Password reset requested</h2>
          <p style="color: #444;">Use the one-time code below to reset your password. The code expires in 5 minutes.</p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; padding: 14px 24px; background: #111827; color: #fff; font-size: 24px; letter-spacing: 4px; border-radius: 8px; font-weight: 700;">
              ${otp}
            </div>
          </div>
          <p style="color: #666; font-size: 14px;">If you didn’t request this, you can ignore this email.</p>
        </div>
      `,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("sendPasswordResetOTP:", info.messageId);
      return true;
    } catch (error) {
      console.error("sendVerifyEmail error:", error);
      return false;
    }
  }
}
