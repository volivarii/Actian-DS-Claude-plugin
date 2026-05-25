/**
 * GitHub OAuth broker — vendored from
 * https://github.com/sveltia/sveltia-cms-auth (MIT licensed).
 *
 * Upstream pinned SHA: 1aedd7358471848243b61b23a4e8e2dad2543c31
 *
 * Local modifications (search for "LOCAL MOD:" inline):
 *   - 2026-05-24: escape </script> inside the postMessage JSON payload to
 *     prevent script-tag-close XSS if a token or error string ever contains
 *     that sequence.
 *   - 2026-05-24: guard against success-shaped responses with no token AND
 *     no error — fail loudly with MISSING_TOKEN instead of silently passing
 *     an empty token to the SPA.
 *
 * Future changes should be documented here with rationale, since we
 * re-pull upstream occasionally to take security fixes.
 *
 * Env vars (see auth-worker/wrangler.toml + `wrangler secret put`):
 *   ALLOWED_DOMAINS      — comma-separated allowlist of `site_id` callers
 *   GITHUB_CLIENT_ID     — OAuth App client ID (secret)
 *   GITHUB_CLIENT_SECRET — OAuth App client secret (secret)
 *
 * Protocol (Decap/Sveltia CMS):
 *   1. SPA opens <worker>/auth?provider=github&site_id=<origin> in a popup
 *   2. Worker redirects to github.com with a CSRF cookie
 *   3. User approves; GitHub redirects to <worker>/callback?code&state
 *   4. Worker exchanges code for token (server-to-server with client_secret)
 *   5. Worker postMessages `authorization:github:success:<json>` to opener
 */

/**
 * List of supported OAuth providers.
 */
const supportedProviders = ["github", "gitlab"];
/**
 * Escape the given string for safe use in a regular expression.
 * @param {string} str - Original string.
 * @returns {string} Escaped string.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping
 */
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Output HTML response that communicates with the window opener.
 * @param {object} args - Options.
 * @param {string} [args.provider] - Backend name, e,g. `github`.
 * @param {string} [args.token] - OAuth token.
 * @param {string} [args.error] - Error message when an OAuth token is not available.
 * @param {string} [args.errorCode] - Error code to be used to localize the error message in
 * Sveltia CMS.
 * @returns {Response} Response with HTML.
 */
const outputHTML = ({ provider = "unknown", token, error, errorCode }) => {
  const state = error ? "error" : "success";
  const content = error ? { provider, error, errorCode } : { provider, token };
  // LOCAL MOD: escape </script> inside the JSON payload. JSON.stringify does
  // not escape it natively, so a malicious or unusual error/token string
  // could close the <script> tag early and inject HTML.
  const safeContent = JSON.stringify(content).replace(
    /<\/script>/gi,
    "<\\/script>",
  );

  return new Response(
    `
      <!doctype html><html><body><script>
        (() => {
          window.addEventListener('message', ({ data, origin }) => {
            if (data === 'authorizing:${provider}') {
              window.opener?.postMessage(
                'authorization:${provider}:${state}:${safeContent}',
                origin
              );
            }
          });
          window.opener?.postMessage('authorizing:${provider}', '*');
        })();
      </script></body></html>
    `,
    {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        // Delete CSRF token
        "Set-Cookie": `csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure`,
      },
    },
  );
};

/**
 * Handle the `auth` method, which is the first request in the authorization flow.
 * @param {Request} request - HTTP request.
 * @param {{ [key: string]: string }} env - Environment variables.
 * @returns {Promise<Response>} HTTP response.
 */
const handleAuth = async (request, env) => {
  const { url } = request;
  const { origin, searchParams } = new URL(url);
  const { provider, site_id: domain } = Object.fromEntries(searchParams);

  if (!provider || !supportedProviders.includes(provider)) {
    return outputHTML({
      error: "Your Git backend is not supported by the authenticator.",
      errorCode: "UNSUPPORTED_BACKEND",
    });
  }

  const {
    ALLOWED_DOMAINS,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_HOSTNAME = "github.com",
    GITLAB_CLIENT_ID,
    GITLAB_CLIENT_SECRET,
    GITLAB_HOSTNAME = "gitlab.com",
  } = env;

  // Check if the domain is whitelisted
  if (
    ALLOWED_DOMAINS &&
    !ALLOWED_DOMAINS.split(/,/).some((str) =>
      // Escape the input, then replace a wildcard for regex
      (domain ?? "").match(
        new RegExp(`^${escapeRegExp(str.trim()).replace("\\*", ".+")}$`),
      ),
    )
  ) {
    return outputHTML({
      provider,
      error: "Your domain is not allowed to use the authenticator.",
      errorCode: "UNSUPPORTED_DOMAIN",
    });
  }

  // Generate a random string for CSRF protection
  const csrfToken = globalThis.crypto.randomUUID().replaceAll("-", "");
  let authURL = "";

  // GitHub
  if (provider === "github") {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return outputHTML({
        provider,
        error: "OAuth app client ID or secret is not configured.",
        errorCode: "MISCONFIGURED_CLIENT",
      });
    }

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: "repo,user",
      state: csrfToken,
    });

    authURL = `https://${GITHUB_HOSTNAME}/login/oauth/authorize?${params.toString()}`;
  }

  // GitLab
  if (provider === "gitlab") {
    if (!GITLAB_CLIENT_ID || !GITLAB_CLIENT_SECRET) {
      return outputHTML({
        provider,
        error: "OAuth app client ID or secret is not configured.",
        errorCode: "MISCONFIGURED_CLIENT",
      });
    }

    const params = new URLSearchParams({
      client_id: GITLAB_CLIENT_ID,
      redirect_uri: `${origin}/callback`,
      response_type: "code",
      scope: "api",
      state: csrfToken,
    });

    authURL = `https://${GITLAB_HOSTNAME}/oauth/authorize?${params.toString()}`;
  }

  // Redirect to the authorization server
  return new Response("", {
    status: 302,
    headers: {
      Location: authURL,
      // Cookie expires in 10 minutes; Use `SameSite=Lax` to make sure the cookie is sent by the
      // browser after redirect
      "Set-Cookie":
        `csrf-token=${provider}_${csrfToken}; ` +
        `HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`,
    },
  });
};

/**
 * Handle the `callback` method, which is the second request in the authorization flow.
 * @param {Request} request - HTTP request.
 * @param {{ [key: string]: string }} env - Environment variables.
 * @returns {Promise<Response>} HTTP response.
 */
const handleCallback = async (request, env) => {
  const { url, headers } = request;
  const { origin, searchParams } = new URL(url);
  const { code, state } = Object.fromEntries(searchParams);

  const [, provider, csrfToken] =
    headers.get("Cookie")?.match(/\bcsrf-token=([a-z-]+?)_([0-9a-f]{32})\b/) ??
    [];

  if (!provider || !supportedProviders.includes(provider)) {
    return outputHTML({
      error: "Your Git backend is not supported by the authenticator.",
      errorCode: "UNSUPPORTED_BACKEND",
    });
  }

  if (!code || !state) {
    return outputHTML({
      provider,
      error: "Failed to receive an authorization code. Please try again later.",
      errorCode: "AUTH_CODE_REQUEST_FAILED",
    });
  }

  if (!csrfToken || state !== csrfToken) {
    return outputHTML({
      provider,
      error: "Potential CSRF attack detected. Authentication flow aborted.",
      errorCode: "CSRF_DETECTED",
    });
  }

  const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_HOSTNAME = "github.com",
    GITLAB_CLIENT_ID,
    GITLAB_CLIENT_SECRET,
    GITLAB_HOSTNAME = "gitlab.com",
  } = env;

  let tokenURL = "";
  let requestBody = {};

  // GitHub
  if (provider === "github") {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return outputHTML({
        provider,
        error: "OAuth app client ID or secret is not configured.",
        errorCode: "MISCONFIGURED_CLIENT",
      });
    }

    tokenURL = `https://${GITHUB_HOSTNAME}/login/oauth/access_token`;
    requestBody = {
      code,
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
    };
  }

  if (provider === "gitlab") {
    if (!GITLAB_CLIENT_ID || !GITLAB_CLIENT_SECRET) {
      return outputHTML({
        provider,
        error: "OAuth app client ID or secret is not configured.",
        errorCode: "MISCONFIGURED_CLIENT",
      });
    }

    tokenURL = `https://${GITLAB_HOSTNAME}/oauth/token`;
    requestBody = {
      code,
      client_id: GITLAB_CLIENT_ID,
      client_secret: GITLAB_CLIENT_SECRET,
      grant_type: "authorization_code",
      redirect_uri: `${origin}/callback`,
    };
  }

  let response;
  let token = "";
  let error = "";

  try {
    response = await fetch(tokenURL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch {
    //
  }

  if (!response) {
    return outputHTML({
      provider,
      error: "Failed to request an access token. Please try again later.",
      errorCode: "TOKEN_REQUEST_FAILED",
    });
  }

  try {
    ({ access_token: token, error } = await response.json());
  } catch {
    return outputHTML({
      provider,
      error: "Server responded with malformed data. Please try again later.",
      errorCode: "MALFORMED_RESPONSE",
    });
  }

  // LOCAL MOD: guard against a success-shaped response with no token AND no
  // error. Without this, the SPA receives an empty-string token as success
  // and silently fails on the first API call.
  if (!token && !error) {
    return outputHTML({
      provider,
      error: "Server responded without an access token.",
      errorCode: "MISSING_TOKEN",
    });
  }

  return outputHTML({ provider, token, error });
};

export default {
  /**
   * The main request handler.
   * @param {Request} request - HTTP request.
   * @param {{ [key: string]: string }} env - Environment variables.
   * @returns {Promise<Response>} HTTP response.
   * @see https://developers.cloudflare.com/workers/runtime-apis/fetch/
   * @see https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
   * @see https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-flow
   */
  async fetch(request, env) {
    const { method, url } = request;
    const { pathname } = new URL(url);

    if (method === "GET" && ["/auth", "/oauth/authorize"].includes(pathname)) {
      return handleAuth(request, env);
    }

    if (
      method === "GET" &&
      ["/callback", "/oauth/redirect"].includes(pathname)
    ) {
      return handleCallback(request, env);
    }

    return new Response("", { status: 404 });
  },
};
