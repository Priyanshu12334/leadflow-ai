import type { AuthenticatedUser } from "./authenticatedUser.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
