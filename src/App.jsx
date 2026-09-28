import React, { useMemo, useState } from 'react';
import { STORIES } from './storiesData.js';

const unique = (key) => [...new Set(STORIES.flatMap(s => Array.isArray(s[key]) ? s[key] : [s[key]]).filter(Boolean))].sort();

function storyText(story){
  return [story.company,story.industry,story.outcome,story.situation,story.angle,story.why,...story.buyers,...story.pains,...story.proof].join(' ').toLowerCase();
}

function scoreStory(story,{query,buyer,pain,industry}){
  let score=0;
  const text=storyText(story);
  if(query){
    const q=query.toLowerCase().trim();
    if(text.includes(q)) score+=30;
    q.split(/\s+/).filter(Boolean).forEach(t=>{if(text.includes(t)) score+=3});
  }
  if(buyer!=='All'&&story.buyers.includes(buyer)) score+=25;
  if(pain!=='All'&&story.pains.includes(pain)) score+=35;
  if(industry!=='All'&&story.industry===industry) score+=15;
  score+=story.proof.length*2;
  return score;
}

function buildCombinedNarrative(stories){
  if(!stories.length) return '';
  const sharedPains=[...new Set(stories.flatMap(s=>s.pains))];
  const angles=stories.map(s=>s.angle);
  const proof=stories.flatMap(s=>s.proof.slice(0,2));
  return `Combined story narrative\n\nThe pattern across these examples is ${sharedPains.slice(0,4).join(', ').toLowerCase()}. Each story shows a different point in the operating chain where good intent can lose momentum.\n\nThe first story establishes the core problem. The next stories show adjacent proof: how visibility, coordination, adoption, training, labor, or execution improve when the operating model is clearer.\n\nSuggested narrative arc:\n${angles.map((a,i)=>`${i+1}. ${a}`).join('\n')}\n\nProof to weave in:\n${proof.map(p=>`- ${p}`).join('\n')}\n\nClose by connecting the stories back to the buyer's operating problem rather than treating them as separate case studies.`;
}

function buildSingleDraft(story,mode){
  if(!story) return '';
  if(mode==='questions') return `Discovery questions\n\n1. How are you handling ${story.pains[0]?.toLowerCase()||'this challenge'} today?\n2. Where does that process break down?\n3. Who owns the outcome when something goes wrong?\n4. What would leadership need to see to know it improved?\n\nRelevant proof story\n${story.company}: ${story.outcome}`;
  if(mode==='proof') return `Proof summary\n\nCustomer profile: ${story.company}\nBusiness problem: ${story.pains.join(', ')}\nOutcome: ${story.outcome}\n\nProof:\n${story.proof.map(p=>`- ${p}`).join('\n')}\n\nWhy it matters:\n${story.why}`;
  if(mode==='demo') return `Demo setup\n\n1. Start with the operating problem: ${story.pains[0]}.\n2. Show where the current process creates friction.\n3. Demonstrate the operating change.\n4. Anchor the story with this proof: ${story.proof[0]}.\n5. Close with: ${story.angle}.`;
  return `Talk track\n\n${story.company} faced a familiar operating problem: ${story.situation}\n\nThe important change was ${story.outcome.toLowerCase()}\n\nProof:\n${story.proof.slice(0,3).map(p=>`- ${p}`).join('\n')}\n\nWhy this story is useful:\n${story.why}`;
}

export default function App(){
  const [dark,setDark]=useState(false);
  const [query,setQuery]=useState('');
  const [buyer,setBuyer]=useState('All');
  const [pain,setPain]=useState('All');
  const [industry,setIndustry]=useState('All');
  const [selectedId,setSelectedId]=useState(STORIES[0].id);
  const [boardIds,setBoardIds]=useState([]);
  const [mode,setMode]=useState('talk');
  const [copied,setCopied]=useState('');

  const buyers=unique('buyers');
  const pains=unique('pains');
  const industries=unique('industry');

  const filtered=useMemo(()=>STORIES
    .filter(s=>{
      const q=!query.trim()||storyText(s).includes(query.trim().toLowerCase());
      return q&&(buyer==='All'||s.buyers.includes(buyer))&&(pain==='All'||s.pains.includes(pain))&&(industry==='All'||s.industry===industry);
    })
    .map(s=>({...s,matchScore:scoreStory(s,{query,buyer,pain,industry})}))
    .sort((a,b)=>b.matchScore-a.matchScore),[query,buyer,pain,industry]);

  const selected=STORIES.find(s=>s.id===selectedId)||filtered[0]||null;
  const board=boardIds.map(id=>STORIES.find(s=>s.id===id)).filter(Boolean);
  const boardNarrative=useMemo(()=>buildCombinedNarrative(board),[boardIds]);
  const generated=useMemo(()=>buildSingleDraft(selected,mode),[selectedId,mode]);

  function addBoard(story){setBoardIds(ids=>ids.includes(story.id)||ids.length>=4?ids:[...ids,story.id]);}
  function removeBoard(id){setBoardIds(ids=>ids.filter(x=>x!==id));}
  function reset(){setQuery('');setBuyer('All');setPain('All');setIndustry('All');setBoardIds([]);setSelectedId(STORIES[0].id);setMode('talk');}
  async function copy(text,key){await navigator.clipboard?.writeText(text);setCopied(key);setTimeout(()=>setCopied(''),1400);}

  const bestFit=filtered.slice(0,3);
  const inBoard=selected&&boardIds.includes(selected.id);
  const boardMode=board.length>0;

  return <div className={dark?'app dark':'app'}>
    <header className="appHeader">
      <div className="brandBlock"><div className="folderIcon">▣</div><div><div className="brand">GTM STORY SELECTOR</div><div className="subBrand">{boardMode?'Storyboard workspace':`Dynamic story matching · ${STORIES.length} fictionalized stories`}</div></div></div>
      <div className="headerActions">
        {boardMode&&<button className="textBtn" onClick={()=>setBoardIds([])}>Exit Storyboard</button>}
        <span className="boardBadge">Storyboard {board.length}/4</span>
        <button className="textBtn" onClick={reset}>⌘ Reset</button>
        <button className="iconBtn" onClick={()=>setDark(v=>!v)}>{dark?'☀':'☾'}</button>
      </div>
    </header>

    {boardMode ? <div className="boardLayout">
      <StoryList query={query} setQuery={setQuery} buyer={buyer} setBuyer={setBuyer} pain={pain} setPain={setPain} industry={industry} setIndustry={setIndustry} buyers={buyers} pains={pains} industries={industries} stories={filtered} selectedId={selectedId} setSelectedId={setSelectedId} boardIds={boardIds} addBoard={addBoard} compact />
      <section className="boardWorkspace">
        <div className="boardTop"><div><h2>Storyboard Board</h2><p>Compare selected stories side-by-side, then use the final column as the combined narrative.</p></div><div className="boardButtons"><button className={copied==='board'?'successBtn':'primaryBtn'} onClick={()=>copy(boardNarrative,'board')}>{copied==='board'?'Copied':'Copy Board'}</button><button className="secondaryBtn" onClick={()=>setBoardIds([])}>Clear Board</button></div></div>
        <div className="boardColumns" style={{gridTemplateColumns:`repeat(${board.length},minmax(250px,1fr)) minmax(330px,1.15fr)`}}>
          {board.map((story,i)=><article className="boardCard" key={story.id}>
            <div className="boardCardHead"><div><div className="micro">COLUMN {i+1}</div><button className="storyLink" onClick={()=>setSelectedId(story.id)}>{story.company}</button><div className="mutedSmall">{story.outcome}</div></div><button className="removeBtn" onClick={()=>removeBoard(story.id)}>×</button></div>
            <BoardSection title="Best Use"><p>{story.angle}</p></BoardSection>
            <BoardSection title="Proof"><ul>{story.proof.slice(0,3).map(p=><li key={p}>{p}</li>)}</ul></BoardSection>
            <BoardSection title="Discovery Angle"><p>How are you currently solving {story.pains[0]?.toLowerCase()}?</p></BoardSection>
          </article>)}
          <article className="boardCard combined">
            <div className="micro blue">COMBINED STORY</div><h3>Summary Narrative</h3><p className="mutedSmall">Use this as the bridge across the selected proof points.</p>
            <div className="combinedCallout">These stories work together because they show the same operating problem from different angles. Use one as the anchor, then layer the others in as adjacent proof rather than presenting them as isolated examples.</div>
            <BoardSection title="Combined Narrative"><pre>{boardNarrative}</pre></BoardSection>
            <button className={copied==='summary'?'successBtn full':'primaryBtn full'} onClick={()=>copy(boardNarrative,'summary')}>{copied==='summary'?'Copied Summary':'Copy Combined Summary'}</button>
          </article>
        </div>
      </section>
    </div> : <div className="mainLayout">
      <aside className="sidebar">
        <div className="sideTitle">STORY MODES</div>
        <button className="sideNav active">✦ <span>Best-fit Recommendations</span><b>{bestFit.length}</b></button>
        <button className="sideNav">▤ <span>All Stories</span><b>{STORIES.length}</b></button>
        <button className="sideNav">⌁ <span>Pain Matcher</span><b>{pains.length}</b></button>
        <FilterBlock label="Client Pain"><Select value={pain} onChange={setPain} options={['All',...pains]}/></FilterBlock>
        <FilterBlock label="Buyer Persona"><Select value={buyer} onChange={setBuyer} options={['All',...buyers]}/></FilterBlock>
        <FilterBlock label="Industry"><Select value={industry} onChange={setIndustry} options={['All',...industries]}/></FilterBlock>
        <div className="scoreNote">Score = pain + persona + industry + search relevance + proof depth.</div>
      </aside>
      <StoryList query={query} setQuery={setQuery} buyer={buyer} setBuyer={setBuyer} pain={pain} setPain={setPain} industry={industry} setIndustry={setIndustry} buyers={buyers} pains={pains} industries={industries} stories={filtered} selectedId={selectedId} setSelectedId={setSelectedId} boardIds={boardIds} addBoard={addBoard} bestFit={bestFit}/>
      <main className="detailPane">
        {selected?<>
          <div className="detailHead"><div className="micro blue">FICTIONALIZED PORTFOLIO STORY</div><h2>{selected.company} — {selected.outcome}</h2><div className="badges"><span>{selected.industry}</span>{selected.pains.map(p=><span key={p}>{p}</span>)}</div></div>
          <div className="detailActions"><button className={inBoard?'successBtn':'primaryBtn'} disabled={inBoard||board.length>=4} onClick={()=>addBoard(selected)}>{inBoard?'Added to Storyboard':board.length>=4?'Storyboard Full':'Add to Storyboard'}</button></div>
          <DetailCard title="Target Audiences"><p><b>Primary:</b> {selected.buyers.join('; ')}</p></DetailCard>
          <section className="plainSection"><div className="sectionLabel">WHAT ACTUALLY HAPPENED</div><p>{selected.situation}</p></section>
          <section className="proofBox"><div className="sectionLabel green">KEY OUTCOMES / PROOF</div><ul>{selected.proof.map(p=><li key={p}>{p}</li>)}</ul></section>
          <section className="angleBox"><div className="sectionLabel blue">BEST STORY ANGLE</div><p>{selected.angle}</p></section>
          <section className="plainSection"><div className="sectionLabel">WHY IT MATTERS</div><p>{selected.why}</p></section>
          <section className="copyBuilder"><div className="copyHead"><div className="sectionLabel">COPY BUILDER</div><div className="modeTabs"><Mode mode="talk" current={mode} setMode={setMode} label="Talk"/><Mode mode="questions" current={mode} setMode={setMode} label="Questions"/><Mode mode="proof" current={mode} setMode={setMode} label="Proof"/><Mode mode="demo" current={mode} setMode={setMode} label="Demo"/></div></div><pre>{generated}</pre><button className={copied==='draft'?'successBtn full':'primaryBtn full'} onClick={()=>copy(generated,'draft')}>{copied==='draft'?'Copied!':'Copy Active Draft'}</button></section>
        </>:<div className="empty">No story matches the current filters.</div>}
      </main>
    </div>}
  </div>
}

function StoryList({query,setQuery,industry,setIndustry,industries,stories,selectedId,setSelectedId,boardIds,addBoard,bestFit=[],compact=false}){
  return <section className="storyList">
    <div className="listControls"><div className="searchWrap"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search stories, pains, outcomes, phrases..."/>{query&&<button onClick={()=>setQuery('')}>×</button>}</div><label><span>Industry</span><Select value={industry} onChange={setIndustry} options={['All',...industries]}/></label></div>
    {!compact&&bestFit.length>0&&<div className="bestFit"><div className="bestHead"><span>★ BEST-FIT</span><small>{stories.length} matches</small></div>{bestFit.map((s,i)=><button key={s.id} onClick={()=>setSelectedId(s.id)}><b>{i+1}. {s.company}</b><em>Score {s.matchScore}</em><small>{s.angle}</small></button>)}</div>}
    <div className="storyRows">{stories.map(s=><div className={selectedId===s.id?'storyRow selected':'storyRow'} key={s.id}><button className="rowMain" onClick={()=>setSelectedId(s.id)}><div className="rowMeta"><span>{s.company} · {s.industry}</span><b>{s.matchScore}</b></div><h4>{s.outcome}</h4><div className="rowTags">{s.pains.slice(0,2).map(p=><span key={p}>{p}</span>)}</div><p>→ {s.proof[0]}</p></button><button className={boardIds.includes(s.id)?'boardAdd added':'boardAdd'} disabled={boardIds.includes(s.id)||boardIds.length>=4} onClick={()=>addBoard(s)}>{boardIds.includes(s.id)?'Added':boardIds.length>=4?'Full':'+ Board'}</button></div>)}</div>
  </section>
}

function Select({value,onChange,options}){return <select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>}
function FilterBlock({label,children}){return <div className="filterBlock"><div className="sideTitle">{label}</div>{children}</div>}
function DetailCard({title,children}){return <section className="detailCard"><div className="sectionLabel">{title}</div>{children}</section>}
function BoardSection({title,children}){return <section className="boardSection"><div className="sectionLabel">{title}</div>{children}</section>}
function Mode({mode,current,setMode,label}){return <button className={current===mode?'active':''} onClick={()=>setMode(mode)}>{label}</button>}
