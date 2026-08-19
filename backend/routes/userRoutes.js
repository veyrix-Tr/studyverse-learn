// routes/userRoutes.js
// Defines the URL paths for user-related endpoints.
// Each path is linked to a controller function that handles the logic.

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getAllUsers, createUser } = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/users     → fetch all users
// POST /api/users    → create a new user
router.use(requireAuth, requireAdmin);
router.get('/', getAllUsers);
router.post('/', (req, res, next) => {
  if (typeof req.body.password === 'string' && req.body.password.trim()) {
    bcrypt.hash(req.body.password, 10)
      .then(hash => { req.body.password = hash; next(); })
      .catch(next);
  } else {
    next();
  }
}, createUser);

module.exports = router;
