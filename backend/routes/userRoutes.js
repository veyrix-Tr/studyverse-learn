// routes/userRoutes.js
// Defines the URL paths for user-related endpoints.
// Each path is linked to a controller function that handles the logic.

const express = require('express');
const router = express.Router();
const { getAllUsers, createUser } = require('../controllers/userController');

// GET /api/users     → fetch all users
// POST /api/users    → create a new user
router.get('/', getAllUsers);
router.post('/', createUser);

module.exports = router;
