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
    <html>
    <head>
      <style>
        /* Add basic styling as needed */
        .container {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        .header {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .code {
          font-size: 20px;
          color: #2c3e50;
          font-weight: bold;
          margin: 10px 0;
        }
        .footer {
          font-size: 12px;
          color: #7f8c8d;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Your Invitation Code</div>
        <p>Hi ${name},</p>
        <p>Your invitation code is:</p>
        <div class="code">${code}</div>
        <p>
          <a href="${inviteLink}" target="_blank" rel="noopener noreferrer">
            Follow this link to redeem your invitation
          </a>
        </p>
        <p>This code will expire in 24 hours.</p>
        <p>Thank you,<br>The Team</p>
        <div class="footer">
          If you did not request this invitation, please ignore this email.
        </div>
      </div>
    </body>
    </html>`;

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
