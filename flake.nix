# [TheSeed] offline mirror — dzmm platform shim, macro/benchmark tools and
# endless-mode research.  The game source in site/js/ is upstream code kept
# byte-for-byte; everything we add lives in index.html, dzmm-shim.js,
# tools/ and scripts/.
#
#   nix develop          # node + python + chromium + gh
#   nix run .#serve      # serve site/ on http://127.0.0.1:8000
#   nix run .#bench      # headless chromium benchmark (see scripts/headless-bench.mjs)
#   nix run .#sync       # refresh site/js/ from a fresh browser "save page as"
#   nix build            # static site ready to upload (result/)
{
  description = "[TheSeed] unofficial offline mirror (dzmm shim + tools + benchmark)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" ];
      forAll = f: nixpkgs.lib.genAttrs systems (system: f (import nixpkgs { inherit system; }));
    in
    forAll (pkgs:
      let
        seedServe = pkgs.writeShellScriptBin "seed-serve" ''
          PORT="''${PORT:-8000}"
          echo "serving $PWD/site at http://127.0.0.1:$PORT/"
          exec ${pkgs.python3}/bin/python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$PWD/site"
        '';
        seedSync = pkgs.writeShellScriptBin "seed-sync" ''
          exec ${pkgs.nodejs}/bin/node ${./scripts/sync-upstream.mjs} "$@"
        '';
        seedBench = pkgs.writeShellScriptBin "seed-bench" ''
          exec ${pkgs.nodejs}/bin/node ${./scripts/headless-bench.mjs} "$@"
        '';
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [ nodejs python3 chromium git gh jq ];
          shellHook = ''
            echo "[TheSeed] mirror dev shell — $(node --version) · $(chromium --version 2>/dev/null | head -1)"
            echo "  nix run .#serve   static server for site/"
            echo "  nix run .#bench   headless benchmark runner"
            echo "  nix run .#sync    refresh site/js from a new page save"
          '';
        };

        apps.serve = { type = "app"; program = "${seedServe}/bin/seed-serve"; };
        apps.bench = { type = "app"; program = "${seedBench}/bin/seed-bench"; };
        apps.sync = { type = "app"; program = "${seedSync}/bin/seed-sync"; };

        # `nix build` produces the uploadable static site (including .nojekyll).
        packages.default = pkgs.runCommand "theseed-mirror-site" { } ''
          mkdir -p $out
          cp -r ${./site}/. $out/
          touch $out/.nojekyll
        '';
      });
}
