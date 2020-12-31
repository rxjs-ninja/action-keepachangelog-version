# NX Keep A Changelog Action

<p align="center">
  <a href="https://github.com/rxjs-ninja/action-keepachangelog-version/actions"><img alt="javscript-action status" src="https://github.com/rxjs-ninja/action-keepachangelog-version/workflows/action-tests/badge.svg"></a>
</p>

This action is used with the [RxJS Ninja Starter](https://github.com/rxjs-ninja/nx-library-starter) to handle
bumping of changelogs using the [Keep-A-Changelog](https://keepachangelog.com) format.

This action is opinionated in two ways:

- It works with [Nx](https://nx.dev) to handle finding affected libraries
- It does not generate changelogs, instead it's used with manual changelogs using the `[Unreleased]` token.

When a new version is released, this action runs and updated the `[Unreleased]` to the version in the package
and appends the date in `YYYY-MM-DD` format

There are some properties that can be passed

```yaml
steps:
  - name: Bump Changelogs
    use: rxjs-ninja/action-keepachangelog-version@v1
    with:
      # Where the nx mono-repo directory is located
      rootdir: '.'
      # Compares against the remote main branch
      basebranch: 'origin/main'
      # Either 'packages' or 'libs' depending on selected layout
      libfolder: 'packages' 
      # Changelog filename
      filename: 'CHANGELOG.md'
      # Replacement text, can be changed if not in English for example
      replacement: 'Unreleased'
      # Runs all steps except writing the changes
      dryrun: 'false'
```

All values have a default and all are required except for `dryrun`.
