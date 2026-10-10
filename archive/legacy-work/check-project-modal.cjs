const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
function element(extra = {}) {
  return Object.assign({events:{},addEventListener(name, fn){this.events[name] = fn;}}, extra);
}
const trigger = element({dataset:{projectModal:'project-spaltitude'},isConnected:true,focus(){this.focused = true;}});
const modal = element({open:false,scrollTop:20,showModal(){this.open=true;},close(){this.open=false;this.events.close();},getBoundingClientRect(){return {left:20,right:800,top:20,bottom:700};}});
modal.setAttribute = function(name, value){this[name]=value;};
const content = {replaceChildren(value){this.value=value;},querySelector(){return {id:'project-title-spaltitude'};}};
const closeButton = element();
const template = {content:{cloneNode(){return {project:'SPAltitude'};}}};
const lookup = {'project-modal':modal,'project-modal-content':content,'project-modal-close':closeButton,'project-spaltitude':template};
const document = {body:{style:{overflow:'auto'}},getElementById(id){return lookup[id] || null;},querySelectorAll(){return [trigger];}};
const js = fs.readFileSync('outputs/portfolio/dist/app.js','utf8');
vm.runInNewContext(js.slice(js.indexOf('  const projectModal ='),js.indexOf('  const projectFilters =')), {document});
const click = overrides => {
  const event = {button:0,prevented:false,preventDefault(){this.prevented=true;},...overrides};
  trigger.events.click(event);
  return event;
};
assert.equal(click({ctrlKey:true}).prevented,false);
assert.equal(modal.open,false);
assert.equal(click({}).prevented,true);
assert.equal(modal.open,true);
assert.equal(content.value.project,'SPAltitude');
assert.equal(modal['aria-labelledby'],'project-title-spaltitude');
assert.equal(modal.scrollTop,0);
assert.equal(document.body.style.overflow,'hidden');
modal.events.click({target:modal,clientX:40,clientY:40});
assert.equal(modal.open,true,'Click inside the dialog must not close it');
modal.events.click({target:modal,clientX:0,clientY:0});
assert.equal(modal.open,false);
assert.equal(document.body.style.overflow,'auto');
assert.equal(trigger.focused,true);
click({});closeButton.events.click();
assert.equal(modal.open,false);
click({});modal.close(); // Native Escape dispatches the same close event.
assert.equal(document.body.style.overflow,'auto');
const showModal = modal.showModal;modal.showModal=undefined;
assert.equal(click({}).prevented,false,'Unsupported dialog keeps the Behance fallback');
modal.showModal=showModal;trigger.dataset.projectModal='missing';
assert.equal(click({}).prevented,false,'Unknown project keeps the external fallback');
console.log('Modal checks passed: opening, template content, scroll lock/reset, backdrop, close button, focus return, modified-click and unsupported-browser fallbacks.');
