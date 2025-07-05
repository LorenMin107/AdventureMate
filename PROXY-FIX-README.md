# API Proxy Configuration Fix

## Issue
The application was experiencing ECONNREFUSED errors when making API requests from the frontend to the backend:

```
VITE v5.4.19  ready in 105 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
9:29:16 PM [vite] http proxy error: /api/v1/auth/refresh-token
AggregateError [ECONNREFUSED]: 
    at internalConnectMultiple (node:net:1122:18)
    at afterConnectMultiple (node:net:1689:7)
```

These errors occurred because the frontend was trying to connect to the backend server on port 3001, but the backend server was not running or not accessible when the frontend made API requests.

## Solution
The solution was to update the development script in `package.json` to use `concurrently` instead of the `&` operator. This ensures that both the frontend and backend servers run properly in parallel.

### Changes Made:

1. Updated the `dev` script in `package.json`:
   ```json
   "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\""
   ```

2. Added `concurrently` as a dev dependency:
   ```json
   "concurrently": "^8.2.2"
   ```

## How to Run the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development servers:
   ```bash
   npm run dev
   ```

This will start both the backend server on port 3001 and the frontend development server on port 5173 concurrently.

## Why This Fix Works

The previous approach using the `&` operator to run both servers in parallel had a race condition issue. The frontend server might start making API requests before the backend server was fully initialized, resulting in ECONNREFUSED errors.

Using `concurrently` provides better process management and ensures that both servers run properly in parallel, reducing the likelihood of connection errors.

## Additional Notes

- The backend server is configured to run on port 3001 (defined in `config/index.js`)
- The Vite development server is configured to proxy API requests to `http://localhost:3001` (defined in `vite.config.js`)
- If you still experience connection issues, ensure that port 3001 is not being used by another application