const express=require("express"),http=require("http"),{Server}=require("socket.io");
const app=express(),server=http.createServer(app),io=new Server(server);
app.get("/health",(req,res)=>res.json({ok:true,players:io.engine.clientsCount}));
app.use(express.static("public"));
const players={};
io.on("connection",s=>{
 players[s.id]={id:s.id,name:"Soldat",x:(Math.random()-.5)*8,z:(Math.random()-.5)*8,rot:0,hp:100};
 s.emit("init",{id:s.id,players:Object.values(players)});s.broadcast.emit("join",players[s.id]);
 s.on("move",d=>{const p=players[s.id];if(!p)return;p.x=Math.max(-23,Math.min(23,Number(d.x)||0));p.z=Math.max(-23,Math.min(23,Number(d.z)||0));p.rot=Number(d.rot)||0;p.name=String(d.name||"Soldat").slice(0,16);s.broadcast.emit("move",p);});
 s.on("shoot",d=>{if(!players[s.id])return;io.emit("shot",{id:s.id,x:players[s.id].x,z:players[s.id].z,rot:players[s.id].rot});if(d&&players[d.target]&&d.target!==s.id){const v=players[d.target];v.hp=Math.max(0,v.hp-25);io.to(d.target).emit("hit",{hp:v.hp,from:players[s.id].name});if(v.hp===0){v.hp=100;v.x=(Math.random()-.5)*10;v.z=(Math.random()-.5)*10;io.emit("respawn",v);}}});
 s.on("disconnect",()=>{delete players[s.id];io.emit("leave",s.id);});
});
const port=process.env.PORT||3000;server.listen(port,"0.0.0.0",()=>console.log("Zone de Combat 3D sur "+port));