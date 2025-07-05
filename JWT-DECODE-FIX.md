# JWT-Decode Package Fix

## Issue
The application was crashing with the following error:
```
Failed to resolve import "jwt-decode" from "client/src/services/AuthService.js". Does the file exist?
```

This error occurred because the `jwt-decode` package was not installed in the project, but was being imported in the `AuthService.js` file.

## Solution
Two changes were made to fix this issue:

1. Added the `jwt-decode` package to the project dependencies in `package.json`:
   ```json
   "jwt-decode": "^4.0.0",
   ```

2. Updated the import statement in `client/src/services/AuthService.js` to use the named export syntax required by jwt-decode v4.0.0:
   ```javascript
   // Before
   import jwtDecode from 'jwt-decode';
   
   // After
   import { jwtDecode } from 'jwt-decode';
   ```

## Why This Fix Works
The error was occurring because the application was trying to import a package that wasn't installed. By adding the package to the dependencies and updating the import syntax to match the package's API, we've resolved the issue.

## Additional Notes
- The `jwt-decode` package is used in the authentication service to decode JWT tokens, which is essential for the JWT-based authentication flow.
- Version 4.0.0 of `jwt-decode` uses named exports instead of default exports, which is why we needed to update the import syntax.
- After these changes, you'll need to run `npm install` to install the new package before starting the application.