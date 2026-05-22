const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Generate JWT and store in HTTPOnly cookie
router.post('/jwt', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ success: true, message: 'Token issued' });
});


router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
  });
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
