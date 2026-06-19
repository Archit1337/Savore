const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const jwtSecret = process.env.JWT_SECRET || 'savore_saas_jwt_secret_token_2026';
      const decoded = jwt.verify(token, jwtSecret);

      // Get user from the token, attach to request object
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        return next(new Error('Authorized user not found in database.'));
      }

      if (req.user.isSuspended) {
        res.status(403);
        return next(new Error('Access Forbidden: Your account has been suspended by administration.'));
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      next(error); // will be caught by global errorHandler (JSON formatted)
    }
  } else {
    res.status(401);
    next(new Error('No authorization token provided, access denied.'));
  }
};

// Role-Based Access Control (RBAC) middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error('User session is required for this action.'));
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`Access Forbidden: Role '${req.user.role}' is not authorized for this resource.`)
      );
    }

    next();
  };
};

module.exports = {
  protect,
  requireRole,
};
