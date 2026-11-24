export const COSMAXX_LT_PROFILE = Object.freeze({
  id: "COSMAXX_LT",
  name: "COSMAXX LT",
  version: "1.0.0",
  operatingMode: "lightweight_read_only",
  capabilities: Object.freeze({
    registryRead: true,
    evidenceMetadataRead: true,
    guidanceDecisionInput: true,
    craftInvocation: "guidance_conditional",
    taskforceDispatch: false,
    sideEffectExecution: false,
    permissionManagement: false,
  }),
} as const);

export type CosmaxxLtProfile = typeof COSMAXX_LT_PROFILE;
