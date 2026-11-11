import { Check, AlertTriangle, Package, Ship } from 'lucide-react';
import { projectCargoReturn } from './cargoReplay';
import type { CargoRunEvidence } from './cargoReplay';

/** The world follows actual worker output. It is explicitly not a source-line trace. */
export function CargoCodeWorld({args,evidence,step}:{args:(number|number[])[];evidence:CargoRunEvidence;step:number}){
  const values=Array.isArray(args[0])?args[0]:[];
  const capacity=typeof args[1]==='number'?args[1]:0;
  const view=projectCargoReturn(values,capacity,evidence.state==='ready'?evidence.actual:undefined,evidence.state==='ready'?step:0);
  const consumed=Math.max(0,Math.min(100,capacity>0?view.used/capacity*100:0));
  return <div className="cargo-code-world" aria-label="Cargo world reconstructed from your program's returned values">
    <div className="cargo-world-heading"><span><Package size={15}/>INPUT BELT</span><strong>{view.processed} / {values.length} visited in playback</strong></div>
    <div className="cargo-code-belt">{view.crates.map(crate=><div key={crate.index} className={`cargo-code-crate is-${crate.state} ${crate.differsFromRule?'is-different':''}`} aria-label={`Input ${crate.index}: ${crate.weight}, ${view.reconstructable?crate.state:'decision not available'}`}><small>#{crate.index}</small><strong>{crate.weight}</strong><span>{view.reconstructable?crate.state==='current'?'next':crate.state:crate.state==='current'?'next':'unknown'}</span></div>)}</div>
    {view.reconstructable&&<><div className="cargo-world-heading cargo-world-ship"><span><Ship size={15}/>RETURNED MANIFEST</span><strong>{view.manifest.length} selected</strong></div>
      <div className="cargo-manifest-row">{view.manifest.length?view.manifest.map((weight,i)=><b key={i}>{weight}<Check size={12}/></b>):<small>No returned crates shown at this playback step.</small>}</div>
      <div className="cargo-capacity-meter"><div className="cargo-capacity-bar" role="progressbar" aria-label="Capacity shown by returned manifest" aria-valuemin={0} aria-valuemax={100} aria-valuenow={consumed}><i style={{width:`${consumed}%`}}/></div><span>Room remaining <strong>{view.remaining}</strong> / {capacity}</span></div></>}
    {!view.reconstructable&&view.ready&&<p className="cargo-world-warning"><AlertTriangle size={16}/>{view.explanation}</p>}
    {view.reconstructable&&view.firstDifference!==null&&<p className="cargo-world-warning"><AlertTriangle size={16}/>The projected choice at input #{view.firstDifference} differs from the required cargo rule.</p>}
    <p className="cargo-world-disclosure">{evidence.state!=='ready'?evidence.message:view.reconstructable?'Playback is inferred from your returned array. It does not show which lines ran. For repeated weights, we match the earliest available input. Python line traces are available through C.C.':'We cannot reliably reconstruct pickup decisions from this output.'}</p>
  </div>;
}
