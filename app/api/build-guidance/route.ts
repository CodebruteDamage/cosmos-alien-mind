import {NextResponse} from "next/server";
import {z} from "zod";
import {generateBuildGuidance} from "@/lib/build-guidance/engine.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const schema=z.object({
 objective:z.string().trim().min(12).max(4000),
 buildTypes:z.array(z.enum(["BT-01","BT-02","BT-03","BT-04","BT-05","BT-06"])).max(6).optional(),
 profile:z.enum(["DEVELOPMENT","PROTOTYPE","INTEGRATION","PRODUCTION","ENTERPRISE","RECOVERY"]).optional(),
 repository:z.string().trim().min(1).max(200).optional()
}).strict();
export async function POST(request:Request){
 let body:unknown;
 try{body=await request.json();}catch{return NextResponse.json({ok:false,error:"Request body must be valid JSON."},{status:400});}
 const parsed=schema.safeParse(body);
 if(!parsed.success)return NextResponse.json({ok:false,error:"Invalid build-guidance request.",issues:parsed.error.issues.map(i=>({path:i.path.join("."),message:i.message}))},{status:400});
 try{return NextResponse.json({ok:true,guidance:generateBuildGuidance(parsed.data)},{headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({ok:false,error:"Could not generate build guidance."},{status:422});}
}
