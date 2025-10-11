{ pkgs, lib, config, inputs, ... }:

{
  dotenv.enable = true;
  # https://devenv.sh/packages/
  packages = [ pkgs.git ];
  # https://devenv.sh/languages/
  languages.go.enable = true;
  languages.javascript = {
    enable = true;
    corepack = {
      enable = true;
    };
    pnpm = {
      enable = true;
    };

    npm = {
      install = {
        enable = true;
      };
      enable = true;
    };
  };

  # https://devenv.sh/processes/
  scripts.setup-keycloak.exec = ''
    echo "Waiting for Keycloak to be ready..."
    while ! curl -s http://localhost:8081/realms/master > /dev/null; do
      sleep 2
    done
    echo "Keycloak is ready. Setting up realm..."

    # Get admin token
    TOKEN=$(curl -s -X POST http://localhost:8081/realms/master/protocol/openid-connect/token \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "username=admin&password=admin&grant_type=password&client_id=admin-cli" | jq -r .access_token)

    # Create flotio realm
    curl -s -X POST http://localhost:8081/admin/realms \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "realm": "flotio",
        "enabled": true,
        "displayName": "Flotio",
        "sslRequired": "external"
      }'

    # Create client for gateway
    curl -s -X POST http://localhost:8081/admin/realms/flotio/clients \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "clientId": "flotio-gateway",
        "enabled": true,
        "protocol": "openid-connect",
        "publicClient": false,
        "directAccessGrantsEnabled": true,
        "serviceAccountsEnabled": true,
        "implicitFlowEnabled": false,
        "standardFlowEnabled": true,
        "redirectUris": ["http://localhost:3000/*"],
        "webOrigins": ["http://localhost:3000"]
      }'

    echo "Realm flotio configured successfully!"
  '';

  env = {
    KEYCLOAK_BASE_URL = "http://localhost:8081";
    CORS_ORIGINS = "http://localhost:3000";
    SKIP_AUTH = "false";
    SERVER_URL = ":8080";
  };
}
