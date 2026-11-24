import {NextResponse} from "next/server";
import {z} from "zod";
import {evaluateEvidence} from "@/lib/evidence-engine/engine.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const record=z.object({
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
const schema=z.object({records:z.array(record).min(1).max(500),maxAgeDays:z.number().int().min(1).max(3650).optional()}).strict();
export async function POST(request:Request){
 let body:unknown;
 try{body=await request.json();}catch{return NextResponse.json({ok:false,error:"Request body must be valid JSON."},{status:400});}
 const parsed=schema.safeParse(body);
 if(!parsed.success)return NextResponse.json({ok:false,error:"Invalid evidence request.",issues:parsed.error.issues.map(i=>({path:i.path.join("."),message:i.message}))},{status:400});
 try{return NextResponse.json({ok:true,report:evaluateEvidence({records:parsed.data.records},{maxAgeDays:parsed.data.maxAgeDays})},{headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({ok:false,error:"Could not evaluate evidence."},{status:422});}
}
