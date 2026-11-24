# COSMOS CRAFT Engine — Build Milestone 1

## Scope

Deliver a standalone, deterministic blocker triage module that can be integrated by COSMOS services without coupling it to the Android runtime or web UI.

## Included

- Weighted complexity, risk, urgency, and dependency scoring.
- Priority classification and next-step recommendations.
- Confidence threshold that flags insufficient evidence.
- Optional references to externally managed 12 GAP Cycle records.
- Automated Node.js tests.
- Recommendation-only governance boundary.

## Explicitly not included

- Automatic fixes or shell execution.
- Direct writes to GitHub, Neon, or device storage.
- GPT/model inference.
- Authentication, authorization, or audit persistence.
- Full 12 GAP Cycle stage mapping.

## Validation command

~~~bash
node --test engines/craft/tests/*.test.mjs
~~~

## Deployment status

Source is proposed on the feature branch. Runtime tests and the production deployment pipeline must pass before this milestone can be certified as deployed.
