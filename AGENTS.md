# AGENTS.md

Follow these guidelines when creating or modifying the contents of the repository.

1. **Commit‐Message Template**

   - All commit messages must adhere exactly to the structure and rules in `.github/commit-instructions.md` (types, scopes, header/body/footer, line lengths, issue references, etc.)【F:.github/commit-instructions.md】.
   - Do not amend or rebase existing commits; create new commits only.
   - Always run `npm run format` before committing to ensure code style consistency.

2. **Adding Features to `utils/`**

   - For each new feature added under `utils/`, there must be corresponding tests in the appropriate tests directory.
   - Tests should cover expected behavior and edge cases for that utility.
