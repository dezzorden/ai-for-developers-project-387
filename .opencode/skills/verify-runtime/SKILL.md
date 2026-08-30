---
name: verify-runtime
description: Use when implementing, changing, or fixing application code, startup commands, frontend, backend, Docker, or runtime configuration. Verifies the actual launch, fixes discovered errors, and reports results briefly.
---

# Verify Runtime

After implementation or configuration changes:

1. Run the relevant build, type checks, and automated tests.
2. Start the changed application or service using the documented command.
3. Verify that the process stays alive and that its main page or health/API endpoint responds successfully.
4. If startup or runtime errors occur, diagnose and fix them, then repeat the checks until they pass.
5. Do not claim a check passed if the required tool or environment is unavailable. State the limitation briefly.
6. Stop temporary processes started only for verification. Do not stop user-owned processes.
7. In the final response, briefly list what was changed, what was verified, and any remaining limitation.
