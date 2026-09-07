// Read-only release mount: existing static rsync deploys deliver the server bundle.
const {readFileSync}=require('node:fs');
const {createHash}=require('node:crypto');
const {spawn}=require('node:child_process');
let child,hash='',stopping=false;
function check(){
 if(stopping)return;
 let next;try{next=createHash('sha256').update(readFileSync('/app/app.cjs')).digest('hex');}catch{return;}
 if(child&&next===hash)return;
 if(child){child.kill('SIGTERM');return;}
 hash=next;child=spawn(process.execPath,['/app/app.cjs'],{stdio:'inherit'});
 child.on('exit',()=>child=null);
 child.on('error',error=>console.error('Server launch failed:',error.message));
}
const timer=setInterval(check,3000);check();
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{stopping=true;clearInterval(timer);if(child){child.once('exit',()=>process.exit(0));child.kill(signal);}else process.exit(0);});
