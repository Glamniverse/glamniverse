import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8')
function fixture({secure=true,xr}={}) {
  const nodes=new Map();let opened=0,created=0,started=0
  const document={querySelector(selector){
    if(!nodes.has(selector)){
      const classes=new Set(selector==='#portal-world'||selector==='#smash-info'?['hidden']:[])
      nodes.set(selector,{textContent:'',pause(){},classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(c,v){if(v)classes.add(c);else classes.delete(c)}}})
    }
    return nodes.get(selector)
  },querySelectorAll:()=>[]}
  const window={isSecureContext:secure,openPortalWorld(){opened++;document.querySelector('#portal-world').classList.remove('hidden')}}
  const code=source.slice(source.indexOf('let smashEntryRequest'),source.indexOf('window.openSmashTheHate = async'))
  const gate=Function('window','document','navigator','activeWorld','console',code+';return {check:checkVRExperienceSupport,dismiss:dismissSmashInfo}')(
    window,document,{xr},null,{warn(){}})
  const eyes=source.slice(source.indexOf('    async function openEyes()'),source.indexOf('    entry.onclick = openEyes'))
  const open=Function('window','document','deferUntilVRExit','checkVRExperienceSupport','disposeCurrentWorld','createAllEyesOnMe','createWorldLifecycle','startWorldAnimation',eyes+';return openEyes')(
    window,document,()=>false,gate.check,gate.dismiss,()=>{created++;return{}},()=>{},()=>started++)
  return {gate,open,nodes,document,counts:()=>({opened,created,started})}
}
test('unsupported All Eyes shows shared warning without constructing/loading game',async()=>{
  for(const options of [{},{secure:false,xr:{isSessionSupported:()=>{throw Error('must not query insecure XR')}}},{xr:{isSessionSupported:async()=>false}},{xr:{isSessionSupported:async()=>{throw Error('policy')}}}]){
    const f=fixture(options);await f.open()
    assert.match(f.nodes.get('#smash-support-message').textContent,/VR HEADSET REQUIRED/)
    assert.equal(f.nodes.get('#smash-info-title').textContent,'ALL EYES ON ME — VR FITNESS')
    assert.deepEqual(f.counts(),{opened:1,created:0,started:0})
    f.gate.dismiss();assert.equal(f.nodes.get('#smash-info').classList.contains('hidden'),true)
  }
})
test('compatible All Eyes reaches the unchanged world factory only after immersive support',async()=>{
  const calls=[];const f=fixture({xr:{isSessionSupported:async type=>{calls.push(type);return true}}})
  await f.open();assert.deepEqual(calls,['immersive-vr']);assert.equal(f.counts().created,1);assert.equal(f.counts().started,1)
  assert.equal(f.nodes.get('#smash-info').classList.contains('hidden'),true)
})
test('Back/close while support is pending cannot reopen All Eyes',async()=>{
  let resolve;const f=fixture({xr:{isSessionSupported:()=>new Promise(r=>resolve=r)}})
  const pending=f.open();f.gate.dismiss();resolve(true);await pending
  assert.equal(f.counts().created,0);assert.equal(f.nodes.get('#smash-info').classList.contains('hidden'),true)
})
test('shared panel restores original Smash copy and cancels older entry checks',async()=>{
  const pending=[];const f=fixture({xr:{isSessionSupported:()=>new Promise(r=>pending.push(r))}})
  const eyes=f.open();const smash=f.gate.check('smashTheHate')
  pending[0](true);await eyes;assert.equal(f.counts().created,0)
  pending[1](false);assert.equal(await smash,false)
  assert.equal(f.nodes.get('#smash-info-title').textContent,'SMASH THE HATE')
  assert.equal(f.nodes.get('#vr-info-tagline').textContent,'Smash the hate. Feel the music.')
  assert.equal(f.nodes.get('#vr-info-track').textContent,'A Glamniverse VR experience powered by I Am Confident.')
  assert.equal(f.nodes.get('#smash-support-message').textContent,'VR headset required for the full experience. Open Glamniverse in Meta Quest Browser to play.')
})

