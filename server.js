const express=require("express"),http=require("http"),{Server}=require("socket.io");
const app=express(),server=http.createServer(app),io=new Server(server);
app.get("/health",(req,res)=>res.json({ok:true,app:"Tir.gun"}));
app.use("/vendor/three",express.static(require("path").join(__dirname,"node_modules/three/build")));
app.use(express.static("public"));
const players={};
io.on("connection",s=>{players[s.id]={id:s.id,name:"Soldat",x:0,z:0,hp:100};s.emit("init",{id:s.id,players:Object.values(players)});s.on("disconnect",()=>{delete players[s.id];});});
const port=process.env.PORT||3000;server.listen(port,"0.0.0.0",()=>console.log("Tir.gun prêt sur "+port));