export type AuthMethod = "oauth" | "pat";

export interface AuthSession {
  method: AuthMethod;
  token: string;
  expiresAt?: number;     // ms epoch; reserved for future GitHub-App-based refresh tokens. OAuth Apps don't issue these.
  refreshToken?: string;  // ditto
  login?: string;         // GitHub username, for header display
}
