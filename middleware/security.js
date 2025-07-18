
const helmet = require('helmet');
const cors = require('cors');
const securityConfig = require('../config/security');

// Security middleware setup
const securityMiddleware = [
  helmet(securityConfig.helmet),
  cors(securityConfig.cors)
];

module.exports = securityMiddleware;
