# [TheSeed] offline mirror — dzmm platform shim, macro/benchmark tools and
# endless-mode research.  The game source in site/js/ is upstream code kept
# byte-for-byte; everything we add lives in index.html, dzmm-shim.js,
# tools/ and scripts/.
#
#   nix develop          # node + python + chromium + gh + seed-* helpers
#   nix run .#serve      # serve site/ on http://127.0.0.1:8000
#   nix run .#bench      # headless chromium benchmark (see scripts/headless-bench.mjs)
#   nix run .#sync       # refresh site/js/ from a fresh browser "save page as"
#   nix run .#source     # fetch assets the game asked for but we don't have (404s)
#   nix run .#test       # unit tests for the tools (node --test)
#   nix build            # static site ready to upload (result/)
#
# NOTE: `nix run .#bench` needs a chromium on PATH (NixOS: usually
# preinstalled; otherwise use `nix develop`, which provides one).
{
  description = "[TheSeed] unofficial offline mirror (dzmm shim + tools + benchmark)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  # pre-commit 由 git-hooks.nix 提供：hooks 在 nix develop / nix flake check 里生效，
  # 不需要手工往 .git/hooks 里塞脚本。
  inputs.git-hooks.url = "github:cachix/git-hooks.nix";
  inputs.git-hooks.inputs.nixpkgs.follows = "nixpkgs";

  outputs =
    { self, nixpkgs, git-hooks }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
      ];
      forAll = f: nixpkgs.lib.genAttrs systems (system: f (import nixpkgs { inherit system; }));
      mkHooks =
        pkgs:
        git-hooks.lib.${pkgs.stdenv.hostPlatform.system}.run {
          src = ./.;
          # 原版代码（site/js/** 逐字节同步、[TheSeed]/** 浏览器存档）一律不碰
          excludes = [
            "^site/js/"
            "^\\[TheSeed\\]/"
            "^site/assets/"
            "^site/docs/data/"
            "^\\.tmp/"
            "^result/"
            "\\.(png|webp|jpg|gif|ico|jsonl)$"
          ];
          hooks = {
            # 我们自己的格式化：行尾空白 / CRLF / 连续空行 / 末尾换行
            seed-fmt = {
              enable = true;
              name = "seed-fmt (own code only)";
              entry = "${pkgs.nodejs}/bin/node scripts/fmt.mjs --git-add";
              files = "\\.(js|mjs|json|md|html|nix|sh)$";
              pass_filenames = true;
            };
            # 语法闸门：写坏一个文件就不许提交
            seed-syntax = {
              enable = true;
              name = "seed-syntax (node --check)";
              entry = "${pkgs.nodejs}/bin/node scripts/check-syntax.mjs";
              files = "\\.(js|mjs)$";
              pass_filenames = true;
            };
            # 工具单测：只跑 tests/，不依赖浏览器
            seed-tests = {
              enable = false;          # 手动 `nix run .#test`；开启会让每次提交慢 ~1s
              name = "seed-tests";
              entry = "${pkgs.nodejs}/bin/node --test tests/*.test.mjs";
              files = "^tests/";
              pass_filenames = false;
            };
          };
        };
      mkHelpers = pkgs: {
        seedServe = pkgs.writeShellScriptBin "seed-serve" ''
          exec ${pkgs.nodejs}/bin/node ${./scripts/serve.mjs} --port "''${PORT:-8000}"
        '';
        seedSource = pkgs.writeShellScriptBin "seed-source" ''
          exec ${pkgs.nodejs}/bin/node ${./scripts/fetch-source.mjs} "$@"
        '';
        seedTest = pkgs.writeShellScriptBin "seed-test" ''
          cd "$PWD"
          exec ${pkgs.nodejs}/bin/node --test "tests/*.test.mjs" "$@"
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
      checks = forAll (pkgs: { pre-commit = mkHooks pkgs; });
      devShells = forAll (
        pkgs:
        let
          h = mkHelpers pkgs;
          check = mkHooks pkgs;
        in
        {
          default = pkgs.mkShell {
            packages =
              with pkgs;
              [
                nodejs
                python3
                chromium
                git
                gh
                jq
              ]
              ++ [
                h.seedServe
                h.seedSync
                h.seedBench
                h.seedSource
                h.seedTest
              ];
            shellHook = check.shellHook + ''
              # pre-commit 需要可写的缓存目录（沙箱里 ~/.cache 只读）
              export PRE_COMMIT_HOME="$PWD/.tmp/pre-commit"
              echo "[TheSeed] mirror dev shell — $(node --version) · $(chromium --version 2>/dev/null | head -1)"
              echo "  seed-serve   static server for site/        (also: nix run .#serve)"
              echo "  seed-bench   headless benchmark runner      (also: nix run .#bench)"
              echo "  seed-sync    refresh site/js from a save    (also: nix run .#sync)"
            '';
          };
        }
      );

      apps = forAll (
        pkgs:
        let
          h = mkHelpers pkgs;
        in
        {
          serve = {
            type = "app";
            program = "${h.seedServe}/bin/seed-serve";
          };
          bench = {
            type = "app";
            program = "${h.seedBench}/bin/seed-bench";
          };
          sync = {
            type = "app";
            program = "${h.seedSync}/bin/seed-sync";
          };
          source = {
            type = "app";
            program = "${h.seedSource}/bin/seed-source";
          };
          test = {
            type = "app";
            program = "${h.seedTest}/bin/seed-test";
          };
        }
      );

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
