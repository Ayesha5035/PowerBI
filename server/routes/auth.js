const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_strong_secret_key_change_this_2026';

const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
};

// Google Strategy with better error handling
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    console.log('✓ Google Profile:', profile.displayName, profile.emails?.[0]?.value);
    const user = {
      id: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value,
      avatar: profile.photos?.[0]?.value
    };
    done(null, user);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// SIGNUP
router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }
  const user = { id: Date.now().toString(), name, email, avatar: null };
  const token = generateToken(user.id, email);
  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
});

// LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  const user = { id: Date.now().toString(), name: email.split('@')[0], email, avatar: null };
  const token = generateToken(user.id, email);
  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
});

// GOOGLE LOGIN - Start
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  })
);

// GOOGLE CALLBACK - Fix this!
router.get('/google/callback', 
  (req, res, next) => {
    passport.authenticate('google', { 
      session: false,
      failureRedirect: 'http://localhost:5173/login?error=google_failed'
    })(req, res, (err) => {
      if (err) {
        console.error('Google Auth Error:', err);
        return res.redirect('http://localhost:5173/login?error=google_auth_failed');
      }
      
      try {
        console.log('✓ Google OAuth Success!');
        console.log('User:', req.user);
        
        const userData = {
          id: req.user.id,
          name: req.user.name || 'Google User',
          email: req.user.email,
          avatar: req.user.avatar
        };
        
        const token = generateToken(userData.id, userData.email);
        
        console.log('✓ Token generated, redirecting...');
        
        // Redirect with token
        res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
      } catch (error) {
        console.error('Callback Error:', error);
        res.redirect('http://localhost:5173/login?error=google_callback_failed');
      }
    });
  }
);

// VERIFY
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ success: false, message: 'Invalid token' });
  
  res.json({ success: true, user: { id: decoded.userId, name: 'User', email: decoded.email } });
});

// LOGOUT
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;