// ==========================================================================
// decor.js — Éléments purement visuels/décoratifs de la page.
// Aucune logique métier ici (dates, formulaire, Supabase...) : uniquement
// la construction de la guirlande et des ballons de plage flottants.
// Voir script.js pour toute la logique métier du site.
// ==========================================================================

// ---------- Guirlande (fanions) ----------
function shadeColor(hex, percent){
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + Math.round(255 * percent / 100);
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent / 100);
  let b = (num & 0x0000FF) + Math.round(255 * percent / 100);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + (0x1000000 + r*0x10000 + g*0x100 + b).toString(16).slice(1);
}

function buildGarland(){
  const flagColors = ['#FF6B4A','#FFC93C','#FF4F81','#00A6C9','#1E9E6B'];
  const flagsG = document.getElementById('flags');
  const flagsSvg = flagsG.ownerSVGElement;
  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
  flagColors.forEach((color, i)=>{
    const grad = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
    grad.setAttribute('id', `flagGrad-${i}`);
    grad.setAttribute('x1','0'); grad.setAttribute('y1','0');
    grad.setAttribute('x2','0'); grad.setAttribute('y2','1');
    const stops = [
      {offset:'0%', color: shadeColor(color, 45)},
      {offset:'50%', color: color},
      {offset:'100%', color: shadeColor(color, -35)},
    ];
    stops.forEach(s=>{
      const stop = document.createElementNS('http://www.w3.org/2000/svg','stop');
      stop.setAttribute('offset', s.offset);
      stop.setAttribute('stop-color', s.color);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);
  });
  flagsSvg.insertBefore(defs, flagsSvg.firstChild);

  const flagCount = 16;
  for(let i=0;i<flagCount;i++){
    const x = (1200/(flagCount-1))*i;
    const t = i/(flagCount-1);
    const y = 10 + Math.sin(Math.PI*t)*68;
    const tri = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    const w=26,h=38;
    tri.setAttribute('points', `${x-w/2},${y} ${x+w/2},${y} ${x},${y+h}`);
    tri.setAttribute('fill', `url(#flagGrad-${i%flagColors.length})`);
    tri.setAttribute('opacity','0.97');
    flagsG.appendChild(tri);

    // thin highlight stripe along the top edge for extra sheen
    const shine = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    shine.setAttribute('points', `${x-w/2+2},${y+2} ${x+w/2-2},${y+2} ${x},${y+h*0.32}`);
    shine.setAttribute('fill', '#ffffff');
    shine.setAttribute('opacity','0.22');
    flagsG.appendChild(shine);
  }
}

// ---------- Ballons de plage flottants ----------
function buildBeachBalls(){
  const beachBallPalettes = [
    ['#FF6B4A','#FFC93C','#fff'],
    ['#00A6C9','#FF4F81','#fff'],
    ['#1E9E6B','#FFC93C','#fff'],
    ['#FF4F81','#00A6C9','#fff'],
    ['#FFC93C','#FF6B4A','#fff'],
  ];
  const balloonField = document.getElementById('balloon-field');
  const balloonSpots = [
    {left:'4%', top:'8%', size:1},
    {left:'12%', top:'46%', size:0.75},
    {left:'90%', top:'6%', size:0.85},
    {left:'84%', top:'44%', size:1.1},
    {left:'50%', top:'2%', size:0.7},
  ];
  balloonSpots.forEach((spot,i)=>{
    const b = document.createElement('div');
    const [c1,c2,c3] = beachBallPalettes[i%beachBallPalettes.length];
    b.className = 'balloon';
    b.style.left = spot.left;
    b.style.top = spot.top;
    b.style.background = `
      radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9), rgba(255,255,255,0) 42%),
      radial-gradient(circle at 68% 74%, rgba(3,20,26,0.4), rgba(3,20,26,0) 55%),
      conic-gradient(${c1} 0deg 60deg, ${c3} 60deg 90deg, ${c2} 90deg 150deg, ${c3} 150deg 180deg, ${c1} 180deg 240deg, ${c3} 240deg 270deg, ${c2} 270deg 330deg, ${c3} 330deg 360deg)
    `;
    b.style.transform = `scale(${spot.size})`;
    b.style.animationDelay = (i*0.6)+'s';
    balloonField.appendChild(b);
  });
}

buildGarland();
buildBeachBalls();
