export interface GitHubBranch { name: string; protected: boolean; protectionStatus: "protected"|"unprotected"|"unknown"; commitSha: string|null; }
export interface GitHubWorkflowRun { name: string; status: "success"|"failure"|"cancelled"|"skipped"|"in_progress"|"queued"|"unknown"; runId: number; branch: string|null; commitSha: string|null; url: string|null; updatedAt: string|null; }
export interface GitHubRepositorySnapshot { name: string; defaultBranch: string; visibility: string; branches: GitHubBranch[]; workflows: GitHubWorkflowRun[]; }
export interface GitHubInventorySnapshot { contractVersion: "1.0"; generatedAt: string; source: {kind:string;apiVersion:string;authenticity:string;allowlist:string[]}; repositories: GitHubRepositorySnapshot[]; }
export declare function discoverGitHubRepositories(options?: {token?:string;repositories?:string;fetchImpl?:typeof fetch}): Promise<GitHubInventorySnapshot>;
