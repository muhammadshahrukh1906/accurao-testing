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
    if('IntersectionObserver' in window && calUrl && calUrl.indexOf('{{')===-1){
      var observer=new IntersectionObserver(function(entries){if(entries[0].isIntersecting){loadCal();observer.disconnect();}},{rootMargin:'180px'});
      observer.observe(booking);
    }
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

/* Corporate scroll-reveal system and reading progress. */
(function(){
  var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Thin reading-progress rule. */
  var progress=document.createElement('div');
  progress.className='scroll-progress';
  progress.setAttribute('aria-hidden','true');
  document.body.appendChild(progress);
  var progressRaf=0;
  function updateProgress(){
    progressRaf=0;
    var doc=document.documentElement;
    var total=Math.max(1,doc.scrollHeight-window.innerHeight);
    var pct=Math.max(0,Math.min(1,window.scrollY/total));
    progress.style.transform='scaleX('+pct.toFixed(4)+')';
  }
  function requestProgressUpdate(){
    if(!progressRaf) progressRaf=requestAnimationFrame(updateProgress);
  }
  updateProgress();
  window.addEventListener('scroll',requestProgressUpdate,{passive:true});
  window.addEventListener('resize',requestProgressUpdate,{passive:true});

  if(reduceMotion) return;

  /* The hero already has its own load animation. Everything below reveals on entry. */
  var groups=[
    '.intro-section .editorial-head > *',
    '.feature-band .feature-heading > *',
    '.feature-band .feature-card',
    '.feature-band .section-link',
    '.steps-section .feature-heading > *',
    '.steps-section .attio-steps article',
    '.steps-section .quiet-block',
    '.audience-section .feature-heading > *',
    '.audience-section .audience-item',
    '.final-cta .final-cta-inner > *',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .check-group',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .working',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .closing-line',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .quiet-block',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .step',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .fact',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .faq-item',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .founder-photo',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .founder-copy > *',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .beta-panel > *',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .booking-shell',
    'main > .section:not(.intro-section):not(.feature-band):not(.steps-section):not(.audience-section):not(.final-cta) .legal-shell > *'
  ];

  var seen=[];
  groups.forEach(function(selector){
    document.querySelectorAll(selector).forEach(function(el){
      if(seen.indexOf(el)===-1) seen.push(el);
    });
  });

  seen.forEach(function(el,index){
    el.classList.add('scroll-reveal');
    var direction=index%4;
    if(direction===0) el.classList.add('reveal-left');
    else if(direction===1) el.classList.add('reveal-right');
    else el.classList.add('reveal-up');
    el.style.setProperty('--reveal-delay',Math.min((index%3)*95,190)+'ms');
  });

  document.documentElement.classList.add('motion-ready');

  if(!('IntersectionObserver' in window)){
    seen.forEach(function(el){el.classList.add('is-visible');});
    return;
  }

  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.16,rootMargin:'0px 0px -10% 0px'});

  seen.forEach(function(el){
    /* Content already comfortably inside the initial viewport should not blink out after page load. */
    if(el.getBoundingClientRect().top < window.innerHeight*.92) el.classList.add('is-visible');
    else observer.observe(el);
  });
})();

/* Ensure editorial label/content pairs on inner pages also participate in the reveal system. */
(function(){
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var extras=Array.prototype.slice.call(document.querySelectorAll('.section-label > *, .editorial-placeholder'));
  extras=extras.filter(function(el){return !el.classList.contains('scroll-reveal');});
  if(!extras.length) return;
  extras.forEach(function(el,i){
    el.classList.add('scroll-reveal',i%2===0?'reveal-left':'reveal-right');
    el.style.setProperty('--reveal-delay',(i%2)*100+'ms');
  });
  if(!('IntersectionObserver' in window)){
    extras.forEach(function(el){el.classList.add('is-visible');});
    return;
  }
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    });
  },{threshold:.16,rootMargin:'0px 0px -10% 0px'});
  extras.forEach(function(el){
    if(el.getBoundingClientRect().top < window.innerHeight*.92) el.classList.add('is-visible');
    else observer.observe(el);
  });
})();

/* Refinement v5: supporting-copy presentation is handled in CSS. */

/* Refinement v7: context-specific visual explanations — no generic repeated ornaments. */
(function(){
  function visual(type){
    var el=document.createElement('div');
    el.className='context-visual context-'+type;
    el.setAttribute('aria-hidden','true');

    if(type==='mismatch'){
      el.innerHTML='\
        <div class="cv-top"><span>Late adjustment</span><em>Review gap</em></div>\
        <div class="cv-mismatch">\
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
          <button class="checks-layer checks-layer-exact" type="button" data-checks-layer="exact" aria-label="Exact checks: deterministic arithmetic and matching">\
            <span class="checks-status exact-status">✓</span><span class="checks-layer-copy"><strong>Exact checks</strong><small>Arithmetic &amp; tie-outs</small></span>\
          </button>\
          <button class="checks-layer checks-layer-assisted" type="button" data-checks-layer="assisted" aria-label="AI-assisted checks: disclosure presence with evidence to confirm">\
            <span class="checks-status assisted-status"></span><span class="checks-layer-copy"><strong>AI-assisted checks</strong><small>Disclosure checks</small></span>\
          </button>\
          <button class="checks-ai-core" type="button" data-checks-layer="reviewer" aria-label="Accurao Reviewer combines exact checks and AI-assisted disclosure assessment"><span>AI</span></button>\
          <div class="checks-stack-insight" aria-live="polite">\
            <span class="checks-insight-icon" aria-hidden="true"></span>\
            <div><strong data-checks-insight-title>Designed to catch what slips through</strong><p data-checks-insight-body>Across numbers and disclosures.</p></div>\
          </div>\
        </div>';
    } else if(type==='split'){
      el.innerHTML='\
        <div class="cv-top"><span>Two kinds of check</span><em>Different confidence</em></div>\
        <div class="cv-split">\
          <div class="cv-lane exact"><div class="lane-head"><b>Exact</b><span>Deterministic</span></div><div class="lane-row"><span>TB tie-out</span><i>Tied</i></div><div class="lane-row"><span>Note-to-face</span><i>Tied</i></div></div>\
          <div class="cv-lane assisted"><div class="lane-head"><b>AI-assisted</b><span>Evidence</span></div><div class="evidence-lines"><i></i><i></i><i class="short"></i></div><div class="confirm-chip">Confirm</div></div>\
        </div>\
        <div class="cv-caption">Same inputs → same exact result. Disclosure evidence → reviewer confirms.</div>';
    } else if(type==='flow'){
      el.innerHTML='\
        <div class="cv-top"><span>Independent review layer</span><em>Read-only</em></div>\
        <div class="cv-flow">\
          <div class="flow-inputs"><div class="flow-doc"><b>PDF</b><span>Finished accounts</span></div><div class="flow-doc"><b>TB</b><span>Trial balance</span></div></div>\
          <div class="flow-arrow">→</div>\
          <div class="flow-engine"><span></span><b>Review checks</b><small>tie · compare · assess</small></div>\
          <div class="flow-arrow">→</div>\
          <div class="flow-output"><b>Findings</b><span>Confirm</span><span>Dismiss</span><span>Correct</span></div>\
        </div>';
    } else if(type==='security'){
      el.innerHTML='\
        <div class="cv-top"><span>Data path</span><em>Disclosure check only</em></div>\
        <div class="cv-security">\
          <div class="secure-node"><i class="lock-mark"></i><b>Your account</b><small>per-user access</small></div>\
          <span class="secure-link"></span>\
          <div class="secure-node"><b>Reviewer</b><small>document + TB</small></div>\
          <span class="secure-link amber"></span>\
          <div class="secure-node"><b>Anthropic API</b><small>document text for disclosure checks</small></div>\
        </div>';
    } else if(type==='faq'){
      el.innerHTML='\
        <div class="cv-top"><span>Common questions</span><em>Before the call</em></div>\
        <div class="cv-faq">\
          <div><span>01</span><b>Client data</b><i>+</i></div>\
          <div><span>02</span><b>Your review</b><i>+</i></div>\
          <div><span>03</span><b>Files & software</b><i>+</i></div>\
        </div>';
    } else if(type==='founder'){
      el.innerHTML='\
        <div class="cv-top"><span>Built from review work</span><em>Pre-beta</em></div>\
        <div class="cv-founder">\
          <div class="founder-monogram">MA</div>\
          <div><b>Momina Athar</b><span>ACA · Chartered Accountant</span><small>Reviewer by design — not an accounts production tool.</small></div>\
        </div>';
    } else if(type==='beta'){
      el.innerHTML='\
        <div class="cv-top"><span>Closed beta</span><em>20 minutes</em></div>\
        <div class="cv-beta">\
          <div class="calendar-mini"><div></div><b>20</b><span>MIN</span></div>\
          <div class="beta-brief"><b>Run reviewed files</b><span>Tell us what it found.</span><span>Tell us what it missed.</span><small>Call with Momina</small></div>\
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
    var label=(box.querySelector('.eyebrow')||{}).textContent||'';
    if(/what it checks/i.test(label)) addContext(box,'split',box.querySelector(':scope > p'));
    else if(/how it works/i.test(label)) addContext(box,'flow',box.querySelector(':scope > p'));
    /* Who it's for already has two audience panels; no decorative visual added. */
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
    accounts:{title:'Read-only finished accounts',body:'The signed or draft accounts are reviewed as a PDF. Accurao does not edit the document.'},
    source:{title:'Tie every figure back to source',body:'Every financial-statement line is traced back to the trial balance, with the difference shown.'},
    reviewer:{title:'AI-assisted, reviewer-decided',body:'Exact checks are deterministic. Disclosure presence is returned with evidence for you to confirm.'}
  };
  var pinned=null;
  function activate(key){
    stack.dataset.active=key||'';
    cards.forEach(function(card){card.classList.toggle('is-active',card.dataset.layer===key);});
    if(key&&copy[key]){if(title) title.textContent=copy[key].title;if(body) body.textContent=copy[key].body;}
    else{if(title) title.textContent='Independent by design';if(body) body.textContent='The accounts stay read-only. You decide what happens to every finding.';}
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
    exact:{title:'Exact where it can be exact',body:'Arithmetic and matching are deterministic — the same inputs give the same result every time.'},
    assisted:{title:'Evidence where judgement stays yours',body:'Disclosure presence is AI-assisted and returned as evidence for you to confirm, not as certainty.'},
    reviewer:{title:'One independent review layer',body:'Accurao combines both kinds of check without changing the finished accounts or replacing your judgement.'}
  };
  var pinned=null;
  function activate(key){
    stack.dataset.active=key||'';
    items.forEach(function(item){item.classList.toggle('is-active',item.dataset.checksLayer===key);});
    if(key&&copy[key]){
      if(title) title.textContent=copy[key].title;
      if(body) body.textContent=copy[key].body;
    }else{
      if(title) title.textContent='Designed to catch what slips through';
      if(body) body.textContent='Across numbers and disclosures.';
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
