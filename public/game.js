(()=>{
let scene,camera,renderer,clock,weapon,muzzle,flashLight;
let enemies=[],map="city",kills=0,running=false,moveTimer=0,fireHeld=false,lookPointer=null,lastLookX=0,lastLookY=0;
let player={hp:100,ammo:30},held={};
const $=id=>document.getElementById(id),raycaster=new THREE.Raycaster(),center=new THREE.Vector2(0,0);
const mats={};
function mat(c,r=.85,metal=0){let k=c+"-"+r+"-"+metal;return mats[k]||(mats[k]=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:metal}));}
function addBox(parent,x,y,z,sx,sy,sz,color,rough=.8,metal=0){let o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat(color,rough,metal));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function addGround(color){let g=new THREE.Mesh(new THREE.PlaneGeometry(220,220),mat(color,1));g.rotation.x=-Math.PI/2;g.position.y=-.12;g.receiveShadow=true;scene.add(g);}
function addRock(x,z,s=1,color=0x555c60){let o=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),mat(color));o.position.set(x,s*.45,z);o.rotation.set(Math.random(),Math.random(),Math.random());o.castShadow=true;o.receiveShadow=true;scene.add(o);}
function makeMap(){
 scene.background=new THREE.Color(map==="desert"?0xd58a61:map==="forest"?0x142c2a:0x75899a);
 scene.fog=new THREE.FogExp2(scene.background, map==="forest"?.018:.012);
 addGround(map==="desert"?0x98704b:map==="forest"?0x263a2d:0x343d43);
 if(map==="city"){
  for(let i=0;i<42;i++){let x=(Math.floor(i%7)-3)*11+(Math.random()-.5)*2,z=(Math.floor(i/7)-2)*12-12,h=5+Math.random()*13;
   addBox(scene,x,h/2,z,5+Math.random()*2,h,6,i%3===0?0x59616a:0x303e4b);
   for(let y=2;y<h-1;y+=3)for(let k=-1;k<=1;k+=2){let w=addBox(scene,x+k*1.2,y,z+3.04,.75,1.15,.06,0x172b3b,.3);w.material.emissive=new THREE.Color(0x10263a);w.material.emissiveIntensity=.35;}
  }
  for(let i=0;i<14;i++){let x=(Math.random()-.5)*65,z=(Math.random()-.5)*65;addBox(scene,x,.55,z,2,.9,1.2,0x242d34);addBox(scene,x,.15,z,2.3,.2,1.4,0x151b20);}
 }else if(map==="desert"){
  for(let i=0;i<55;i++){let x=(Math.random()-.5)*95,z=(Math.random()-.5)*95;addRock(x,z,1+Math.random()*2,i%2?0xb17d51:0x76543c);}
  for(let i=0;i<9;i++){addBox(scene,-25+i*6,2,-23,4,4,1,0x68766b);addBox(scene,-25+i*6,4.1,-23,4,.2,1.2,0x303d38);}
  for(let i=0;i<18;i++){let x=(Math.random()-.5)*100,z=(Math.random()-.5)*100;let dune=new THREE.Mesh(new THREE.SphereGeometry(5+Math.random()*5,12,8),mat(0xb9895c));dune.scale.y=.18;dune.position.set(x,-.4,z);scene.add(dune);}
 }else{
  for(let i=0;i<105;i++){let x=(Math.random()-.5)*100,z=(Math.random()-.5)*100;if(Math.abs(x)<9&&Math.abs(z)<12)continue;let h=5+Math.random()*8;addBox(scene,x,h/2,z,.45+Math.random()*.4,h,.5,0x392b22);
   let crown=new THREE.Mesh(new THREE.ConeGeometry(2+Math.random()*2,5+Math.random()*3,7),mat(i%2?0x16412d:0x245239));crown.position.set(x,h+1,z);crown.castShadow=true;scene.add(crown);
  }
 }
 for(let i=0;i<20;i++){let x=(Math.random()-.5)*90,z=(Math.random()-.5)*90;if(Math.abs(x)<7&&Math.abs(z)<9)continue;addRock(x,z,.3+Math.random()*.7,map==="desert"?0x876343:0x41494b);}
}
function spawnEnemy(){
 let a=Math.random()*Math.PI*2,d=18+Math.random()*24,x=Math.cos(a)*d,z=Math.sin(a)*d;
 let g=new THREE.Group();
 let body=addBox(g,0,1,0,.82,1.05,.48,0x293b4b,.7);
 let vest=addBox(g,0,1.12,-.02,.88,.62,.53,0x47545b,.95);
 let head=new THREE.Mesh(new THREE.SphereGeometry(.27,16,12),mat(0xb98260));head.position.y=1.78;head.castShadow=true;g.add(head);
 let helmet=new THREE.Mesh(new THREE.SphereGeometry(.3,16,8,0,Math.PI*2,0,Math.PI/2),mat(0x202d31));helmet.position.y=1.9;helmet.castShadow=true;g.add(helmet);
 addBox(g,.38,1.1,-.38,.12,.12,.85,0x111820,.3,.6);
 g.position.set(x,0,z);scene.add(g);enemies.push({group:g,hp:3,body,head});
}
function buildWeapon(){
 weapon=new THREE.Group();
 addBox(weapon,0,0,0,.22,.22,.8,0x202a32,.3,.7);
 addBox(weapon,0,-.14,.18,.17,.35,.22,0x151d24,.5,.3);
 addBox(weapon,0,.13,-.18,.12,.09,.42,0x53616a,.25,.8);
 addBox(weapon,0,.01,-.5,.1,.1,.5,0x11171d,.25,.8);
 let sight=addBox(weapon,0,.17,-.08,.08,.12,.1,0x111820,.2,.6);
 weapon.position.set(.38,-.32,-.68);camera.add(weapon);
 muzzle=new THREE.Mesh(new THREE.SphereGeometry(.075,8,8),new THREE.MeshBasicMaterial({color:0xffc46b}));muzzle.position.set(0,.01,-.79);weapon.add(muzzle);muzzle.visible=false;
 flashLight=new THREE.PointLight(0xff9a42,0,4);flashLight.position.copy(muzzle.position);weapon.add(flashLight);
}
function init(){
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.08,220);camera.rotation.order="YXZ";camera.position.set(0,1.7,5);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 $("scene").appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xc9e4ff,0x30251d,1.65));
 let sun=new THREE.DirectionalLight(map==="forest"?0x9bb8b0:0xffd4aa,3);sun.position.set(-18,28,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-55;sun.shadow.camera.right=55;sun.shadow.camera.top=55;sun.shadow.camera.bottom=-55;scene.add(sun);
 let fill=new THREE.DirectionalLight(0x8abaff,.65);fill.position.set(15,8,-12);scene.add(fill);
 buildWeapon();clock=new THREE.Clock();animate();
 addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);});
}
function start(){
 map=document.querySelector(".map.selected").dataset.map;player={hp:100,ammo:30};kills=0;moveTimer=0;
 enemies.forEach(e=>scene.remove(e.group));enemies=[];makeMap();for(let i=0;i<9;i++)spawnEnemy();
 $("mapName").textContent=map==="city"?"VILLE FANTÔME":map==="desert"?"DÉSERT ROUGE":"FORÊT NOIRE";
 $("score").textContent="ÉLIMINATIONS 0";$("health").textContent="♥ 100";$("ammo").textContent="30 / ∞";
 $("menu").classList.add("hidden");$("hud").classList.remove("hidden");$("pauseBox").classList.add("hidden");running=true;
 camera.position.set(0,1.7,5);camera.rotation.set(0,0,0);weapon.visible=true;
}
function shoot(){
 if(!running||player.ammo<=0)return;
 player.ammo--;$("ammo").textContent=player.ammo+" / ∞";muzzle.visible=true;flashLight.intensity=3;weapon.position.z=-.61;
 raycaster.setFromCamera(center,camera);
 let targets=[];enemies.forEach(e=>e.group.traverse(o=>{if(o.isMesh)targets.push(o)}));
 let hits=raycaster.intersectObjects(targets,false);
 if(hits.length&&hits[0].distance<65){
  let e=enemies.find(v=>v.group===hits[0].object.parent||v.group===hits[0].object.parent?.parent);
  if(!e)e=enemies.find(v=>{let found=false;v.group.traverse(o=>{if(o===hits[0].object)found=true});return found});
  if(e){e.hp--;e.group.scale.setScalar(.96);if(e.hp<=0){scene.remove(e.group);enemies=enemies.filter(v=>v!==e);kills++;$("score").textContent="ÉLIMINATIONS "+kills;spawnEnemy();}}
 }
 setTimeout(()=>{if(muzzle){muzzle.visible=false;flashLight.intensity=0;weapon.position.z=-.68}},75);
}
function move(dx,dz,dt=.18){if(!running)return;let a=camera.rotation.y;camera.position.x+=(dx*Math.cos(a)+dz*Math.sin(a))*dt*4;camera.position.z+=(-dx*Math.sin(a)+dz*Math.cos(a))*dt*4;camera.position.x=Math.max(-48,Math.min(48,camera.position.x));camera.position.z=Math.max(-48,Math.min(48,camera.position.z));}
function animate(){
 requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.05);
 if(running){
  if(held.up)move(0,-1,dt);if(held.down)move(0,1,dt);if(held.left)move(-1,0,dt);if(held.right)move(1,0,dt);
  if(fireHeld){moveTimer+=dt;if(moveTimer>.16){moveTimer=0;shoot();}}
  enemies.forEach(e=>{let p=e.group.position,dx=camera.position.x-p.x,dz=camera.position.z-p.z,d=Math.hypot(dx,dz);if(d>2.5){p.x+=dx/d*dt*.8;p.z+=dz/d*dt*.8;e.group.rotation.y=Math.atan2(dx,dz);}else{moveTimer+=dt;if(moveTimer>1.5){moveTimer=0;player.hp=Math.max(0,player.hp-5);$("health").textContent="♥ "+player.hp;if(!player.hp){running=false;$("pauseBox").classList.remove("hidden");$("pauseBox").querySelector("h2").textContent="MISSION TERMINÉE";}}}});
 }
 renderer.render(scene,camera);
}
function holdButton(id,key){let el=$(id);el.addEventListener("pointerdown",e=>{e.preventDefault();held[key]=true;el.setPointerCapture?.(e.pointerId)});["pointerup","pointercancel","lostpointercapture"].forEach(ev=>el.addEventListener(ev,()=>held[key]=false));}
document.querySelectorAll(".map").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".map").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")}));
$("start").onclick=start;$("pause").onclick=()=>{running=false;$("pauseBox").classList.remove("hidden")};$("resume").onclick=()=>{$("pauseBox").classList.add("hidden");running=true};$("home").onclick=()=>{running=false;$("hud").classList.add("hidden");$("pauseBox").classList.add("hidden");$("menu").classList.remove("hidden")};
holdButton("up","up");holdButton("down","down");holdButton("left","left");holdButton("right","right");
$("fire").addEventListener("pointerdown",e=>{e.preventDefault();fireHeld=true;shoot()});["pointerup","pointercancel","lostpointercapture"].forEach(ev=>$("fire").addEventListener(ev,()=>fireHeld=false));
const canvasArea=$("scene");canvasArea.addEventListener("pointerdown",e=>{if(!running)return;lookPointer=e.pointerId;lastLookX=e.clientX;lastLookY=e.clientY;canvasArea.setPointerCapture(e.pointerId)});
canvasArea.addEventListener("pointermove",e=>{if(lookPointer!==e.pointerId||!running)return;let dx=e.clientX-lastLookX,dy=e.clientY-lastLookY;lastLookX=e.clientX;lastLookY=e.clientY;camera.rotation.y-=dx*.006;camera.rotation.x=Math.max(-1.25,Math.min(1.25,camera.rotation.x-dy*.004)});
["pointerup","pointercancel","lostpointercapture"].forEach(ev=>canvasArea.addEventListener(ev,e=>{if(lookPointer===e.pointerId)lookPointer=null}));
document.addEventListener("keydown",e=>{if(e.key==="w"||e.key==="ArrowUp")held.up=true;if(e.key==="s"||e.key==="ArrowDown")held.down=true;if(e.key==="a"||e.key==="ArrowLeft")held.left=true;if(e.key==="d"||e.key==="ArrowRight")held.right=true;if(e.code==="Space")shoot()});
document.addEventListener("keyup",e=>{if(e.key.toLowerCase()==="w"||e.key==="ArrowUp")held.up=false;if(e.key.toLowerCase()==="s"||e.key==="ArrowDown")held.down=false;if(e.key.toLowerCase()==="a"||e.key==="ArrowLeft")held.left=false;if(e.key.toLowerCase()==="d"||e.key==="ArrowRight")held.right=false});
init();
window.TirGunReady=true;
})();