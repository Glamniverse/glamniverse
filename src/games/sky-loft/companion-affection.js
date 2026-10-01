// Emotional departure only; no movement authority, timers, or scene resources.
export const AFFECTION=Object.freeze({closeDistance:1.6,departureDistance:2.75,userTravel:1.25,cooldown:36,expires:60,maxStep:.75})
export function createAffection(){
 let age=0,cooldown=0,eligible=false,close=false,completed=false,tracking=false
 let hx=0,hz=0,ax=0,az=0,dx=0,dz=0,initialDistance=0
 const cancel=()=>{eligible=false;close=false;completed=false;tracking=false}
 return {
  pet(){eligible=true;close=false;completed=false;age=0},
  cancel,
  reset(){cancel();cooldown=0},
  update(dt,head,dog,petting){
   if(!Number.isFinite(dt)||dt<0||!Number.isFinite(head.x)||!Number.isFinite(head.z)){cancel();return false}
   cooldown=Math.max(0,cooldown-dt)
   if(tracking&&Math.hypot(head.x-hx,head.z-hz)>AFFECTION.maxStep){cancel();return false}
   hx=head.x;hz=head.z;tracking=true
   if(!eligible)return false
   age+=dt;if(age>AFFECTION.expires){cancel();return false}
   if(petting)return false
   completed=true
   const distance=Math.hypot(head.x-dog.x,head.z-dog.z)
   if(!close&&distance<=AFFECTION.closeDistance){
    close=true;ax=head.x;az=head.z;dx=dog.x;dz=dog.z;initialDistance=distance
   }
   // Both actual separation and travel away from the original affection location
   // must grow. The dog wandering away from a stationary user cannot trigger this.
   if(completed&&close&&distance>=AFFECTION.departureDistance&&
      Math.hypot(head.x-ax,head.z-az)>=AFFECTION.userTravel&&
      Math.hypot(head.x-dx,head.z-dz)-initialDistance>=AFFECTION.userTravel){
    cancel();if(cooldown>0)return false
    cooldown=AFFECTION.cooldown;return true
   }
   return false
  },
 }
}
