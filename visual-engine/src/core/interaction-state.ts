export type InteractionMode="rest"|"brushing"|"releasing"|"preview"|"reduced-motion"|"suspended";
export type InteractionState={mode:InteractionMode;hit:boolean;preview:boolean;exposure:number};
export type InteractionEvent=
  |{type:"HIT"}|{type:"MISS"}|{type:"PREVIEW";enabled:boolean}
  |{type:"REDUCED_MOTION";enabled:boolean}|{type:"SUSPEND"}|{type:"RESUME"}
  |{type:"EXPOSURE";value:number};

export const initialInteractionState:InteractionState={mode:"rest",hit:false,preview:false,exposure:0};
export function transitionInteraction(state:InteractionState,event:InteractionEvent):InteractionState {
  switch(event.type){
    case "REDUCED_MOTION":
      return event.enabled?{mode:"reduced-motion",hit:false,preview:false,exposure:0}:{...state,mode:"rest"};
    case "SUSPEND":return {...state,mode:"suspended",hit:false,preview:false};
    case "RESUME":return {...state,mode:"rest",hit:false,preview:false};
    case "HIT":
      if(state.mode==="reduced-motion"||state.mode==="suspended")return state;
      return {...state,mode:"brushing",hit:true,preview:false};
    case "MISS":
      if(state.mode==="reduced-motion"||state.mode==="suspended")return state;
      return {...state,mode:state.exposure>0?"releasing":"rest",hit:false};
    case "PREVIEW":
      if(state.mode==="reduced-motion"||state.mode==="suspended")return state;
      return {...state,mode:event.enabled?"preview":state.exposure>0?"releasing":"rest",preview:event.enabled,hit:false};
    case "EXPOSURE":{
      const exposure=Math.max(0,Math.min(1,event.value));
      const mode=state.mode==="suspended"||state.mode==="reduced-motion"?state.mode:
        state.hit?"brushing":state.preview?"preview":exposure>0?"releasing":"rest";
      return {...state,exposure,mode};
    }
  }
}
