# Repository fan-out push helper

Use `scripts/git/push_to_all_repos.py` to broadcast the current branch of this
repo to every BlackRoad repository listed in
`integrations/devtools/github-organization.yaml`.

## Usage

```bash
# Preview the remotes/commands that would run (default)
./scripts/git/push_to_all_repos.py

# Perform pushes over SSH to every repo in the BlackRoad-OS org
./scripts/git/push_to_all_repos.py --execute

# Target a specific branch name and include this repository in the fan-out
./scripts/git/push_to_all_repos.py --execute --branch main --include-current
```

### Flags
- `--config` — override the GitHub inventory path.
- `--org` — override the organization (default: `BlackRoad-OS`).
- `--protocol` — choose `ssh` (default) or `https` remotes.
- `--remote-prefix` — prefix added to generated remotes (default: `fanout-`).
- `--target` — one or more explicit repositories to push instead of the config list.
- `--force` — use `--force-with-lease` when pushing.
- `--execute` — required to perform actual pushes (otherwise dry-run).

## Notes
- The script creates remotes automatically when missing. Existing remotes are
  reused.
- Keep your git credentials configured for the chosen protocol before running
  with `--execute`.
- `--target` is handy for hotfix pushes when you only need a subset of repos.
