module.exports = {
  jwt: {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    algorithm: 'HS256',
  },
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.mapbox.com', 'https://api.openweathermap.org'],
      },
    },
    permissionsPolicy: {
      directives: {
        geolocation: ["'self'"],
        camera: ["'self'"],
        microphone: ["'self'"],
        payment: ["'self'"],
        usb: ["'self'"],
        magnetometer: ["'self'"],
        gyroscope: ["'self'"],
        accelerometer: ["'self'"],
        'ambient-light-sensor': ["'self'"],
        autoplay: ["'self'"],
        'encrypted-media': ["'self'"],
        fullscreen: ["'self'"],
        'picture-in-picture': ["'self'"],
        'publickey-credentials-get': ["'self'"],
        'screen-wake-lock': ["'self'"],
        'sync-xhr': ["'self'"],
        'web-share': ["'self'"],
        'xr-spatial-tracking': ["'self'"],
      },
    },
  },
};
