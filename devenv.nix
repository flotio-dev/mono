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

  processes = {
    api.exec = "cd API && go run cmd/main.go";
    front.exec = "cd front && pnpm dev";
  };

}
