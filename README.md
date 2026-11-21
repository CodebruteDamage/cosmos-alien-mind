# COSMOS OmniBoard

COSMOS OmniBoard is the evolving unified command interface for the COSMOS ecosystem. This implementation reuses the existing Cosmos Alien Mind Next.js dashboard foundation rather than creating a second application.

## Current foundation

- Existing Next.js application shell and responsive layout, transformed into OmniBoard navigation.
- Department, engine, POWERBOX, host, workflow, governance, evidence, and business workspace shells.
- Existing Neon health endpoint and conversation persistence API retained.
- The overview displays only observed backend status and explicitly labels capabilities that are not connected.
- Workspace cards are presentation/navigation foundations, not claims of live integrations.

## Verified limitations

- AI/model inference is not connected.
- Authentication and per-user data isolation are not implemented.
- Department and engine registries are not connected.
- POWERBOX, WARP GATE, CUMI, evidence, host telemetry, and workflow execution are not integrated.
- The current conversations API is not a production multi-user service.

Do not use this foundation for sensitive or multi-user production data until authentication, authorization, tenant isolation, rate limiting, and abuse controls are implemented and reviewed.

## Architecture boundaries

- OmniBoard: presentation, visibility, and navigation.
- Departments: ownership of domain responsibilities and specialist engines.
- POWERBOX: engine registration, composition, and host coordination.
- CUMI: versioned module communication contracts.
- WARP GATE: authorization and governance enforcement.
- COSMOS Evidence: traceable evidence and validation records.

OmniBoard must not impersonate the responsibilities of these components. Live states must come from connected, authorized sources and must carry provenance and freshness information.

## Development

Use the existing project setup in the repository README and preserve the existing Neon environment configuration. No database schema or API behavior is changed by this UI transformation.
