import {NextResponse} from "next/server";
import {z} from "zod";
import {generateBuildGuidance} from "@/lib/build-guidance/engine.mjs";
import {evaluateEvidence} from "@/lib/evidence-engine/engine.mjs";
import {attachEvidenceAssessment} from "@/lib/build-guidance/evidence-adapter.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const evidenceRecord=z.object({
 evidenceId:z.string().trim().max(160).optional(),
 source:z.string().trim().min(1).max(300),
 sourceTier:z.enum(["authoritative","first_party","secondary","unknown"]).optional(),
 subject:z.string().trim().min(1).max(500),
 claim:z.string().trim().min(1).max(2000),
 claimKey:z.string().trim().max(300).optional(),
 value:z.unknown().optional(),
 kind:z.enum(["observation","inference"]).optional(),
 collectedAt:z.string().datetime({offset:true}),
 artifact:z.string().max(100000).optional(),
 digest:z.string().regex(/^[a-fA-F0-9]{64}$/).optional(),
 sourceReference:z.string().url().max(2000).optional()
}).strict();
const schema=z.object({
 objective:z.string().trim().min(12).max(4000),
 buildTypes:z.array(z.enum(["BT-01","BT-02","BT-03","BT-04","BT-05","BT-06"])).max(6).optional(),
 profile:z.enum(["DEVELOPMENT","PROTOTYPE","INTEGRATION","PRODUCTION","ENTERPRISE","RECOVERY"]).optional(),
 repository:z.string().trim().min(1).max(200).optional(),
 evidenceRecords:z.array(evidenceRecord).min(1).max(500).optional(),
 evidenceMaxAgeDays:z.number().int().min(1).max(3650).optional()
}).strict();
export async function POST(request:Request){
 let body:unknown;
 try{body=await request.json();}catch{return NextResponse.json({ok:false,error:"Request body must be valid JSON."},{status:400});}
 const parsed=schema.safeParse(body);
 if(!parsed.success)return NextResponse.json({ok:false,error:"Invalid build-guidance request.",issues:parsed.error.issues.map(i=>({path:i.path.join("."),message:i.message}))},{status:400});
 try{
  let guidance=generateBuildGuidance(parsed.data);
  if(parsed.data.evidenceRecords){
   const report=evaluateEvidence({records:parsed.data.evidenceRecords},{maxAgeDays:parsed.data.evidenceMaxAgeDays});
   guidance=attachEvidenceAssessment(guidance,report);
  }
  return NextResponse.json({ok:true,guidance},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({ok:false,error:"Could not generate build guidance."},{status:422});}
}
