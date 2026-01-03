const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.initialized = true;
      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
    }
  }

  async sendMail({ to, subject, html, text }) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.transporter) {
      console.error('Email transporter not available');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text,
      });
      console.log('📧 Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
      return false;
    }
  }

  async sendPasswordResetEmail(email, resetToken, userName) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 EcoFarmLogix</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${userName || 'User'},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy this link: <br><small>${resetUrl}</small></p>
            <p>This link will expire in <strong>1 hour</strong>.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EcoFarmLogix. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request

      Hello ${userName || 'User'},

      We received a request to reset your password. Visit this link to create a new password:
      ${resetUrl}

      This link will expire in 1 hour.

      If you didn't request this, please ignore this email.
    `;

    return this.sendMail({
      to: email,
      subject: 'Reset Your EcoFarmLogix Password',
      html,
      text,
    });
  }

  async sendAlertEmail(email, alertData) {
    const { farmName, sensorName, value, threshold, condition, userName } = alertData;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Sensor Alert</h1>
          </div>
          <div class="content">
            <h2>Alert from ${farmName}</h2>
            <p>Hello ${userName || 'User'},</p>
            <div class="alert-box">
              <p><strong>Sensor:</strong> ${sensorName}</p>
              <p><strong>Current Value:</strong> ${value}</p>
              <p><strong>Threshold:</strong> ${threshold}</p>
              <p><strong>Condition:</strong> Value is ${condition} threshold</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>Please check your farm dashboard for more details.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} EcoFarmLogix. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: email,
      subject: `🚨 Alert: ${sensorName} - ${farmName}`,
      html,
    });
  }
}

module.exports = new EmailService();
