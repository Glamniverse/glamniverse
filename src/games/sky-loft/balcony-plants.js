import * as THREE from 'three'

// Static, persistent loft furnishings. Entire silhouettes sit beyond the approved
// artificial locomotion limits (x +/-6.35, z +/-5.15), inside the physical floor.
export const PLANT_GROUPS=Object.freeze([
  {x:-5.1,z:5.6,pot:.48,height:1.05,leaves:9,flowers:0},
  {x:5.1,z:5.6,pot:.32,height:.45,leaves:7,flowers:6},
  {x:6.7,z:1.4,pot:.42,height:.62,leaves:7,flowers:0},
])
function leafGeometry(){
  // Folded, curved lanceolate blade: genuine geometry, no alpha cards or textures.
  const g=new THREE.BufferGeometry()
  g.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,0, -.065,.32,.07, 0,.32,.09, .065,.32,.07,
    -.045,.72,.2, 0,.72,.22, .045,.72,.2, 0,1,.24,
  ],3))
  g.setIndex([0,1,2,0,2,3,1,4,2,2,4,5,2,5,3,3,5,6,4,7,5,5,7,6])
  g.computeVertexNormals();return g
}
function flowerGeometry(){
  const p=[],idx=[]
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5,k=p.length/3
    p.push(0,0,0,Math.cos(a-.42)*.035,.008,Math.sin(a-.42)*.035,
      Math.cos(a)*.065,.022,Math.sin(a)*.065,Math.cos(a+.42)*.035,.008,Math.sin(a+.42)*.035)
    idx.push(k,k+1,k+2,k,k+2,k+3)
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g
}
export function createBalconyPlants(parent){
  const group=new THREE.Group();group.name='SkyLoft_BalconyPlants';parent.add(group)
  const potMaterial=new THREE.MeshStandardMaterial({color:0x959993,roughness:.86})
  const leafMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92,side:THREE.DoubleSide})
  const flowerMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9,side:THREE.DoubleSide})
  const pots=new THREE.InstancedMesh(new THREE.CylinderGeometry(.21,.17,1,10),potMaterial,3)
  const leaves=new THREE.InstancedMesh(leafGeometry(),leafMaterial,PLANT_GROUPS.reduce((n,p)=>n+p.leaves,0))
  const flowers=new THREE.InstancedMesh(flowerGeometry(),flowerMaterial,6)
  group.add(pots,leaves,flowers)
  const object=new THREE.Object3D(),color=new THREE.Color()
  let leaf=0,flower=0
  PLANT_GROUPS.forEach((plant,i)=>{
    object.position.set(plant.x,plant.pot/2,plant.z);object.scale.set(1,plant.pot,1);object.rotation.set(0,0,0);object.updateMatrix();pots.setMatrixAt(i,object.matrix)
    for(let j=0;j<plant.leaves;j++){
      const angle=j*2.39996,length=plant.height*(.72+.28*(j%3)/2)
      object.position.set(plant.x,plant.pot-.04,plant.z);object.rotation.set(0,angle,0);object.scale.set(.85,length,length);object.updateMatrix()
      leaves.setMatrixAt(leaf,object.matrix);leaves.setColorAt(leaf++,color.setHex([0x355c3e,0x51754a,0x648254][j%3]))
      if(j<plant.flowers){
        // Blossoms emerge directly from the tips of the low leafy rosette.
        object.position.set(plant.x+Math.sin(angle)*.24*length,plant.pot-.04+length,plant.z+Math.cos(angle)*.24*length)
        object.scale.setScalar(1);object.rotation.set(.18,angle,0);object.updateMatrix()
        flowers.setMatrixAt(flower,object.matrix);flowers.setColorAt(flower++,color.setHex([0xfff5ea,0xe6cbd6,0xd9cfdf][j%3]))
      }
    }
  })
  for(const mesh of group.children)mesh.computeBoundingSphere()
  // No update loop. Existing world traversal owns geometry/material disposal.
  return group
}
