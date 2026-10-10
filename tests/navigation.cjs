const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync('src/app.js', 'utf8');
const ids = ['home', 'about', 'projects', 'services', 'contact'];

// The shipped documents must be usable before any script runs.
for (const file of ['src/index.html', 'outputs/portfolio/dist/index.html']) {
  const html = fs.readFileSync(file, 'utf8');
  for (const id of ids) {
    const section = html.match(new RegExp(`<section class="page" id="${id}"[^>]*>`))[0];
    assert(!/\shidden(?:\s|>)/.test(section), `${file}: ${id} must be visible without JS`);
    assert(html.includes(`href="#${id}"`), `${file}: ${id} needs a native anchor`);
  }
  assert(/id="intro"[^>]* hidden>/.test(html));
  assert(/id="replay-intro"[^>]* hidden/.test(html));
  assert(!/<div class="desktop"[^>]* inert/.test(html));
}

function setup({hash = '', reduced = false, failAtCommit = false} = {}) {
  let document;
  const timers = new Map(), events = {}, errors = [], scrolls = [];
  let nextTimer = 0;
  function element(id, attributes = {}) {
    const classes = new Set();
    return {id, hidden:false, inert:false, attributes, events:{}, style:{},
      classList:{add(name){classes.add(name);}, remove(name){classes.delete(name);}, contains(name){return classes.has(name);}, toggle(name,on){on ? classes.add(name) : classes.delete(name);}},
      setAttribute(name,value){this.attributes[name]=value;}, getAttribute(name){return this.attributes[name];}, removeAttribute(name){delete this.attributes[name];},
      addEventListener(name,fn){this.events[name]=fn;},
      focus(){assert(!lookup.desktop.inert, 'Cannot focus inert content'); document.activeElement=this;},
      scrollIntoView(){this.scrolled=true;}, closest(){return this.page || null;}
    };
  }
  const lookup = {};
  const pages = ids.map(id => {
    const page = lookup[id] = element(id, {'aria-labelledby':`${id}-title`});
    page.page=page;
    const heading = lookup[`${id}-title`] = element(`${id}-title`);
    heading.page=page;
    return page;
  });
  const links = ids.map(id => Object.assign(element(`link-${id}`, {href:`#${id}`}), {dataset:{page:id}}));
  for (const id of ['main-content', 'intro', 'desktop', 'skip-intro', 'replay-intro', 'project-modal', 'project-modal-content', 'project-modal-close', 'project-results', 'project-empty', 'filters', 'skills-title']) lookup[id]=element(id);
  lookup['skills-title'].page=lookup.about;
  lookup.intro.hidden=true;
  lookup['skip-intro'].focus=()=>{document.activeElement=lookup['skip-intro'];};
  const progress = {style:{},offsetWidth:1};
  lookup.intro.querySelector=()=>progress;
  const controls=[lookup.filters,lookup['replay-intro']];
  controls.forEach(el=>{el.hidden=true;});
  document={body:{style:{}},documentElement:element('html'),getElementById:id=>lookup[id] || null,
    querySelectorAll:selector=>({'.page':pages,'[data-page]':links,'a[href^="#"]':links,'[data-js-only]':controls}[selector] || [])};
  if (failAtCommit) document.documentElement.classList.add=()=>{throw new Error('Injected initialization failure');};
  const location={hash};
  vm.runInNewContext(code, {document,location,scrollTo:options=>scrolls.push(options),matchMedia:()=>({matches:reduced}),setInterval(){},setTimeout(fn,delay){const id=++nextTimer;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),addEventListener:(name,fn)=>{events[name]=fn;},console:{error:(...args)=>errors.push(args)}});
  function tick(delay) {
    const pending=[...timers].find(([,timer])=>timer.delay===delay);
    assert(pending, `Expected timer ${delay}`);
    timers.delete(pending[0]); pending[1].fn();
  }
  return {lookup,document,pages,links,controls,timers,errors,scrolls,tick,go(hash){location.hash=hash;events.hashchange();}};
}

for (const reduced of [false,true]) {
  for (const hash of ['', '#about', '#skills-title', '#does-not-exist']) {
    const s=setup({hash,reduced});
    assert.equal(s.document.activeElement.id,'skip-intro');
    s.lookup['skip-intro'].events.click();
    s.lookup['skip-intro'].events.click(); // Double activation must not schedule another handoff.
    assert.equal(s.timers.size,1);
    s.tick(reduced ? 0 : 450);
    const expected=hash==='#skills-title' ? 'skills-title' : hash==='#about' ? 'about-title' : 'home-title';
    assert.equal(s.document.activeElement.id,expected);
    assert.equal(s.lookup[expected].scrolled,undefined,'Intro must not scroll past the page header');
    assert.equal(s.scrolls.at(-1).top,0);
    assert.equal(s.scrolls.at(-1).behavior,'instant');
    assert.equal(s.lookup.intro.hidden,true);
    assert.equal(s.lookup.desktop.inert,false);
    assert.equal(s.pages.filter(page=>!page.hidden).length,1);
    s.go('#contact');
    assert.equal(s.document.activeElement.id,'contact-title');
    assert.equal(s.lookup['contact-title'].scrolled,undefined,'Page navigation must not skip the header');
    assert.equal(s.scrolls.at(-1).top,0);
    s.lookup['replay-intro'].events.click();
    s.lookup.intro.events.keydown({key:'Escape'});
    s.tick(reduced ? 0 : 450);
    assert.equal(s.document.activeElement.id,'contact-title');
    assert.equal(s.scrolls.length,3,'Intro, navigation, and replay all return to the top');
  }
}
const automatic=setup();
automatic.go('#services'); // Do not move focus behind the open introduction.
assert.equal(automatic.document.activeElement.id,'skip-intro');
automatic.tick(1750); automatic.tick(450);
assert.equal(automatic.document.activeElement.id,'services-title');
assert.equal(automatic.scrolls.at(-1).top,0,'Automatic entry starts at the top');
automatic.go('#skills-title');
assert.equal(automatic.lookup['skills-title'].scrolled,true,'Nested links still scroll when used inside the workspace');

const navigation=setup();
navigation.tick(1750); navigation.tick(450);
for (const id of ids) {
  navigation.go('#' + id);
  assert.equal(navigation.scrolls.at(-1).top,0,`${id} opens at the top`);
  const count=navigation.scrolls.length;
  let prevented=false;
  navigation.links.find(link=>link.dataset.page===id).events.click({button:0,preventDefault(){prevented=true;}});
  assert(prevented,'Repeated page links must avoid native section scrolling');
  assert.equal(navigation.scrolls.length,count+1,`${id} resets when clicked again`);
  assert.equal(navigation.scrolls.at(-1).top,0);
}

const failed=setup({failAtCommit:true});
assert.equal(failed.errors.length,1);
assert(failed.pages.every(page=>!page.hidden));
assert(failed.controls.every(control=>control.hidden));
assert.equal(failed.lookup.intro.hidden,true);
assert.equal(failed.lookup.desktop.inert,false);
assert.equal(failed.timers.size,0);
failed.go('#contact');
assert(failed.pages.every(page=>!page.hidden), 'Native fallback must survive hash changes after an initialization failure');
console.log('Navigation checks passed: Enter, auto-entry, replay/Escape, deep links, reduced motion, repeated activation, main-edition static fallback, and initialization failure recovery.');
