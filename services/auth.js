// services/auth.js

import { auth as jwtAuth, claimIncludes } from "express-oauth2-jwt-bearer";

/**
 * JWT Validation Middleware
 *
 * This middleware validates access tokens for protected API endpoints.
 * It checks the token's signature, audience (aud), issuer (iss), and expiration.
 *
 * The token must be an access_token with the correct audience matching
 * AUTH0_AUDIENCE. This is the token displayed on "/profile"
 * after the user logs in.
 *
 * After validation, the decoded token payload is available at "req.auth.payload".
 */
export const checkJwt = jwtAuth({
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  audience: process.env.AUTH0_AUDIENCE,
  tokenSigningAlg: "RS256",
});

// To check user's read and delete users permission
export { claimIncludes };
