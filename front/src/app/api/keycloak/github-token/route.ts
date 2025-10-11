import { NextResponse } from 'next/server';

// Function to fetch all repositories with pagination
async function fetchAllRepositories(token: string): Promise<unknown[]> {
  const allRepos: unknown[] = [];
  let page = 1;
  const perPage = 100; // Maximum allowed by GitHub API

  while (true) {
    const response = await fetch(`https://api.github.com/user/repos?page=${page}&per_page=${perPage}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'NextJS-App'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos = await response.json();

    // If no repos returned, we've reached the end
    if (!repos || repos.length === 0) {
      break;
    }

    allRepos.push(...repos);

    // If we got less than perPage repos, this is the last page
    if (repos.length < perPage) {
      break;
    }

    page++;
  }

  return allRepos;
}

export async function GET(req: Request) {
  // Expect Authorization: Bearer <user_session_token>
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.*)$/i);
  if (!m) return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  const userToken = m[1];

  const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER; // e.g. https://keycloak.example/auth/realms/myrealm
  const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM; // e.g. myrealm

  if (!KEYCLOAK_ISSUER || !KEYCLOAK_REALM) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  try {
    // Try Keycloak broker endpoints to get the upstream provider token (GitHub)
    const issuerNoSlash = KEYCLOAK_ISSUER.replace(/\/$/, '');
    const adminBase = issuerNoSlash.replace(/\/realms\/.+$/, '');
    const brokerPaths = [
      `${issuerNoSlash}/broker/github/token`,
      `${issuerNoSlash}/realms/${KEYCLOAK_REALM}/broker/github/token`,
      `${adminBase}/realms/${KEYCLOAK_REALM}/broker/github/token`,
    ];

    for (const p of brokerPaths) {
      try {
        const r = await fetch(p, { headers: { Authorization: `Bearer ${userToken}` } });
        // if 200 and returns response with access_token, use it
        if (r.ok) {
          const text = await r.text();
          console.debug('Broker path', p, 'succeeded with response', text);

          let maybeToken: string | null = null;

          // Try parsing as JSON first
          try {
            const body = JSON.parse(text);
            maybeToken = body?.access_token ?? body?.token ?? body?.github_access_token ?? null;
          } catch {
            // If JSON parsing fails, try parsing as URL-encoded string
            // Format: access_token=ghu_xxx&expires_in=28800&refresh_token=ghr_xxx&...
            const params = new URLSearchParams(text);
            maybeToken = params.get('access_token');
          }

          if (maybeToken) {
            // Now fetch all GitHub repositories using the access token with pagination
            try {
              const repositories = await fetchAllRepositories(maybeToken);
              return NextResponse.json({
                github_access_token: maybeToken,
                repositories: repositories,
                total_count: repositories.length
              });
            } catch (githubError) {
              console.error('Error fetching GitHub repositories:', githubError);
              return NextResponse.json({
                github_access_token: maybeToken,
                error: 'Failed to fetch repositories from GitHub',
                details: githubError instanceof Error ? githubError.message : String(githubError)
              });
            }
          }
          // If 200 but no token, include response in debug return
          return NextResponse.json({ error: 'Broker returned 200 but no token', details: text }, { status: 502 });
        }

        // If rejected with 401/403, user token likely invalid/expired
        if (r.status === 401 || r.status === 403) {
          const txt = await r.text().catch(() => '');
          return NextResponse.json({ error: 'Broker rejected user token', details: txt, tried: p }, { status: 401 });
        }

        // otherwise continue to next path (recording debug) -- collect text for debugging
        console.debug('Broker path', p, 'returned', r.status, r.statusText);
      } catch (e) {
        // network errors — skip to next
        console.debug('Broker path', p, 'failed', e);
      }
    }

    // All broker attempts failed
    return NextResponse.json({
      error: 'Unable to retrieve GitHub token from any broker endpoint',
      tried: brokerPaths
    }, { status: 502 });

  } catch (err: unknown) {
    // Return error message to help debugging (do not leak secrets)
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
