export type BuildTypeId="BT-01"|"BT-02"|"BT-03"|"BT-04"|"BT-05"|"BT-06";
export type BuildProfile="DEVELOPMENT"|"PROTOTYPE"|"INTEGRATION"|"PRODUCTION"|"ENTERPRISE"|"RECOVERY";
export interface BuildGuidanceInput{objective:string;buildTypes?:BuildTypeId[];profile?:BuildProfile;repository?:string}
export declare const BUILD_TYPES:Readonly<Record<BuildTypeId,{id:BuildTypeId;name:string;purpose:string;domains:string[];keywords:string[]}>>;
export declare const BUILD_PROFILES:Readonly<Record<BuildProfile,string>>;
export declare const DOMAINS:Readonly<Record<string,string>>;
export declare function generateBuildGuidance(input:BuildGuidanceInput):Record<string,unknown>;
