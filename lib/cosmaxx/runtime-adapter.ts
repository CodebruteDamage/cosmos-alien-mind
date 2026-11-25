import {
  COSMAXX_SEVEN_DOMAIN_REGISTRY,
  createUnassessedDomainSnapshot,
  type CosmaxxDomainAssessment,
  type CosmaxxDomainDefinition,
} from "./seven-domain-registry.ts";
import { COSMAXX_LT_PROFILE } from "./lightweight-profile.ts";

export type CosmaxxRuntimeDomain = {
  definition: CosmaxxDomainDefinition;
  assessment: CosmaxxDomainAssessment;
};

export type CosmaxxRuntimeSnapshot = {
  adapter: "COSMAXX Runtime Adapter";
  version: "0.2.0";
  profile: typeof COSMAXX_LT_PROFILE;
  mode: "lightweight_read_only";
  executionStarted: false;
  domains: readonly CosmaxxRuntimeDomain[];
};

export function getCosmaxxRuntimeSnapshot(): CosmaxxRuntimeSnapshot {
  const assessments = createUnassessedDomainSnapshot();
  const domains = COSMAXX_SEVEN_DOMAIN_REGISTRY.map((definition, index) =>
    Object.freeze({
      definition,
      assessment: assessments[index],
    }),
  );

  return Object.freeze({
    adapter: "COSMAXX Runtime Adapter",
    version: "0.2.0",
    profile: COSMAXX_LT_PROFILE,
    mode: "lightweight_read_only",
    executionStarted: false,
    domains: Object.freeze(domains),
  });
}
