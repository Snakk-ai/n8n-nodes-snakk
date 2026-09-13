# Release checklist

This revision prepares 0.2.0, but it must not be described as verified before n8n approves it.

## Technical checks

- Run `npm ci --ignore-scripts`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm pack --dry-run`.
- Confirm a valid test-tenant API key passes the credential test, and invalid credentials fail.
- Test agent get/list/update, number list/assignment using a designated existing test number, and after-call trigger registration/delivery/cleanup. Claiming or purchasing a number is not part of the smoke test.
- Verify the standard enriched after-call payload and the `status` / `structured_output` filter against real synthetic-call data.
- Test the actual inbound Snakk tool → n8n → Lime → Snakk response separately, including identity failure, wrong-customer case, no result, CRM failure and timeout.
- Check the official SVG wordmark on light and dark n8n canvases; a dedicated approved vector symbol would be preferable if available.
- Do not expand this package into a proxy wrapping Lime or unrelated services: n8n verification expects one third-party service per package.

## Repository and publishing

The repository was private when inspected on 2026-09-07. n8n requires a public repository. Obtain the owner's explicit approval for changing visibility and review repository history before exposing it. Do not treat an assumption that it is public as approval to disclose private history.

No Actions workflow existed on main at inspection. Published npm 0.1.4 has no provenance and fails `@n8n/scan-community-package` at that gate.

Configure this exact npm Trusted Publisher for `n8n-nodes-snakk`:

- Provider: GitHub Actions
- Owner: `Snakk-ai`
- Repository: `n8n-nodes-snakk`
- Workflow filename: `publish.yml`
- Environment: blank (the workflow does not select a GitHub Environment)

The prepared workflow uses Node 24, a pinned npm version with OIDC support, the lockfile, lint, typecheck and tests. Its publish step requests provenance and public npm access. It only runs for `v*.*.*` tags and rejects a tag that does not match package.json. Do not push a release tag before the visibility decision, test-tenant verification, review, and trusted-publisher configuration are complete.

After those checks, merge the reviewed changes and push the tag matching package.json (currently `v0.2.0`). Verify the completed Actions run and npm `dist.attestations`. Then run:

```bash
npx @n8n/scan-community-package n8n-nodes-snakk@0.2.0
```

The scanner can print a failure while exiting successfully. Check its reported `passed` result/message, not only the shell exit code.

## Submission

Sign in at https://creators.n8n.io/nodes. Check for an existing submission before creating one. Use the exact package name, released version, public GitHub URL, and API documentation URL. Keep the submission focused on Snakk's own API and authenticated after-call events. State the incoming-call workflow use accurately and do not present the after-call trigger as a synchronous tool-response node.

Creator Portal was at the login screen on 2026-09-07, so prior submission state could not be inspected. No submission or approval is recorded by this task.

## Sources

- https://docs.n8n.io/connect/create-nodes/deploy-your-node/submit-community-nodes/
- https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines/
- https://docs.n8n.io/connect/create-nodes/build-your-node/reference/ux-guidelines/
- https://doc.snakk.ai/
