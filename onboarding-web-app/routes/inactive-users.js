// routes/newpage.js
const express = require('express');
const router = express.Router();

// GET route for '/newpage'
router.get('/inactive-users', (req, res) => {
  res.render('inactive-users', { title: 'Inactive Users' });
});

module.exports = router;