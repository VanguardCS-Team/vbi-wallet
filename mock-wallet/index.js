const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Mock API endpoint for creating credentials
app.post('/api/create-credential', (req, res) => {
  const { subject, sessionId, callbackUrl } = req.body;
  
  console.log('Credential request received:', { subject, sessionId, callbackUrl });
  
  // Generate a mock credential offer URL
  const credentialOffer = `https://wallet.cloudstrucc.com/accept?mockCredential=true&session=${sessionId}&callback=${encodeURIComponent(callbackUrl)}`;
  
  res.json({
    success: true,
    credentialOffer: credentialOffer
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Mock Identus Wallet listening on port ${port}`);
});
