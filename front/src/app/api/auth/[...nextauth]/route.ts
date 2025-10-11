import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak";
import type { Account, Session, NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";

interface ExtendedJWT extends JWT {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
}

export const authOptions: NextAuthOptions = {
    providers: [
        KeycloakProvider({
            clientId: process.env.KEYCLOAK_ID || '',
            clientSecret: process.env.KEYCLOAK_SECRET || '',
            issuer: process.env.KEYCLOAK_ISSUER || '',
        })
    ],
    callbacks: {
        async jwt({ token, account }: { token: JWT; account?: Account | null }) {
            // Persist the OAuth access_token to the token right after signin
            // and handle token refresh when expired.
            const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER || '';
            const KEYCLOAK_ID = process.env.KEYCLOAK_ID || '';
            const KEYCLOAK_SECRET = process.env.KEYCLOAK_SECRET || '';

            const refreshAccessToken = async (t: ExtendedJWT) => {
                try {
                    const url = `${KEYCLOAK_ISSUER.replace(/\/$/, '')}/protocol/openid-connect/token`;
                    const body = new URLSearchParams();
                    body.set('grant_type', 'refresh_token');
                    if (t.refreshToken) {
                        body.set('refresh_token', t.refreshToken);
                    } else {
                        return { ...t, error: 'NoRefreshToken' };
                    }
                    body.set('client_id', KEYCLOAK_ID);
                    body.set('client_secret', KEYCLOAK_SECRET);

                    const res = await fetch(url, { method: 'POST', body });
                    if (!res.ok) {
                        const txt = await res.text().catch(() => '');
                        console.error('Failed to refresh access token', res.status, txt);
                        return { ...t, error: 'RefreshAccessTokenError' };
                    }

                    const refreshed = await res.json();
                    return {
                        ...t,
                        accessToken: refreshed.access_token,
                        accessTokenExpires: Date.now() + (refreshed.expires_in ? refreshed.expires_in * 1000 : 60 * 60 * 1000),
                        refreshToken: refreshed.refresh_token ?? t.refreshToken,
                    };
                } catch (err) {
                    console.error('Error refreshing access token', err);
                    return { ...t, error: 'RefreshAccessTokenError' };
                }
            };

            // Initial sign in: persist tokens from account
            if (account) {
                const acc = account as Account;
                const tkn = token as ExtendedJWT;
                tkn.accessToken = acc.access_token;
                tkn.refreshToken = acc.refresh_token;
                // account.expires_at is often in seconds since epoch
                tkn.accessTokenExpires = acc.expires_at ? (acc.expires_at as number) * 1000 : Date.now() + (acc.expires_in ? (acc.expires_in as number) * 1000 : 60 * 60 * 1000);
                return tkn;
            }

            // If token not expired yet, return it
            const tkn = token as ExtendedJWT;
            if (tkn.accessTokenExpires && Date.now() < (tkn.accessTokenExpires as number)) {
                return tkn;
            }

            // Otherwise, refresh
            return await refreshAccessToken(tkn);
        },
        async session({ session, token }: { session: Session; token: ExtendedJWT }) {
            // Send properties to the client, like an access_token from a provider.
            session.accessToken = token.accessToken;
            return session;
        }
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
