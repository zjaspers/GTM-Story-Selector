import React, { useMemo, useState } from 'react';
import { STORIES } from './storiesData.js';

const unique = (key) => [...new Set(STORIES.flatMap(s => Array.isArray(s[key]) ? s[key] : [s[key]]))].sort();

export default function App(){
  const [buyer,setBuyer]=useState('All');
  const [pain,setPain]=useState('All');
  const [industry,setIndustry]=useState('All');
  const [selected,setSelected]=useState(null);
  const buyers=unique('buyers');
  const pains=unique('pains');
  const industries=unique('industry');
  const matches=useMemo(()=>STORIES.filter(s=>(buyer==='All'||s.buyers.includes(buyer))&&(pain==='All'||s.pains.includes(pain))&&(industry==='All'||s.industry===industry)),[buyer,pain,industry]);
  const reset=()=>{setBuyer('All');setPain('All');setIndustry('All');setSelected(null)};

  return <div className="app">
    <header className="topbar"><div><div className="eyebrow">PORTFOLIO DEMO · FICTIONALIZED DATA</div><h1>GTM Story Selector</h1></div><button className="ghost" onClick={reset}>Reset</button></header>
    <main>
      <section className="hero"><div className="heroCopy"><h2>Find the proof that fits the conversation.</h2><p>Select the buyer, business problem, and industry to surface customer evidence that matches the moment — not just the biggest logo.</p></div></section>
      <section className="filters">
        <Filter label="Who are you talking to?" value={buyer} setValue={setBuyer} options={buyers}/>
        <Filter label="What are they trying to solve?" value={pain} setValue={setPain} options={pains}/>
        <Filter label="Industry" value={industry} setValue={setIndustry} options={industries}/>
      </section>
      <section className="resultsHead"><div><div className="eyebrow">MATCHED CUSTOMER PROOF</div><h3>{matches.length} {matches.length===1?'story':'stories'}</h3></div><p>Ranked by your selected context.</p></section>
      <section className="grid">
        {matches.map(s=><button key={s.id} className="storyCard" onClick={()=>setSelected(s)}>
          <div className="storyTop"><span className="industry">{s.industry}</span><span className="arrow">↗</span></div>
          <h4>{s.company}</h4>
          <div className="angle">{s.angle}</div>
          <p>{s.situation}</p>
          <div className="chips">{s.buyers.slice(0,2).map(x=><span key={x}>{x}</span>)}{s.pains.slice(0,2).map(x=><span key={x}>{x}</span>)}</div>
        </button>)}
      </section>
      <section className="about"><div><div className="eyebrow">WHY I BUILT THIS</div><h3>Customer proof is only useful if a seller can retrieve the right story at the right moment.</h3></div><p>This portfolio version uses fictionalized scenarios. The system demonstrates how I structure customer evidence around buyer, pain, industry, outcome, and story angle so useful proof does not stay trapped in tribal knowledge.</p></section>
    </main>
    {selected&&<div className="modalBackdrop" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><div className="eyebrow">{selected.industry} · CUSTOMER STORY</div><h3>{selected.company}</h3><h5>{selected.outcome}</h5><div className="modalSection"><strong>Situation</strong><p>{selected.situation}</p></div><div className="modalSection"><strong>Proof</strong><ul>{selected.proof.map(x=><li key={x}>{x}</li>)}</ul></div><div className="modalSection"><strong>Why this story fits</strong><p>{selected.why}</p></div><div className="storyAngle"><span>Story angle</span><b>{selected.angle}</b></div></div></div>}
  </div>
}

function Filter({label,value,setValue,options}){return <label className="filter"><span>{label}</span><select value={value} onChange={e=>setValue(e.target.value)}><option>All</option>{options.map(o=><option key={o}>{o}</option>)}</select></label>}
