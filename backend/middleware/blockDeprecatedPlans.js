// Middleware to block requests from users with deprecated plans (apex only)
// This allows spark, forge, and anchor plans to access the application

const jwt = require('jsonwebtoken');

const blockDeprecatedPlans = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, let it pass (will be handled by other middleware)
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload || !payload.plan) {
      return next(); // Invalid payload, let other middleware handle it
    }

    const { plan } = payload;

    // Block apex plan only
    if (plan === 'apex') {
      return res.status(403).json({
        error: 'Plan deprecated',
        message: `The Apex plan is no longer available. Please contact support to upgrade to Spark, forge or Anchor.`,
        deprecatedPlan: plan,
        availablePlans: ['spark', 'anchor', 'forge']
      });
    }

    // Allow spark, forge, and anchor plans
    next();
  } catch (error) {
    // If there's an error parsing the token, let it pass to other middleware
    next();
  }
};

module.exports = blockDeprecatedPlans;
