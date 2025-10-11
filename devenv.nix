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

  env = {
    KEYCLOAK_BASE_URL = "http://localhost:8081";
    KEYCLOAK_ISSUER = "http://localhost:8081/realms/flotio";
    KEYCLOAK_ID = "flotio-gateway";
    NEXTAUTH_URL = "http://localhost:3000";
    NEXTAUTH_SECRET = "nextauth-dev-secret-456";
    CORS_ORIGINS = "http://localhost:3000";
    SKIP_AUTH = "false";
    SERVER_URL = ":8080";
  };
}
