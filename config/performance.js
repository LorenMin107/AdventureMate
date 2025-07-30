module.exports = {
  caching: {
    redis: {
      enabled: true,
      ttl: 3600,
      prefix: 'adventuremate:',
    },
    memory: {
      enabled: true,
      max: 100,
      ttl: 300,
    },
  },
  compression: {
    enabled: true,
    threshold: 1024,
    level: 6,
  },
  rateLimiting: {
    windowMs: 900000,
    max: 100,
  },
};
