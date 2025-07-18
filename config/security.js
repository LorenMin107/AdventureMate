module.exports = {
  "jwt": {
    "accessTokenExpiry": "15m",
    "refreshTokenExpiry": "7d",
    "algorithm": "HS256"
  },
  "cors": {
    "origin": [
      "http://localhost:3000"
    ],
    "credentials": true
  },
  "helmet": {
    "contentSecurityPolicy": {
      "directives": {
        "defaultSrc": [
          "'self'"
        ],
        "styleSrc": [
          "'self'",
          "'unsafe-inline'"
        ],
        "scriptSrc": [
          "'self'"
        ],
        "imgSrc": [
          "'self'",
          "data:",
          "https:"
        ],
        "connectSrc": [
          "'self'",
          "https://api.mapbox.com",
          "https://api.openweathermap.org"
        ]
      }
    }
  }
};