import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {z} from "zod";
import {triageCraft} from "@/lib/craft/engine.mjs";
import {evaluateEvidence} from "@/lib/evidence-engine/engine.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const blocker=z.object({id:z.string().trim().min(1).max(120),title:z.string().trim().min(1).max(300),description:z.string().trim().max(2000).optional(),impact:z.number().int().min(1).max(5),likelihood:z.number().int().min(1).max(5),urgency:z.number().int().min(1).max(5).optional(),evidenceConfidence:z.number().min(0).max(1).optional(),evidenceStatus:z.enum(["VERIFIED","OBSERVED","INFERRED","UNVERIFIED","CONFLICTED","STALE"]).optional()}).strict();
const schema=z.object({blockers:z.array(blocker).min(1).max(200)}).strict();
export async function POST(request:Request){
 let body:unknown;
 try{body=await request.json();}catch{return NextResponse.json({ok:false,error:"Request body must be valid JSON."},{status:400});}
 const parsed=schema.safeParse(body);
 if(!parsed.success)return NextResponse.json({ok:false,error:"Invalid CRAFT request.",issues:parsed.error.issues.map(i=>({path:i.path.join("."),message:i.message}))},{status:400});
 try{
  const triage=triageCraft(parsed.data);
  const artifact=JSON.stringify(triage);
  const evidence=evaluateEvidence({records:[{evidenceId:"CRAFT-"+createHash("sha256").update(artifact).digest("hex").slice(0,16),source:"cosmos-craft-engine",sourceTier:"unknown",subject:"CRAFT triage report",claim:"Deterministic blocker prioritization report generated",claimKey:"craft-triage-report",value:triage.schema,kind:"inference",collectedAt:triage.generatedAt,artifact}]});
  return NextResponse.json({ok:true,triage,evidence},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({ok:false,error:"Could not complete CRAFT triage."},{status:422});}
}
