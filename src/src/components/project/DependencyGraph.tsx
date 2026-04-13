/**
 * DependencyGraph.tsx — Interactive SVG Task Dependency Visualisation
 *
 * Layout algorithm:
 *  1. Computes topological levels for each node using DFS
 *     (nodes with no dependencies = level 0; dependents = level n+1)
 *  2. Places nodes in horizontal rows by level
 *  3. Guarantees minimum 160px horizontal spacing between node centres
 *  4. SVG width expands to fit the widest row; container is horizontally scrollable
 *  5. Dashed separator lines are drawn between levels
 *
 * Animated edges:
 *  - Parent is 'in_progress' → amber flowing dashes animate along the edge
 *  - Parent is 'done' → green flowing dashes animate along the edge
 *  - Parent is 'todo' → static dim line
 *
 * Node visuals:
 *  - Colour by status: green (done), amber (in_progress), teal (todo), red (blocked)
 *  - Outer ring colour by priority: solid (high), dashed (medium/low)
 *  - Animated pulse ring on in_progress nodes
 *  - Spinning dashed ring on blocked nodes
 *
 * Interaction:
 *  - Hover: highlights connected nodes, dims unconnected
 *  - Click: opens detail panel (Waits for / Unlocks relationships)
 *
 * Canvas background: floating task-card shapes and progress-line pulses
 *  animated via requestAnimationFrame on a separate canvas element.
 *
 * layoutTick state: incremented by ResizeObserver to trigger re-layout
 *  when the container is resized (fixes the blank-graph-on-resize bug).
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DependencyGraphNode, DependencyGraphEdge } from '../../types';
import { Lock, CheckCircle2, Clock, Circle, AlertTriangle, X, GitBranch } from 'lucide-react';

interface Props { nodes: DependencyGraphNode[]; edges: DependencyGraphEdge[]; onNodeClick?: (id: string) => void; }
interface Pos { x: number; y: number; }

// ── Canvas animated background ───────────────────────────────────────────────
function AnimatedBg({ width, height }: { width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>();
  useEffect(() => {
    const c = ref.current; if (!c || !width || !height) return;
    const ctx = c.getContext('2d')!; c.width = width; c.height = height;
    const cards = Array.from({ length: 10 }, (_, i) => ({
      x: Math.random() * width, y: Math.random() * height,
      w: 52 + Math.random() * 32, h: 22 + Math.random() * 10,
      vx: (Math.random() - .5) * .15, vy: (Math.random() - .5) * .15,
      a: .025 + Math.random() * .03, seed: i,
    }));
    const pulses = Array.from({ length: 8 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      len: 40 + Math.random() * 80, ang: Math.random() * Math.PI * 2,
      vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18,
      a: .05 + Math.random() * .06, p: Math.random(), sp: .004 + Math.random() * .003,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      cards.forEach(c2 => {
        ctx.save(); ctx.globalAlpha = c2.a;
        ctx.strokeStyle = '#3E8A6E'; ctx.lineWidth = 1; ctx.fillStyle = 'rgba(45,99,82,.10)';
        const r = 3;
        ctx.beginPath();
        ctx.moveTo(c2.x+r,c2.y); ctx.arcTo(c2.x+c2.w,c2.y,c2.x+c2.w,c2.y+c2.h,r);
        ctx.arcTo(c2.x+c2.w,c2.y+c2.h,c2.x,c2.y+c2.h,r); ctx.arcTo(c2.x,c2.y+c2.h,c2.x,c2.y,r);
        ctx.arcTo(c2.x,c2.y,c2.x+c2.w,c2.y,r); ctx.closePath(); ctx.fill(); ctx.stroke();
        for (let l = 0; l < 2; l++) {
          const lw = (c2.w-6)*(.4+.5*((c2.seed*7+l*3)%10)/10);
          ctx.fillStyle='#3E8A6E'; ctx.globalAlpha=c2.a*1.5; ctx.fillRect(c2.x+5,c2.y+6+l*7,lw,2);
        }
        ctx.restore();
        c2.x+=c2.vx; c2.y+=c2.vy;
        if(c2.x<-c2.w) c2.x=width+5; if(c2.x>width+c2.w) c2.x=-c2.w;
        if(c2.y<-c2.h) c2.y=height+5; if(c2.y>height+c2.h) c2.y=-c2.h;
      });
      pulses.forEach(p => {
        p.p=(p.p+p.sp)%1;
        const ex=p.x+Math.cos(p.ang)*p.len, ey=p.y+Math.sin(p.ang)*p.len;
        ctx.save();
        const g=ctx.createLinearGradient(p.x,p.y,ex,ey);
        g.addColorStop(0,'rgba(62,138,110,0)'); g.addColorStop(Math.max(0,p.p-.12),'rgba(62,138,110,0)');
        g.addColorStop(p.p,`rgba(125,219,184,${p.a*3})`); g.addColorStop(Math.min(1,p.p+.12),'rgba(62,138,110,0)');
        g.addColorStop(1,'rgba(62,138,110,0)'); ctx.strokeStyle=g; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(ex,ey); ctx.stroke(); ctx.restore();
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>width) p.vx*=-1; if(p.y<0||p.y>height) p.vy*=-1;
      });
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { if(raf.current) cancelAnimationFrame(raf.current); };
  }, [width, height]);
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" />;
}

// ── Animated edge ─────────────────────────────────────────────────────────────
function Edge({ from, to, fromStatus, active }: { from: Pos; to: Pos; fromStatus: string; active: boolean }) {
  const R = 46;
  const dx=to.x-from.x, dy=to.y-from.y, dist=Math.sqrt(dx*dx+dy*dy);
  if (dist < 1) return null;
  const sx=from.x+dx*R/dist, sy=from.y+dy*R/dist;
  const ex=to.x-dx*R/dist,   ey=to.y-dy*R/dist;
  const mx=(sx+ex)/2, my=(sy+ey)/2 - Math.abs(dy)*.22 - 18;
  const d=`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
  const pl=dist*1.1;
  const col = fromStatus==='done'?'#3EBD8A':fromStatus==='in_progress'?'#E8993C':active?'#7DDBB8':'#2D6352';
  const flowing = fromStatus==='done'||fromStatus==='in_progress';
  const markId = fromStatus==='done'?'url(#ag-done)':fromStatus==='in_progress'?'url(#ag-prog)':active?'url(#ag-hov)':'url(#ag-def)';
  return (
    <g>
      {active && <path d={d} fill="none" stroke={col} strokeWidth={8} strokeOpacity={.12} strokeLinecap="round"/>}
      <path d={d} fill="none" stroke={col} strokeWidth={active?2.5:1.5} strokeOpacity={active?1:.65}
        markerEnd={markId} strokeLinecap="round" style={{transition:'stroke .3s'}}/>
      {flowing && (
        <path d={d} fill="none" stroke={fromStatus==='done'?'#7DDBB8':'#F5C97A'}
          strokeWidth={2.5} strokeLinecap="round" strokeOpacity={.85}
          strokeDasharray={`${pl*.16} ${pl*.84}`}>
          <animate attributeName="stroke-dashoffset" from={`${pl}`} to="0"
            dur={fromStatus==='done'?'1.5s':'2s'} repeatCount="indefinite"/>
        </path>
      )}
    </g>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const DependencyGraph: React.FC<Props> = ({ nodes, edges, onNodeClick }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [bgSize, setBgSize] = useState({ w: 900, h: 560 });
  const [svgSize, setSvgSize] = useState({ w: 900, h: 560 });
  const [positions, setPos]   = useState<Record<string, Pos>>({});
  const [layoutTick, setLayoutTick] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const NODE_R  = 48;
  const H_GAP   = 160; // min horizontal gap between node centres
  const V_GAP   = 140; // vertical gap between levels
  const PAD     = 80;  // outer padding

  // ── Topological level layout ──────────────────────────────────────────────
  useEffect(() => {
    if (!nodes.length) return;

    const levels: Record<string, number> = {};
    const vis = new Set<string>();
    const calcLvl = (id: string): number => {
      if (levels[id] !== undefined) return levels[id];
      if (vis.has(id)) return 0;
      vis.add(id);
      const deps = edges.filter(e => e.to === id).map(e => e.from);
      levels[id] = deps.length ? Math.max(...deps.map(calcLvl)) + 1 : 0;
      return levels[id];
    };
    nodes.forEach(n => calcLvl(n.id));

    const rows: Record<number, string[]> = {};
    nodes.forEach(n => { const l = levels[n.id] || 0; (rows[l] ||= []).push(n.id); });

    const maxLevel = Math.max(...Object.values(levels), 0);

    // Compute min SVG width needed: widest row × H_GAP + 2×PAD
    const maxRowCount = Math.max(...Object.values(rows).map(r => r.length), 1);
    const minW = maxRowCount * H_GAP + PAD * 2;
    const minH = (maxLevel + 1) * V_GAP + PAD * 2;

    // Use outer container width if bigger
    const containerW = outerRef.current?.clientWidth || 900;
    const finalW = Math.max(minW, containerW);
    const finalH = Math.max(minH, 480);

    setSvgSize({ w: finalW, h: finalH });
    setBgSize({ w: containerW, h: finalH });

    const newPos: Record<string, Pos> = {};
    Object.entries(rows).forEach(([lvl, ids]) => {
      const level = Number(lvl);
      const count = ids.length;
      // Evenly spread nodes across finalW
      const spacing = Math.max(H_GAP, (finalW - PAD * 2) / count);
      const totalW  = (count - 1) * spacing;
      const startX  = (finalW - totalW) / 2;
      ids.forEach((id, i) => {
        newPos[id] = { x: startX + i * spacing, y: PAD + level * V_GAP };
      });
    });
    setPos(newPos);
  }, [nodes, edges, layoutTick]);

  // ResizeObserver — increment tick to trigger re-layout (NOT setPos({}) which breaks rendering)
  useEffect(() => {
    const el = outerRef.current; if (!el) return;
    const ro = new ResizeObserver(() => {
      if (nodes.length) setLayoutTick(t => t + 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [nodes, edges]);

  const getStyle = (n: DependencyGraphNode) => {
    if (n.status==='done')        return { fill:'#1a4a35', stroke:'#3EBD8A', glow:'#3EBD8A' };
    if (n.isBlocked)              return { fill:'#3a1a1a', stroke:'#E05252', glow:'#E05252' };
    if (n.status==='in_progress') return { fill:'#3a2a10', stroke:'#E8993C', glow:'#E8993C' };
    return { fill:'#0f2820', stroke:'#3E8A6E', glow:'#3E8A6E' };
  };
  const priCol = (p: string) => p==='high'?'#E05252':p==='medium'?'#E8993C':'#3EBD8A';
  const isConn = (id: string) => {
    const a = selected || hovered; if (!a) return true; if (a===id) return true;
    return edges.some(e => (e.from===a&&e.to===id)||(e.to===a&&e.from===id));
  };
  const wrapLabel = (s: string) => {
    const w = s.split(' '); const ls: string[] = []; let cur = '';
    for (const ww of w) {
      const c = cur ? `${cur} ${ww}` : ww;
      if (c.length <= 11) { cur = c; } else { if (cur) ls.push(cur); cur = ww; if (ls.length >= 2) break; }
    }
    if (cur && ls.length < 2) ls.push(cur);
    if (ls.length===2 && s.length > ls.join(' ').length+2) ls[1]=ls[1].slice(0,9)+'…';
    return ls.slice(0, 2);
  };

  if (!nodes.length) return (
    <div ref={outerRef} className="relative w-full rounded-2xl overflow-hidden border border-brand-border bg-brand-surface/40 flex items-center justify-center" style={{ minHeight:400 }}>
      <AnimatedBg width={bgSize.w} height={bgSize.h} />
      <div className="relative z-10 flex flex-col items-center text-brand-muted space-y-3">
        <GitBranch className="w-10 h-10 opacity-30" />
        <p className="text-sm text-center px-4">No tasks yet — create tasks to see them in the graph.</p>
      </div>
    </div>
  );

  const R = NODE_R;

  return (
    <div ref={outerRef} className="relative w-full rounded-2xl overflow-hidden border border-brand-border bg-brand-surface/30" style={{ minHeight: 460 }}>
      {/* Static background fixed to visible area */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatedBg width={bgSize.w} height={bgSize.h} />
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-20 glass-panel rounded-xl px-3 py-2.5 text-xs space-y-1.5">
        <p className="text-brand-muted font-semibold uppercase tracking-wider mb-1" style={{ fontSize: 10 }}>Legend</p>
        {[['bg-[#3EBD8A]','Done'],['bg-[#E8993C]','In Progress'],['bg-[#3E8A6E]','To Do'],['bg-[#E05252]','Blocked']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c}`}/><span className="text-brand-muted">{l}</span></div>
        ))}
      </div>

      {/* Stats */}
      <div className="absolute top-3 left-3 z-20 glass-panel rounded-xl px-3 py-2 text-xs text-brand-muted">
        <span className="text-white font-semibold">{nodes.length}</span> tasks · <span className="text-white font-semibold">{edges.length}</span> connections
      </div>

      {/* Horizontally scrollable graph */}
      <div ref={innerRef} className="overflow-x-auto overflow-y-hidden w-full relative z-10" style={{ minHeight: svgSize.h }}>
        <svg width={svgSize.w} height={svgSize.h} style={{ display: 'block' }}>
          <defs>
            <marker id="ag-done" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#3EBD8A"/></marker>
            <marker id="ag-prog" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#E8993C"/></marker>
            <marker id="ag-def"  markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#2D6352"/></marker>
            <marker id="ag-hov"  markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#7DDBB8"/></marker>
          </defs>

          {/* Horizontal separator lines between levels */}
          {(() => {
            const levelYs = new Set<number>();
            Object.values(positions).forEach(p => levelYs.add(p.y));
            const sortedYs = Array.from(levelYs).sort((a,b) => a-b);
            return sortedYs.slice(0, -1).map((y, i) => {
              const nextY = sortedYs[i + 1];
              const midY  = (y + nextY) / 2;
              return (
                <line key={i} x1={PAD/2} y1={midY} x2={svgSize.w - PAD/2} y2={midY}
                  stroke="#1C3D35" strokeWidth={1} strokeDasharray="6 4" strokeOpacity={0.5} />
              );
            });
          })()}

          {/* Edges */}
          {edges.map(edge => {
            const f=positions[edge.from], t=positions[edge.to];
            if (!f||!t) return null;
            const fn=nodes.find(n=>n.id===edge.from);
            const active=(selected||hovered)===edge.from||(selected||hovered)===edge.to;
            const dim=!isConn(edge.from)||!isConn(edge.to);
            return (
              <g key={`${edge.from}-${edge.to}`} style={{opacity:dim?.1:1,transition:'opacity .2s'}}>
                <Edge from={f} to={t} fromStatus={fn?.status||'todo'} active={active}/>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const pos=positions[node.id]; if (!pos) return null;
            const {fill,stroke,glow}=getStyle(node);
            const isHov=hovered===node.id, isSel=selected===node.id;
            const dim=!isConn(node.id);
            const Rr=isHov||isSel?R+4:R;
            const lines=wrapLabel(node.label);
            return (
              <g key={node.id} transform={`translate(${pos.x},${pos.y})`}
                style={{opacity:dim?.15:1,transition:'opacity .2s',cursor:'pointer'}}
                onMouseEnter={()=>setHovered(node.id)} onMouseLeave={()=>setHovered(null)}
                onClick={()=>{setSelected(p=>p===node.id?null:node.id);onNodeClick?.(node.id);}}>

                {isSel&&<circle r={Rr+13} fill="none" stroke={stroke} strokeWidth={2} strokeOpacity={.28}
                  style={{filter:`drop-shadow(0 0 12px ${glow})`}}/>}
                <circle r={Rr+7} fill="none" stroke={priCol(node.priority)} strokeWidth={1.5}
                  strokeDasharray={node.priority==='high'?'0':'4 3'} strokeOpacity={.5}/>
                <circle r={Rr} fill={fill} stroke={stroke} strokeWidth={isHov||isSel?2.5:1.5}
                  style={{filter:isHov||isSel?`drop-shadow(0 0 12px ${glow}99)`:'none',transition:'r .15s'}}/>

                {node.isBlocked&&(
                  <circle r={Rr+2} fill="none" stroke="#E05252" strokeWidth={1.5} strokeDasharray="5 3" strokeOpacity={.8}>
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="7s" repeatCount="indefinite"/>
                  </circle>
                )}
                {node.status==='in_progress'&&!node.isBlocked&&(
                  <circle r={Rr+1} fill="none" stroke="#E8993C" strokeWidth={1.5} strokeOpacity={.5}>
                    <animate attributeName="r" values={`${Rr+1};${Rr+14};${Rr+1}`} dur="2.4s" repeatCount="indefinite"/>
                    <animate attributeName="stroke-opacity" values=".5;0;.5" dur="2.4s" repeatCount="indefinite"/>
                  </circle>
                )}
                {node.status==='done'&&<circle r={Rr-8} fill="#3EBD8A" fillOpacity={.13}/>}

                <text textAnchor="middle" fill="#E4F5EE" fontSize={11} fontWeight={600}
                  fontFamily="'Plus Jakarta Sans',sans-serif" style={{pointerEvents:'none'}}>
                  {lines.map((line,i)=>(
                    <tspan key={i} x={0} dy={i===0?(lines.length===1?'0.35em':`${-(lines.length-1)*7}px`):'14px'}>{line}</tspan>
                  ))}
                </text>

                <g transform={`translate(0,${Rr-10})`}>
                  <rect x={-22} y={-9} width={44} height={17} rx={8.5}
                    fill={node.status==='done'?'#3EBD8A':node.isBlocked?'#E05252':node.status==='in_progress'?'#E8993C':'#2D6352'} fillOpacity={.93}/>
                  <text textAnchor="middle" y={3.5} fontSize={8} fill="white" fontWeight={700}
                    fontFamily="'Inter',sans-serif" style={{pointerEvents:'none'}}>
                    {node.status==='done'?'DONE':node.isBlocked?'BLOCKED':node.status==='in_progress'?'ACTIVE':'TODO'}
                  </text>
                </g>

                {(node.dependsOn?.length||0)>0&&(
                  <g transform={`translate(${Rr-6},${-Rr+6})`}>
                    <circle r={12} fill="#0B1A16" stroke={stroke} strokeWidth={1.5}/>
                    <text textAnchor="middle" y="0.35em" fontSize={9} fill={stroke} fontWeight={700} style={{pointerEvents:'none'}}>
                      {node.dependsOn!.length}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected&&(()=>{
          const n=nodes.find(nd=>nd.id===selected); if(!n) return null;
          const deps=edges.filter(e=>e.to===selected).map(e=>nodes.find(nd=>nd.id===e.from)).filter(Boolean) as DependencyGraphNode[];
          const blks=edges.filter(e=>e.from===selected).map(e=>nodes.find(nd=>nd.id===e.to)).filter(Boolean) as DependencyGraphNode[];
          const {stroke}=getStyle(n);
          return (
            <motion.div key="panel" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}}
              className="absolute bottom-3 right-3 z-30 glass-panel rounded-2xl p-4 w-60 shadow-2xl"
              style={{border:`1px solid ${stroke}55`}}>
              <button onClick={()=>setSelected(null)} className="absolute top-3 right-3 p-1 rounded text-brand-muted hover:text-white">
                <X className="w-3.5 h-3.5"/>
              </button>
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{background:stroke+'22',border:`2px solid ${stroke}`}}>
                  {n.status==='done'?<CheckCircle2 className="w-4 h-4" style={{color:stroke}}/>
                    :n.isBlocked?<Lock className="w-4 h-4" style={{color:stroke}}/>
                    :n.status==='in_progress'?<Clock className="w-4 h-4" style={{color:stroke}}/>
                    :<Circle className="w-4 h-4" style={{color:stroke}}/>}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-xs">{n.label}</h4>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize
                      ${n.priority==='high'?'bg-brand-danger/20 text-brand-danger':n.priority==='medium'?'bg-brand-warning/20 text-brand-warning':'bg-sky-500/20 text-sky-400'}`}>
                      {n.priority}</span>
                    {n.isBlocked&&<span className="text-xs text-brand-danger flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>Blocked</span>}
                  </div>
                </div>
              </div>
              {deps.length>0&&(
                <div className="mb-2">
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Waits for</p>
                  {deps.map(d=>{const ds=getStyle(d);return(
                    <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1"
                      style={{background:ds.fill+'cc',border:`1px solid ${ds.stroke}35`}}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:ds.stroke}}/>
                      <span className="text-xs text-brand-text truncate flex-1">{d.label}</span>
                      {d.status==='done'&&<CheckCircle2 className="w-3 h-3 text-[#3EBD8A] flex-shrink-0"/>}
                    </div>
                  );})}
                </div>
              )}
              {blks.length>0&&(
                <div>
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Unlocks</p>
                  {blks.map(b=>{const bs=getStyle(b);return(
                    <div key={b.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1"
                      style={{background:bs.fill+'cc',border:`1px solid ${bs.stroke}35`}}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:bs.stroke}}/>
                      <span className="text-xs text-brand-text truncate flex-1">{b.label}</span>
                      {b.isBlocked&&<Lock className="w-3 h-3 text-brand-danger flex-shrink-0"/>}
                    </div>
                  );})}
                </div>
              )}
              {deps.length===0&&blks.length===0&&<p className="text-xs text-brand-muted text-center py-1">No connections.</p>}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default DependencyGraph;
