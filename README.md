# Github Action Sync Branches

An action to create a sync pull request whenever some branch gets a closed PR. This helps to keep downstream branches in sync.

## Example Usage

Here's an example of a `.github/workflows/*.yml` file to trigger the action:

```
name: Sync master/develop branches

on:
  pull_request:
    types: [closed]
    branches: master

jobs:
  create_sync_pull_request:
    runs-on: ubuntu-latest
    steps:
      - uses: dequelabs/action-sync-branches@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          pr-title: "chore: merge master into develop"
          pr-reviewers: scurker
          pr-labels: chore
```

## Configuration

* **github-token** (required) - needed to interact with github api
* **debug** (default: `false`) - logs github api interactions to console
* **head** (default: `master`) - head branch to sync from
* **base** (default: `develop`) - target branch for the created pull request
* **pr-template** (default: `.github/pull_request_template.md`) - path to pull request template
* **pr-body** - body of pull request, will use `pr-template` as the default if this is not specified
* **pr-title** (default: `chore: merge master into develop`) - title for the created pull request
* **pr-labels** - labels to add to the created pull request
* **pr-reviewers** - reviewers to tag on the created pull request
* **pr-team-reviewers** - team reviewers to tag on the created pull request
* **pr-assignees** - assignees to tag on the created pull request