(function(){
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile navigation */
  var toggle=document.querySelector('.nav-toggle');
  var nav=document.querySelector('.main-nav');
  function closeNav(){
    if(!toggle||!nav) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    document.body.classList.remove('mobile-nav-open');
  }
  if(toggle&&nav){
    toggle.addEventListener('click',function(){
      var open=nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded',String(open));
      document.body.classList.toggle('mobile-nav-open',open && window.innerWidth<=767);
    });
    nav.querySelectorAll('a').forEach(function(link){link.addEventListener('click',closeNav);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape') closeNav();});
    document.addEventListener('click',function(e){
      if(!nav.classList.contains('open')) return;
      if(!nav.contains(e.target)&&!toggle.contains(e.target)) closeNav();
    });
    window.addEventListener('resize',function(){if(window.innerWidth>1024) closeNav();},{passive:true});
  }

  /* Quiet sticky-header state */
  var header=document.querySelector('.site-header');
  function updateHeader(){if(header) header.classList.toggle('scrolled',window.scrollY>10);}
  updateHeader();
  window.addEventListener('scroll',updateHeader,{passive:true});

  /* Product preview: click / keyboard / gentle automatic finding rotation */
  var preview=document.querySelector('[data-interactive-preview]');
  if(preview){
    var rows=Array.prototype.slice.call(preview.querySelectorAll('.review-row'));
    var panel=preview.querySelector('.evidence-panel');
    var activeIndex=Math.max(0,rows.findIndex(function(row){return row.classList.contains('selected');}));
    var timer=null;
    function selectRow(index,userInitiated){
      if(!rows.length) return;
      activeIndex=(index+rows.length)%rows.length;
      rows.forEach(function(row,i){row.classList.toggle('selected',i===activeIndex);row.setAttribute('aria-pressed',String(i===activeIndex));});
      var row=rows[activeIndex];
      if(panel){
        panel.classList.add('updating');
        window.setTimeout(function(){
          var cells=row.children;
          var title=row.querySelector('b');
          var copy=row.getAttribute('data-detail')||'Finding detail.';
          var h=panel.querySelector('h3');
          var p=panel.querySelector(':scope > p');
          var values=panel.querySelector('.evidence-values');
          if(h&&title) h.textContent=title.textContent;
          if(p) p.textContent=copy;
          if(values&&cells.length>=4){
            var labels=['Accounts','TB / source','Difference'];
            var vals=[cells[1].textContent,cells[2].textContent,cells[3].textContent];
            values.innerHTML=labels.map(function(label,i){return '<div'+(i===2?' class="difference"':'')+'><span>'+label+'</span><strong>'+vals[i]+'</strong></div>';}).join('');
          }
          panel.classList.remove('updating');
        },reduceMotion?0:120);
      }
      if(userInitiated) restartRotation();
    }
    rows.forEach(function(row,i){
      row.addEventListener('click',function(){selectRow(i,true);});
      row.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRow(i,true);}});
    });
    function restartRotation(){
      if(timer){clearInterval(timer);timer=null;}
      if(reduceMotion||rows.length<2) return;
      timer=setInterval(function(){selectRow(activeIndex+1,false);},4300);
    }
    preview.addEventListener('mouseenter',function(){if(timer){clearInterval(timer);timer=null;}});
    preview.addEventListener('mouseleave',restartRotation);
    preview.addEventListener('focusin',function(){if(timer){clearInterval(timer);timer=null;}});
    preview.addEventListener('focusout',function(e){if(!preview.contains(e.relatedTarget)) restartRotation();});
    selectRow(activeIndex,false);
    restartRotation();

    /* Pointer tilt: tiny and only on precise pointing devices */
    if(!reduceMotion&&window.matchMedia&&window.matchMedia('(hover:hover) and (pointer:fine)').matches){
      var stage=preview.closest('.product-stage');
      if(stage){
        var raf=0;
        stage.addEventListener('pointermove',function(e){
          if(raf) cancelAnimationFrame(raf);
          raf=requestAnimationFrame(function(){
            var rect=stage.getBoundingClientRect();
            var x=(e.clientX-rect.left)/rect.width-.5;
            var y=(e.clientY-rect.top)/rect.height-.5;
            preview.style.setProperty('--tilt-y',(x*1.25).toFixed(2)+'deg');
            preview.style.setProperty('--tilt-x',(-y*.8).toFixed(2)+'deg');
          });
        });
        stage.addEventListener('pointerleave',function(){preview.style.setProperty('--tilt-y','0deg');preview.style.setProperty('--tilt-x','0deg');});
      }
    }
  }

  /* FAQ: progressive accordion; all copy remains present without JS. */
  document.querySelectorAll('.faq-item').forEach(function(item,index){
    var heading=item.querySelector('h2');
    if(!heading) return;
    var content=[];
    var node=heading.nextSibling;
    while(node){var next=node.nextSibling;content.push(node);node=next;}
    var answer=document.createElement('div');answer.className='faq-answer';
    var inner=document.createElement('div');inner.className='faq-answer-inner';
    content.forEach(function(n){inner.appendChild(n);});answer.appendChild(inner);item.appendChild(answer);
    var text=heading.textContent;
    heading.textContent='';
    var button=document.createElement('button');button.type='button';button.className='faq-question';button.setAttribute('aria-expanded',index===0?'true':'false');button.innerHTML='<span></span><i class="faq-plus" aria-hidden="true"></i>';button.querySelector('span').textContent=text;heading.appendChild(button);
    item.classList.add('enhanced');if(index===0) item.classList.add('is-open');
    button.addEventListener('click',function(){var open=item.classList.toggle('is-open');button.setAttribute('aria-expanded',String(open));});
  });

  /* Lazy Cal.com embed */
  var booking=document.querySelector('[data-cal-embed]');
  if(booking){
    var calUrl=booking.getAttribute('data-cal-url');
    var trigger=document.querySelector('[data-load-cal]');
    function loadCal(){
      if(!calUrl || calUrl.indexOf('{{')!==-1) return;
      if(booking.dataset.loaded==='true') return;
      var iframe=document.createElement('iframe');
      iframe.src=calUrl;
      iframe.title='Book an Accurao Reviewer beta call';
      iframe.loading='lazy';
      iframe.style.width='100%';
      iframe.style.minHeight='720px';
      iframe.style.border='0';
      booking.innerHTML='';booking.appendChild(iframe);booking.dataset.loaded='true';
    }
    if(trigger) trigger.addEventListener('click',loadCal);
    /* The external booking provider is loaded only after an explicit click. */
  }
})();

/* Keep primary navigation state explicit on every static page. */
(function(){
  function basename(path){
    var clean=(path||'').split('#')[0].split('?')[0];
    var part=clean.substring(clean.lastIndexOf('/')+1);
    return part||'index.html';
  }
  var current=basename(window.location.pathname);
  document.querySelectorAll('.main-nav a, .nav-cta').forEach(function(link){
    var href=link.getAttribute('href');
    if(!href || href.charAt(0)==='#') return;
    if(basename(href)===current){
      link.setAttribute('aria-current','page');
    }else if(link.classList.contains('nav-cta') || link.closest('.main-nav')){
      link.removeAttribute('aria-current');
    }
    link.addEventListener('click',function(){
      if(link.closest('.main-nav')){
        document.querySelectorAll('.main-nav a').forEach(function(item){item.classList.remove('is-clicked');});
        link.classList.add('is-clicked');
      }
    });
  });
})();

/* Reading progress. Motion is handled by the content-only system at the end of this file. */
(function(){
  var progress=document.querySelector('.scroll-progress');
  if(!progress){
    progress=document.createElement('div');
    progress.className='scroll-progress';
    progress.setAttribute('aria-hidden','true');
    document.body.appendChild(progress);
  }
  var progressRaf=0;
  function updateProgress(){
    progressRaf=0;
    var doc=document.documentElement;
    var total=Math.max(1,doc.scrollHeight-window.innerHeight);
    var pct=Math.max(0,Math.min(1,window.scrollY/total));
    progress.style.transform='scaleX('+pct.toFixed(4)+')';
  }
  function requestProgressUpdate(){if(!progressRaf) progressRaf=requestAnimationFrame(updateProgress);}
  updateProgress();
  window.addEventListener('scroll',requestProgressUpdate,{passive:true});
  window.addEventListener('resize',requestProgressUpdate,{passive:true});
})();

/* Refinement v5: supporting-copy presentation is handled in CSS. */

/* Refinement v7: context-specific visual explanations — no generic repeated ornaments. */
(function(){
  function visual(type){
    var el=document.createElement('div');
    el.className='context-visual context-'+type;
    el.setAttribute('aria-hidden','true');

    if(type==='mismatch'){
      el.innerHTML='\        <div class="cv-mismatch">\
          <div class="cv-sheet"><small>Balance sheet</small><b>Updated</b><i></i><i></i><i class="accent-line"></i></div>\
          <div class="cv-not-equal"><strong>≠</strong><small>out of sync</small></div>\
          <div class="cv-sheet"><small>Related note</small><b>Still old</b><i></i><i class="short"></i><i></i></div>\
        </div>\
        <div class="cv-caption"><span class="cv-dot"></span>Face changed. Note did not.</div>';
    } else if(type==='checks-stack'){
      el.innerHTML='\
        <div class="checks-stack-scene" data-checks-stack>\
          <svg class="checks-stack-paths" viewBox="0 0 700 430" aria-hidden="true" role="presentation">\
            <path class="checks-path checks-path-exact" d="M320 114 C360 114 378 154 394 181" />\
            <path class="checks-path checks-path-assisted" d="M314 249 C360 249 379 215 394 200" />\
            <path class="checks-path checks-path-result" d="M458 190 C485 190 500 190 520 190" />\
          </svg>\
          <div class="checks-paper-stack" aria-hidden="true"><i></i><i></i></div>\
          <button class="checks-layer checks-layer-exact" type="button" data-checks-layer="exact" aria-label="Structured checks: arithmetic and consistency">\
            <span class="checks-status exact-status">✓</span><span class="checks-layer-copy"><strong>Structured checks</strong><small>Arithmetic and consistency</small></span>\
          </button>\
          <button class="checks-layer checks-layer-assisted" type="button" data-checks-layer="assisted" aria-label="AI-assisted mapping: trial balance and disclosures">\
            <span class="checks-status assisted-status"></span><span class="checks-layer-copy"><strong>AI-assisted mapping</strong><small>Trial balance and disclosures</small></span>\
          </button>\
          <button class="checks-ai-core" type="button" data-checks-layer="reviewer" aria-label="Accurao Reviewer connects structured checks and AI-assisted mapping"><span>AI</span></button>\
          <div class="checks-stack-insight" aria-live="polite">\
            <span class="checks-insight-icon" aria-hidden="true"></span>\
            <div><strong data-checks-insight-title>Prompts to confirm</strong><p data-checks-insight-body>Reviewer decides.</p></div>\
          </div>\
        </div>';
    } else if(type==='split'){
      el.innerHTML='\        <div class="cv-split">\
          <div class="cv-lane exact"><div class="lane-head"><b>Exact</b><span>Deterministic</span></div><div class="lane-row"><span>TB tie-out</span><i>Tied</i></div><div class="lane-row"><span>Note-to-face</span><i>Tied</i></div></div>\
          <div class="cv-lane assisted"><div class="lane-head"><b>AI-assisted</b><span>Evidence</span></div><div class="evidence-lines"><i></i><i></i><i class="short"></i></div><div class="confirm-chip">Confirm</div></div>\
        </div>\
        <div class="cv-caption">Same inputs → same exact result. Disclosure evidence → reviewer confirms.</div>';
    } else if(type==='flow'){
      el.innerHTML='\        <div class="cv-flow">\
          <div class="flow-inputs"><div class="flow-doc"><b>PDF</b><span>Financial statements</span></div><div class="flow-doc"><b>TB</b><span>Trial balance</span></div></div>\
          <div class="flow-arrow">→</div>\
          <div class="flow-engine"><span></span><b>Review checks</b><small>disclosures · mapping · consistency</small></div>\
          <div class="flow-arrow">→</div>\
          <div class="flow-output"><b>Findings</b><span>Confirm</span><span>Dismiss</span><span>Correct</span></div>\
        </div>';
    } else if(type==='security'){
      el.innerHTML='\        <div class="cv-security">\
          <div class="secure-node"><i class="lock-mark"></i><b>Your account</b><small>per-user access</small></div>\
          <span class="secure-link"></span>\
          <div class="secure-node"><b>Reviewer</b><small>document + TB</small></div>\
          <span class="secure-link amber"></span>\
          <div class="secure-node"><b>Anthropic API</b><small>document text for disclosure checks</small></div>\
        </div>';
    } else if(type==='faq'){
      el.innerHTML='\        <div class="cv-faq">\
          <div><span>01</span><b>Client data</b><i>+</i></div>\
          <div><span>02</span><b>Your review</b><i>+</i></div>\
          <div><span>03</span><b>Files & systems</b><i>+</i></div>\
        </div>';
    } else if(type==='beta'){
      el.innerHTML='\        <div class="cv-beta">\
          <div class="calendar-mini"><div></div><b>20</b><span>MIN</span></div>\
          <div class="beta-brief"><b>Review selected files</b><span>Assess useful findings.</span><span>Identify what is missing.</span><small>Closed beta conversation</small></div>\
        </div>';
    }
    return el;
  }

  function addContext(box,type,before){
    if(!box || box.querySelector('.context-visual')) return;
    var v=visual(type);
    if(before) box.insertBefore(v,before); else box.appendChild(v);
    box.classList.add('has-context-visual');
  }

  /* Homepage: only sections where a visual explains the exact copy. */
  var problem=document.querySelector('.page-home .editorial-head');
  if(problem) addContext(problem,'mismatch',problem.querySelector('.editorial-copy'));

  document.querySelectorAll('.page-home .feature-heading').forEach(function(box){
    var heading=(box.querySelector('h2')||{}).textContent||'';
    if(/Financial statements in\. Structured findings out/i.test(heading)) addContext(box,'flow',box.querySelector(':scope > p'));
    /* The audience section already has its own two content panels. */
  });

  var finalBox=document.querySelector('.page-home .final-cta-inner');
  if(finalBox) addContext(finalBox,'beta',finalBox.querySelector('.hero-actions'));

  /* Inner-page hero visuals are unique to the page subject. */
  var hero=document.querySelector('.page-hero > .container');
  if(hero){
    var title=(hero.querySelector('h1')||{}).textContent||'';
    var type=null;
    /* The What It Checks page intentionally uses a simple, text-only hero. */
    if(/what it checks/i.test(title)) type=null;
    else if(/how it works/i.test(title)) type=null;
    else if(/^security$/i.test(title.trim())) type=null; /* Security has its own selected hero illustration in security.html. */
    else if(/^faq$/i.test(title.trim())) type=null; /* FAQ uses a simple text-only hero. */
    else if(/^about$/i.test(title.trim())) type=null; /* About uses a simple text-only hero. */
    else if(/beta call/i.test(title)) type='beta';
    if(type) addContext(hero,type,hero.querySelector('.lede'));
  }
})();

/* v12: premium interactive accounting-review stack. */
(function(){
  var stack=document.querySelector('[data-layer-stack]');
  if(!stack) return;
  var cards=Array.prototype.slice.call(stack.querySelectorAll('[data-layer]'));
  var title=stack.querySelector('[data-stack-insight-title]');
  var body=stack.querySelector('[data-stack-insight-body]');
  var copy={
    accounts:{title:'Read-only financial statements',body:'The statutory financial statements are reviewed as a PDF. Accurao Reviewer does not edit the document.'},
    source:{title:'Map the trial balance to the statements',body:'AI-assisted mapping highlights potential gaps and omissions for review.'},
    reviewer:{title:'Connected financial statement review',body:'Disclosures, schedules, comparative information and arithmetic are reviewed together.'}
  };
  var pinned=null;
  function activate(key){
    stack.dataset.active=key||'';
    cards.forEach(function(card){card.classList.toggle('is-active',card.dataset.layer===key);});
    if(key&&copy[key]){if(title) title.textContent=copy[key].title;if(body) body.textContent=copy[key].body;}
    else{if(title) title.textContent='Connected review';if(body) body.textContent='Review figures, disclosures and supporting information together.';}
  }
  cards.forEach(function(card){
    var key=card.dataset.layer;
    card.addEventListener('mouseenter',function(){if(!pinned) activate(key);});
    card.addEventListener('mouseleave',function(){if(!pinned) activate(null);});
    card.addEventListener('focus',function(){activate(key);});
    card.addEventListener('blur',function(){if(!pinned) activate(null);});
    card.addEventListener('click',function(){
      pinned=(pinned===key)?null:key;
      activate(pinned);
    });
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&pinned){pinned=null;activate(null);}});
  activate(null);
})();


/* v17: interactive What-it-checks stack — scoped to the credibility page only. */
(function(){
  var stack=document.querySelector('.page-what-it-checks [data-checks-stack]');
  if(!stack) return;
  var items=Array.prototype.slice.call(stack.querySelectorAll('[data-checks-layer]'));
  var title=stack.querySelector('[data-checks-insight-title]');
  var body=stack.querySelector('[data-checks-insight-body]');
  var copy={
    exact:{title:'Structured arithmetic and consistency checks',body:'Casting, roll-ups and cross-statement relationships are checked consistently.'},
    assisted:{title:'AI-assisted mapping',body:'Trial balance and disclosure information is mapped to surface potential gaps.'},
    reviewer:{title:'Structured review findings',body:'Accurao Reviewer connects the checks without changing the financial statements or replacing professional judgement.'}
  };
  var pinned=null;
  function activate(key){
    stack.dataset.active=key||'';
    items.forEach(function(item){item.classList.toggle('is-active',item.dataset.checksLayer===key);});
    if(key&&copy[key]){
      if(title) title.textContent=copy[key].title;
      if(body) body.textContent=copy[key].body;
    }else{
      if(title) title.textContent='Prompts to confirm';
      if(body) body.textContent='Reviewer decides.';
    }
  }
  items.forEach(function(item){
    var key=item.dataset.checksLayer;
    item.addEventListener('mouseenter',function(){if(!pinned) activate(key);});
    item.addEventListener('mouseleave',function(){if(!pinned) activate(null);});
    item.addEventListener('focus',function(){activate(key);});
    item.addEventListener('blur',function(){if(!pinned) activate(null);});
    item.addEventListener('click',function(){pinned=(pinned===key)?null:key;activate(pinned);});
  });
  var checksRaf=0,checksPointer=null;
  stack.addEventListener('mousemove',function(e){
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    checksPointer={x:e.clientX,y:e.clientY};
    if(checksRaf) return;
    checksRaf=requestAnimationFrame(function(){
      checksRaf=0;
      if(!checksPointer) return;
      var r=stack.getBoundingClientRect();
      var x=((checksPointer.x-r.left)/r.width-.5)*2;
      var y=((checksPointer.y-r.top)/r.height-.5)*2;
      stack.style.setProperty('--checks-rx',(-y*1.2).toFixed(2)+'deg');
      stack.style.setProperty('--checks-ry',(x*1.5).toFixed(2)+'deg');
    });
  },{passive:true});
  stack.addEventListener('mouseleave',function(){stack.style.setProperty('--checks-rx','0deg');stack.style.setProperty('--checks-ry','0deg');});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&pinned){pinned=null;activate(null);}});
  activate(null);
})();


/* v24: scroll-triggered premium illustration motion and card activation. */
(function(){
  var visuals=Array.prototype.slice.call(document.querySelectorAll('[data-premium-illustration]'));
  if(!visuals.length) return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setVisible(el,on){el.classList.toggle('is-illustration-active',!!on&&!reduce);}
  if(!reduce&&'IntersectionObserver' in window){
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){setVisible(entry.target,entry.isIntersecting&&entry.intersectionRatio>.18);});
    },{threshold:[0,.18,.35,.65],rootMargin:'-4% 0px -4% 0px'});
    visuals.forEach(function(v){observer.observe(v);});
  }else if(!reduce){visuals.forEach(function(v){setVisible(v,true);});}

  visuals.forEach(function(visual){
    var cards=Array.prototype.slice.call(visual.querySelectorAll('[data-illustration-card],.premium-interactive-card'));
    cards=cards.filter(function(card,idx,self){return self.indexOf(card)===idx;});
    var pinned=null;
    function activate(card,on){if(card) card.classList.toggle('is-active',!!on);}
    cards.forEach(function(card){
      if(!card.hasAttribute('tabindex')&&card.classList.contains('premium-interactive-card')) card.setAttribute('tabindex','0');
      card.addEventListener('mouseenter',function(){if(!pinned) activate(card,true);});
      card.addEventListener('mouseleave',function(){if(!pinned) activate(card,false);});
      card.addEventListener('focus',function(){activate(card,true);});
      card.addEventListener('blur',function(){if(pinned!==card) activate(card,false);});
      card.addEventListener('click',function(){
        if(pinned&&pinned!==card) activate(pinned,false);
        if(pinned===card){activate(card,false);pinned=null;}else{pinned=card;activate(card,true);}
      });
    });
    visual.addEventListener('keydown',function(e){if(e.key==='Escape'&&pinned){activate(pinned,false);pinned=null;}});
  });
})();

/* v25: content-only scroll motion.
   Headings remain completely static; supporting copy, lists, actions and visuals animate.
   Uses individual CSS translate so existing 3D / hover transforms remain untouched. */
(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items=[];
  var seen=[];
  var headingSelector='h1,h2,h3,h4,h5,h6,.eyebrow,.reference-kicker,.side-label';

  function register(selector,dir,baseDelay,step,parallax){
    var nodes=Array.prototype.slice.call(document.querySelectorAll(selector));
    nodes.forEach(function(el,i){
      if(!el || el.matches(headingSelector) || seen.indexOf(el)!==-1) return;
      /* Never animate the internal cards that already have their own transform / hover system. */
      if(el.matches('.premium-interactive-card,.interactive-layer,.reference-card,.how-input,.how-review-card,.how-findings,.how-insight,.wicp-card,.wicp-ai,.wicp-result,.security-v-card')) return;
      seen.push(el);
      var d=dir;
      if(Array.isArray(dir)) d=dir[i%dir.length];
      d=d||'up';
      el.classList.add('content-motion','content-from-'+d);
      el.style.setProperty('--content-delay',Math.max(0,(baseDelay||0)+(step||0)*i)+'ms');
      if(parallax) el.setAttribute('data-content-parallax','true');
      items.push(el);
    });
  }

  /* Hero supporting content — headings intentionally excluded. */
  register('.page-home .reference-match-sub','left',20,0,false);
  register('.page-home .reference-match-actions > *','up',90,70,false);
  register('.page-home .reference-beta-note','up',210,0,false);
  register('.page-home .reference-match-visual','right',90,0,true);
  register('.page-home .reference-benefits > div',['left','up','up','right'],35,55,false);

  register('.page-what-it-checks #wic-page-hero .lede','left',25,0,false);
  register('.page-what-it-checks #wic-page-hero .wicp-visual','right',90,0,true);
  register('.page-how-it-works .how-hero-lede','left',25,0,false);
  register('.page-how-it-works .how-hero-visual','right',90,0,true);
  register('.page-security .security-hero-lede','left',25,0,false);
  register('.page-security .security-quick-item','up',105,65,false);
  register('.page-security .security-hero-visual','right',90,0,true);
  register('.page-hero .lede','left',25,0,false);
  register('.page-hero .hero-actions > *','up',90,70,false);

  /* Home page content. */
  register('.page-home .intro-section .editorial-copy > p','right',30,85,false);
  register('.page-home .intro-section .context-visual','left',70,0,true);
  register('.page-home .feature-band .check-group > .group-note',['left','right'],25,0,false);
  register('.page-home .feature-band .check-group > .check-list > li',['left','left','left','right','right','right'],65,62,false);
  register('.page-home .feature-band .working > ul > li','up',30,55,false);
  register('.page-home .feature-band .closing-line','up',70,0,false);
  register('.page-home .feature-band .section-link > a','right',70,0,false);
  register('.page-home .steps-section .feature-heading > p','right',30,0,false);
  register('.page-home .steps-section .feature-heading > .context-visual','left',70,0,true);
  register('.page-home .steps-section .attio-steps article .step-num','up',25,65,false);
  register('.page-home .steps-section .attio-steps article > p','up',80,70,false);
  register('.page-home .steps-section .quiet-block > p','up',30,0,false);
  register('.page-home .audience-section .audience-item > p',['left','right'],35,60,false);
  register('.page-home .final-cta-inner > p','up',25,65,false);
  register('.page-home .final-cta-inner > .context-visual','right',80,0,true);
  register('.page-home .final-cta-inner > .hero-actions > *','up',165,45,false);

  /* What it checks content. */
  register('.page-what-it-checks main > .section .check-group > .group-note',['left','right'],20,0,false);
  register('.page-what-it-checks main > .section .check-group > .check-list > li',['left','left','left','right','right','right'],55,58,false);
  register('.page-what-it-checks main > .section .working > ul > li','up',30,55,false);
  register('.page-what-it-checks main > .section .closing-line','up',70,0,false);
  register('.page-what-it-checks main > .section .quiet-block > p','up',35,0,false);

  /* How it works content. */
  register('.page-how-it-works .steps .step > .step-number','left',15,55,false);
  register('.page-how-it-works .steps .step > div > p','right',55,65,false);
  register('.page-how-it-works .section-label .measure > ul > li','up',25,55,false);
  register('.page-how-it-works .section-label .measure > p','up',115,0,false);
  register('.page-how-it-works .quiet-block > p','up',30,0,false);

  /* Security, About, Beta, FAQ and 404 supporting content. */
  register('.page-security .security-overview-section .measure > p','right',25,80,false);
  register('.page-security .security-facts .fact > p',['left','right'],30,55,false);
  register('.page-about .editorial-copy > p','right',25,80,false);
  register('.page-about .security-facts .fact > p',['left','right'],30,55,false);
  register('.page-about .quiet-block > p','up',25,0,false);
  register('.page-beta .beta-copy > p','right',25,70,false);
  register('.page-beta .beta-copy > button','up',135,0,false);
  register('.page-beta .security-facts .fact > p',['left','right'],30,55,false);
  register('.page-beta .booking-placeholder > p','up',25,0,false);
  register('.page-faq .faq-answer-inner > p','up',20,55,false);
  register('.page-not-found .hero-actions > *','up',75,45,false);

  if(!items.length) return;

  /* Reduced-motion users receive the complete static layout. */
  if(reduce){
    items.forEach(function(el){el.classList.add('is-content-visible','content-motion-settled');});
    return;
  }

  document.documentElement.classList.add('content-motion-ready');

  function reveal(el){
    if(el.classList.contains('is-content-visible')) return;
    el.classList.add('is-content-visible');
    var delay=parseInt(el.style.getPropertyValue('--content-delay'),10)||0;
    window.setTimeout(function(){
      el.classList.add('content-motion-settled');
      requestParallax();
    },delay+980);
  }

  if('IntersectionObserver' in window){
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){reveal(entry.target);observer.unobserve(entry.target);}
      });
    },{threshold:.1,rootMargin:'0px 0px -7% 0px'});
    requestAnimationFrame(function(){requestAnimationFrame(function(){items.forEach(function(el){observer.observe(el);});});});
  }else{
    items.forEach(reveal);
  }

  /* Very light scroll-synchronised drift for illustrations only. */
  var parallaxItems=items.filter(function(el){return el.hasAttribute('data-content-parallax');});
  var parallaxRaf=0;
  function updateParallax(){
    parallaxRaf=0;
    if(!parallaxItems.length) return;
    var vw=window.innerWidth||document.documentElement.clientWidth;
    var vh=window.innerHeight||document.documentElement.clientHeight;
    var amp=vw<=520?5:vw<=800?8:14;
    parallaxItems.forEach(function(el){
      if(!el.classList.contains('content-motion-settled')) return;
      var r=el.getBoundingClientRect();
      if(r.bottom<-80||r.top>vh+80) return;
      var center=r.top+r.height/2;
      var normalized=(center-vh/2)/Math.max(vh,.001);
      var y=Math.max(-amp,Math.min(amp,-normalized*amp*1.7));
      el.style.setProperty('--content-parallax-y',y.toFixed(2)+'px');
    });
  }
  function requestParallax(){if(!parallaxRaf) parallaxRaf=requestAnimationFrame(updateParallax);}
  requestParallax();
  window.addEventListener('scroll',requestParallax,{passive:true});
  window.addEventListener('resize',requestParallax,{passive:true});
})();


/* v26: interactive focus layer for supporting content only.
   - Desktop: hover focus + tiny cursor-follow movement.
   - Touch: short press state, tap-to-focus, clear on scroll/tap elsewhere.
   - Headings and all illustration systems are intentionally excluded. */
(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer=window.matchMedia&&window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var headingSelector='h1,h2,h3,h4,h5,h6,.eyebrow,.reference-kicker,.side-label';
  var illustrationSelector='[data-premium-illustration],[data-content-parallax],[data-illustration-card],[data-layer-stack],.premium-scroll-illustration,.premium-interactive-card,.interactive-layer,.reference-card,.context-visual,.reference-match-visual,.how-hero-visual,.wicp-visual,.security-hero-visual,.product-preview';
  var interactive=[];
  var magnetic=[];
  var activeTouch=null;
  var touchStart=null;
  var scrollStart=0;

  function eligible(el){
    if(!el || !el.matches) return false;
    if(el.matches(headingSelector) || el.closest(headingSelector)) return false;
    if(el.matches(illustrationSelector) || el.closest(illustrationSelector)) return false;
    if(el.closest('header,footer,nav')) return false;
    return true;
  }

  function addInteractive(el){
    if(!eligible(el) || interactive.indexOf(el)!==-1) return;
    /* Avoid nested focus surfaces: the smaller text leaf wins. */
    if(el.querySelector&&el.querySelector('p,li')) return;
    el.classList.add('content-interactive');
    interactive.push(el);
  }

  Array.prototype.slice.call(document.querySelectorAll('main p, main li, main .reference-benefits > div, main .security-quick-item, main .steps .step-number')).forEach(addInteractive);

  /* If a parent owns two or more direct content surfaces, hovering one softly
     de-emphasises its siblings to create a clear focus state. */
  var parents=[];
  interactive.forEach(function(el){if(el.parentElement&&parents.indexOf(el.parentElement)===-1) parents.push(el.parentElement);});
  parents.forEach(function(parent){
    var direct=Array.prototype.filter.call(parent.children,function(child){return child.classList&&child.classList.contains('content-interactive');});
    if(direct.length>1) parent.classList.add('content-focus-group');
  });

  /* CTAs keep their existing visual hover treatment; only their movement is
     shared with the content system. */
  Array.prototype.slice.call(document.querySelectorAll('main a.button, main .hero-actions a, main .section-link a, main button:not(.nav-toggle):not(.faq-question)')).forEach(function(el){
    if(!eligible(el) || el.closest(illustrationSelector)) return;
    if(magnetic.indexOf(el)!==-1) return;
    el.classList.add('content-magnetic');
    magnetic.push(el);
  });

  function setFocused(el,on){
    if(!el) return;
    el.classList.toggle('is-content-focused',!!on);
    var group=el.parentElement&&el.parentElement.classList.contains('content-focus-group')?el.parentElement:null;
    if(group) group.classList.toggle('is-content-focusing',!!on);
  }
  function clearTouchFocus(except){
    if(activeTouch&&activeTouch!==except) setFocused(activeTouch,false);
    if(!except) activeTouch=null;
  }

  interactive.forEach(function(el){
    el.addEventListener('mouseenter',function(){
      if(!finePointer) return;
      setFocused(el,true);
    });
    el.addEventListener('mouseleave',function(){
      if(!finePointer) return;
      setFocused(el,false);
      el.style.setProperty('--mag-x','0px');
      el.style.setProperty('--mag-y','0px');
    });
    el.addEventListener('pointerdown',function(e){
      if(e.pointerType==='touch'||e.pointerType==='pen'){
        touchStart={x:e.clientX,y:e.clientY,el:el};
        scrollStart=window.scrollY;
        el.classList.add('is-content-pressed');
      }
    });
    el.addEventListener('pointerup',function(e){
      if(e.pointerType!=='touch'&&e.pointerType!=='pen') return;
      el.classList.remove('is-content-pressed');
      if(!touchStart||touchStart.el!==el) return;
      var moved=Math.hypot(e.clientX-touchStart.x,e.clientY-touchStart.y);
      var scrolled=Math.abs(window.scrollY-scrollStart);
      touchStart=null;
      if(moved>11||scrolled>7) return;
      var wasActive=activeTouch===el&&el.classList.contains('is-content-focused');
      clearTouchFocus(el);
      if(wasActive){setFocused(el,false);activeTouch=null;}
      else{setFocused(el,true);activeTouch=el;}
    });
    el.addEventListener('pointercancel',function(){el.classList.remove('is-content-pressed');touchStart=null;});
  });

  /* Tiny cursor-follow movement is deliberately capped to 2.4px / 1.8px. */
  if(finePointer&&!reduce){
    interactive.concat(magnetic).forEach(function(el){
      var raf=0;
      el.addEventListener('pointermove',function(e){
        if(raf) cancelAnimationFrame(raf);
        raf=requestAnimationFrame(function(){
          raf=0;
          var r=el.getBoundingClientRect();
          if(!r.width||!r.height) return;
          var nx=((e.clientX-r.left)/r.width)-.5;
          var ny=((e.clientY-r.top)/r.height)-.5;
          el.style.setProperty('--mag-x',(nx*4.8).toFixed(2)+'px');
          el.style.setProperty('--mag-y',(ny*3.6).toFixed(2)+'px');
        });
      });
      el.addEventListener('pointerleave',function(){
        if(raf){cancelAnimationFrame(raf);raf=0;}
        el.style.setProperty('--mag-x','0px');
        el.style.setProperty('--mag-y','0px');
      });
    });
  }

  magnetic.forEach(function(el){
    el.addEventListener('pointerdown',function(e){if(e.pointerType==='touch'||e.pointerType==='pen') el.classList.add('is-content-pressed');});
    ['pointerup','pointercancel','pointerleave'].forEach(function(type){el.addEventListener(type,function(){el.classList.remove('is-content-pressed');});});
  });

  document.addEventListener('pointerdown',function(e){
    if(e.pointerType!=='touch'&&e.pointerType!=='pen') return;
    if(activeTouch&&!activeTouch.contains(e.target)) clearTouchFocus(null);
  },true);
  window.addEventListener('scroll',function(){
    if(activeTouch&&Math.abs(window.scrollY-scrollStart)>7) clearTouchFocus(null);
  },{passive:true});
  document.addEventListener('keydown',function(e){if(e.key==='Escape') clearTouchFocus(null);});
})();
