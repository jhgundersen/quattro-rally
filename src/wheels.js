const TAU=Math.PI*2;

// Distance-driven animation also follows remote cars without networking any
// cosmetic wheel state. Ignore grid resets and large network corrections.
export function createWheelMotion(){
 let previous=null,spin=0,steer=0;
 return function update(car,time){
  if(previous){
   const dt=time-previous.time,dx=car.x-previous.x,dz=car.z-previous.z;
   if(dt>0&&dt<=.25&&Math.hypot(dx,dz)<6){
    const yaw=Math.atan2(Math.sin(car.angle-previous.angle),Math.cos(car.angle-previous.angle));
    const heading=previous.angle+yaw/2;
    const distance=dx*Math.sin(heading)+dz*Math.cos(heading);
    spin=(spin+distance/.44)%TAU;
    const target=Math.abs(distance)>.015?Math.max(-.48,Math.min(.48,Math.atan(2.23*yaw/distance))):0;
    steer+=(target-steer)*(1-Math.exp(-12*dt));
   }else if(dt<0||dt>.25||Math.hypot(dx,dz)>=6){spin=0;steer=0;}
  }
  previous={x:car.x,z:car.z,angle:car.angle,time};
  return {spin,steer};
 };
}
