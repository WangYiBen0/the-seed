# [TheSeed] offline mirror — dzmm platform shim, macro/benchmark tools and
# endless-mode research.  The game source in site/js/ is upstream code kept
# byte-for-byte; everything we add lives in index.html, dzmm-shim.js,
# tools/ and scripts/.
#
#   nix develop          # node + python + chromium + gh + seed-* helpers
#   nix run .#serve      # serve site/ on http://127.0.0.1:8000
#   nix run .#bench      # headless chromium benchmark (see scripts/headless-bench.mjs)
#   nix run .#sync       # refresh site/js/ from a fresh browser "save page as"
#   nix build            # static site ready to upload (result/)
#
# NOTE: `nix run .#bench` needs a chromium on PATH (NixOS: usually
# preinstalled; otherwise use `nix develop`, which provides one).
{
  description = "[TheSeed] unofficial offline mirror (dzmm shim + tools + benchmark)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" ];
      forAll = f: nixpkgs.lib.genAttrs systems (system: f (import nixpkgs { inherit system; }));
      mkHelpers = pkgs: {
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
      };
    in
    {
      devShells = forAll (pkgs:
        let h = mkHelpers pkgs; in {
          default = pkgs.mkShell {
            packages = with pkgs; [ nodejs python3 chromium git gh jq ] ++ [ h.seedServe h.seedSync h.seedBench ];
            shellHook = ''
              echo "[TheSeed] mirror dev shell — $(node --version) · $(chromium --version 2>/dev/null | head -1)"
              echo "  seed-serve   static server for site/        (also: nix run .#serve)"
              echo "  seed-bench   headless benchmark runner      (also: nix run .#bench)"
              echo "  seed-sync    refresh site/js from a save    (also: nix run .#sync)"
            '';
          };
        });

      apps = forAll (pkgs:
        let h = mkHelpers pkgs; in {
          serve = { type = "app"; program = "${h.seedServe}/bin/seed-serve"; };
          bench = { type = "app"; program = "${h.seedBench}/bin/seed-bench"; };
          sync = { type = "app"; program = "${h.seedSync}/bin/seed-sync"; };
        });

      # `nix build` produces the uploadable static site (including .nojekyll).
      packages = forAll (pkgs: {
        default = pkgs.runCommand "theseed-mirror-site" { } ''
          mkdir -p $out
          cp -r ${./site}/. $out/
          touch $out/.nojekyll
        '';
      });
    };
}
