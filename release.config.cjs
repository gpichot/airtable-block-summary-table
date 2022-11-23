module.exports = {
  branches: ["main"],
  repositoryUrl: "https://github.com/gpichot/airtable-block-summary-table",
  plugins: [
    "@semantic-release/changelog",
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "package-lock.json"],
        message:
          "chore(release): ${nextRelease.version} [publish]\n\n${nextRelease.notes}",
      },
    ],
  ],
  publish: ["@semantic-release/github"],
  verifyConditions: [
    "@semantic-release/changelog",
    "@semantic-release/github",
    "@semantic-release/git",
  ],
};
