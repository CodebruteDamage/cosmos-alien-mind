import {
  COSMAXX_SEVEN_DOMAIN_REGISTRY,
  createUnassessedDomainSnapshot,
  type CosmaxxDomainAssessment,
  type CosmaxxDomainDefinition,
} from "./seven-domain-registry.ts";

export type CosmaxxRuntimeDomain = {
  definition: CosmaxxDomainDefinition;
  assessment: CosmaxxDomainAssessment;
};

export type CosmaxxRuntimeSnapshot = {
  adapter: "COSMAXX Runtime Adapter";
  version: "0.1.0";
  mode: "read_only_registry_adapter";
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
    version: "0.1.0",
    mode: "read_only_registry_adapter",
    executionStarted: false,
    domains: Object.freeze(domains),
  });
}
