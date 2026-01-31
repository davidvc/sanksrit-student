# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

## Coding Standards

**Architecture:**
- Follow **Hexagonal Architecture** (Ports and Adapters pattern)
- Keep business logic pure and isolated from external dependencies
- Use ports (interfaces) to define contracts
- Implement adapters for external integrations

**Design Principles:**
- Follow **SOLID principles**:
  - **S**ingle Responsibility: Each class/module has one reason to change
  - **O**pen/Closed: Open for extension, closed for modification
  - **L**iskov Substitution: Subtypes must be substitutable for base types
  - **I**nterface Segregation: Many specific interfaces over one general interface
  - **D**ependency Inversion: Depend on abstractions, not concretions
- Apply **Clean Code** practices:
  - Meaningful names that reveal intent
  - Functions should be small and do one thing
  - Minimize comments by writing self-documenting code
  - Keep cyclomatic complexity low
- Use **Design Patterns** appropriately to reduce coupling and improve maintainability
- Favor composition over inheritance

## Testing Standards

**DO NOT WRITE UNIT TESTS** unless explicitly requested.

**TDD Workflow (MANDATORY):**
1. Write **ONE acceptance test** for each acceptance criteria
2. Run the test and watch it **FAIL**
3. Write minimal code to make it **PASS**
4. **REFACTOR** while keeping tests green
5. Repeat for next acceptance criteria

**Acceptance Test Requirements:**
- Test at the level of the **public contract**
- Test behavior, not implementation details
- Run in **complete isolation**
- **Stub/Mock all external dependencies**:
  - Third-party services
  - Other services/APIs
  - File systems
  - Databases
  - Network calls
- Focus on business requirements and acceptance criteria

**DO NOT WRITE END-TO-END TESTS** unless explicitly requested.

**Test Code Quality:**
- Follow the same coding standards as production code
- Apply SOLID principles to test code
- Keep tests maintainable and readable
- Use clear arrange-act-assert structure

