{ pkgs, lib, config, inputs, ... }:

let
  # Hardcoded secret for development
  clientSecret = "dev-secret-123";
in

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

  processes = {
    gateway.exec = "cd gateway && go run cmd/main.go";
    front.exec = "cd front && pnpm dev";
    "project-service".exec = "cd project-service && go run cmd/main.go";
    "organization-service".exec = "cd organization-service && go run cmd/main.go";
    "build-service".exec = "cd build-service && go run cmd/main.go";
    "logs-service".exec = "cd logs-service && go run cmd/main.go";
  };

  env = {
    # Keycloak Configuration
    KEYCLOAK_BASE_URL = "http://localhost:8081";
    KEYCLOAK_ISSUER = "http://localhost:8081/realms/flotio";
    KEYCLOAK_ID = "flotio-gateway";
    KEYCLOAK_REALM = "flotio";

    # NextAuth Configuration
    NEXTAUTH_URL = "http://localhost:3000";
    NEXTAUTH_SECRET = "nextauth-dev-secret-456";

    # CORS Configuration
    CORS_ORIGINS = "http://localhost:3000";

    # Authentication
    SKIP_AUTH = "false";

    # Service URLs
    NEXT_PUBLIC_GATEWAY_BASE_URL = "http://localhost:8080";
    NEXT_PUBLIC_ORGANIZATION_SERVICE_BASE_URL = "http://localhost:8082";
    NEXT_PUBLIC_PROJECT_SERVICE_BASE_URL = "http://localhost:8083";

  };
}
