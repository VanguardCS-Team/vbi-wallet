// routes/newpage.js
const express = require('express');
const router = express.Router();

// GET route for '/newpage'
router.get('/credentials-history', (req, res) => {
  res.render('credentials-history', { title: 'Credentials History' });
});

module.exports = router;