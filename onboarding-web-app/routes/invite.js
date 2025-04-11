// routes/invite.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');

const upload = multer(); // No storage is specified; we only need to parse text fields.

// In-memory storage for demonstration; replace with a persistent store as needed.
const invitationStore = {}; // { email: { code: '123456', expiresAt: Date } }

router.post('/', upload.none(), async (req, res) => {
  const { email, name, company, phone, location, about } = req.body;

  // Require email and name.
  if (!email || !name) {
    return res.status(400).json({ success: false, error: 'Email and name are required.' });
  }

  // Generate a random 6-digit code.
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // Set expiration for 24 hours from now.
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  // Save code and expiration in your store (or database).
  invitationStore[email] = { code, expiresAt };

  // Prepare fallback/default values for optional fields.
  // Note: You may adjust these default values as desired.
  const _company = company || "TechPinnacle Solutions";
  const _phone = phone || "(202) 555-0126";
  const _location = location || "San Francisco, CA";
  const _description = about || "A long-standing customer with a passion for technology.";
  // Default avatar image URL using your frontend base URL.
  const frontendUrl = process.env.FRONTEND_URL || 'https://vbi-dev.cloudstrucc.com';
  const _avatar = `${frontendUrl}/assets/img/photos/photo-6.jpg`;

  // Construct the invitation link with query parameters.
  const inviteLink = `${frontendUrl}/redeem-invitation?redeem=true&` +
    `name=${encodeURIComponent(name)}` +
    `&company=${encodeURIComponent(_company)}` +
    `&phone=${encodeURIComponent(_phone)}` +
    `&location=${encodeURIComponent(_location)}` +
    `&description=${encodeURIComponent(_description)}` +
    `&avatar=${encodeURIComponent(_avatar)}` +
    `&code=${encodeURIComponent(code)}`;

  const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false, // STARTTLS is used.
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY      
    },
  });

  const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Vanguard Invitation</title>
  <style>
    /* Base styles with Vanguard colors */
    :root {
      --vanguard-dark-blue: #0e1d33;
      --vanguard-accent-blue: #2659ab;
      --vanguard-light-blue: #3a7bd5;
      --vanguard-text-light: #ffffff;
      --vanguard-text-secondary: #cbd5e1;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', Arial, sans-serif;
      background-color: #f4f7fa;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .email-header {
      background-color: var(--vanguard-dark-blue);
      padding: 24px;
      text-align: center;
      border-bottom: 4px solid var(--vanguard-accent-blue);
    }
    
    .logo {
      max-width: 180px;
      margin-bottom: 10px;
    }
    
    .email-body {
      padding: 32px 24px;
      color: #334155;
      line-height: 1.6;
    }
    
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #1e293b;
    }
    
    .section-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--vanguard-dark-blue);
      margin-bottom: 16px;
    }
    
    .code-container {
      background-color: #f1f5f9;
      border-radius: 6px;
      padding: 18px;
      margin: 24px 0;
      text-align: center;
      border-left: 4px solid var(--vanguard-accent-blue);
    }
    
    .code {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--vanguard-dark-blue);
      margin: 0;
    }
    
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    
    .button {
      display: inline-block;
      background-color: var(--vanguard-accent-blue);
      color: white !important;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    
    .button:hover {
      background-color: var(--vanguard-light-blue);
    }
    
    .expiry-note {
      font-size: 15px;
      color: #64748b;
      text-align: center;
      margin: 20px 0;
    }
    
    .signature {
      margin-top: 32px;
    }
    
    .signature-name {
      font-weight: 600;
      color: #1e293b;
    }
    
    .email-footer {
      background-color: #f8fafc;
      padding: 20px 24px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    
    .disclaimer {
      margin-top: 16px;
      font-size: 12px;
      color: #94a3b8;
    }
    
    .social-links {
      margin-top: 20px;
    }
    
    .social-link {
      display: inline-block;
      margin: 0 8px;
      color: var(--vanguard-accent-blue) !important;
      text-decoration: none;
    }
    
    @media only screen and (max-width: 480px) {
      .email-body {
        padding: 24px 16px;
      }
      
      .email-header {
        padding: 16px;
      }
      
      .code {
        font-size: 24px;
      }
      
      .button {
        padding: 10px 24px;
        font-size: 15px;
        display: block;
        margin: 0 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="https://vbi-dev.cloudstrucc.com/assets/img/logos/logo.png" alt="Vanguard Identity" class="logo">
    </div>
    
    <div class="email-body">
      <p class="greeting">Hi ${name},</p>
      
      <p class="section-title">Your Invitation to Vanguard Identity</p>
      
      <p>You've been invited to join Vanguard Identity, where you can manage your secure, self-sovereign identity credentials.</p>
      
      <div class="code-container">
        <p style="margin-bottom: 8px; color: #64748b;">Your personal invitation code:</p>
        <p class="code">${code}</p>
      </div>
      
      <div class="button-container">
        <a href="${inviteLink}" target="_blank" rel="noopener noreferrer" class="button">
          Redeem Invitation
        </a>
      </div>
      
      <p class="expiry-note">⏰ This invitation code will expire in 24 hours.</p>
      
      <div class="signature">
        <p>Thank you,<br><span class="signature-name">The Vanguard Identity Team</span></p>
      </div>
    </div>
    
    <div class="email-footer">
      <p>© 2024 Vanguard Cloud Services. All rights reserved.</p>
      <p class="disclaimer">
        If you did not request this invitation, please ignore this email or contact our support team.
      </p>
      <div class="social-links">
        <a href="#" class="social-link">Privacy Policy</a> | 
        <a href="#" class="social-link">Terms of Service</a> | 
        <a href="#" class="social-link">Contact Us</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

  // Set up mail options.
  const mailOptions = {
    from: 'fpearson613@gmail.com',      // Replace with your email.
    to: email,
    subject: 'Your Invitation Code',
    html: emailTemplate
  };

  // Send the email.
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ success: false });
    }
    console.log('Email sent: ' + info.response);
    res.json({ success: true });
  });
});

module.exports = router;
