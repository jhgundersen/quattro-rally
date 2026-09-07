import {createService} from './service.js';
const service=createService({trustProxy:process.env.TRUST_PROXY==='1'});
service.server.listen(Number(process.env.PORT)||8081,'0.0.0.0',()=>console.log('Quattro multiplayer listening'));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await service.close();process.exit(0);});
