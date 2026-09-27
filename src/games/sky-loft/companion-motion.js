// Distances are metres in the anchored loft floor space. The free rectangle stays
// ahead of the coffee table/sofa and behind the selector pedestal.
export const COMPANION_SETTINGS = Object.freeze({
  modelSrc: '/models/sky-loft/bichon/bichon.glb', maxCount: 1,
  speed: 0.192, stopDistance: 1.05, hideDistance: 0.55,
  bounds: { minX: -3.8, maxX: 3.8, minZ: -1.1, maxZ: 1.1 },
  anchors: [[3.5, 1.05], [2.1, -0.6], [-2.2, -0.55], [-3.3, 1.0]],
})
export const COMPANION_STATES = Object.freeze(['IDLE','WANDER','APPROACH_USER','HAPPY','WANDER_AWAY'])
export function createCompanionMotion() {
  const c=COMPANION_SETTINGS,b=c.bounds
  const p={x:c.anchors[0][0],z:c.anchors[0][1]},target={...p}
  let state='IDLE',elapsed=0,anchor=0,stage=0,yaw=0,moving=false,disposed=false
  const enter=s=>{state=s;elapsed=0}
  const nextAnchor=()=>{anchor=(anchor+1)%c.anchors.length;[target.x,target.z]=c.anchors[anchor]}
  const safeHead=h=>Number.isFinite(h.x)&&Number.isFinite(h.z)&&h.x>=b.minX&&h.x<=b.maxX&&h.z>=b.minZ&&h.z<=b.maxZ
  return {
    position:p,
    reset(){p.x=c.anchors[0][0];p.z=c.anchors[0][1];target.x=p.x;target.z=p.z;anchor=0;stage=0;yaw=0;moving=false;enter('IDLE')},
    update(dt,head){
      if(disposed||!Number.isFinite(dt)||dt<=0)return
      dt=Math.min(.05,dt);elapsed+=dt;moving=false
      const hx=p.x-head.x,hz=p.z-head.z,hd=Math.hypot(hx,hz)
      if(state==='IDLE'&&elapsed>5){
        if(stage%2===1&&safeHead(head)&&hd>c.stopDistance+.03){
          target.x=head.x+hx/hd*c.stopDistance;target.z=head.z+hz/hd*c.stopDistance
          enter('APPROACH_USER')
        }else{nextAnchor();enter('WANDER')}
        stage++
      }
      // Track a relocating user only inside the approved clear dog region.
      if(state==='APPROACH_USER'){
        if(!safeHead(head))enter('IDLE')
        else if(hd<=c.stopDistance+.015)enter('HAPPY')
        else{target.x=head.x+hx/hd*c.stopDistance;target.z=head.z+hz/hd*c.stopDistance}
      }
      if(state==='HAPPY'){
        yaw=Math.atan2(p.x-head.x,p.z-head.z)
        if(elapsed>4){nextAnchor();enter('WANDER_AWAY')}
      }
      if((state==='WANDER'||state==='APPROACH_USER'||state==='WANDER_AWAY')){
        const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz)
        if(d<.015){enter(state==='APPROACH_USER'?'HAPPY':'IDLE');return}
        const step=Math.min(d,c.speed*dt),nx=p.x+dx/d*step,nz=p.z+dz/d*step
        if(Math.hypot(nx-head.x,nz-head.z)<c.stopDistance-.002){
          enter(state==='APPROACH_USER'&&hd<=c.stopDistance+.15?'HAPPY':'IDLE');return
        }
        p.x=Math.max(b.minX,Math.min(b.maxX,nx));p.z=Math.max(b.minZ,Math.min(b.maxZ,nz))
        yaw=Math.atan2(-dx,-dz);moving=true
      }
    },
    get state(){return state},get yaw(){return yaw},get moving(){return moving},
    dispose(){disposed=true;moving=false},
  }
}
