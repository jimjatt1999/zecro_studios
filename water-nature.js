// Bounded, correlated arrivals: most encounters are small, larger groups are occasional.
(() => {
  function profile(kind,{mobile=false,weather='clear'}={},random=Math.random){
    const tables={fish:[3,4,4,5,5,5,6,6,7,8,9,10],lanterns:[1,1,2,2,2,3,3,4,5,6,7],petals:[6,8,10,12,14,16,18,22,26,30,36]};
    const cap=kind==='fish'?(mobile?6:10):kind==='lanterns'?(mobile?4:7):(mobile?22:36);
    const choices=tables[kind].filter(n=>n<=cap);
    const count=choices[Math.floor(random()*choices.length)];
    return {count,direction:random()<.5?-1:1,pace:(weather==='rain'?.85:1)*(.8+random()*.4),spacing:20+random()*23,spread:.65+random()*.7,phase:random()*Math.PI*2,arrivalGap:kind==='petals'?250+random()*450:900+random()*1700};
  }
  function clock(read=()=>performance.now()){
    let offset=0,pausedAt=null;
    return {now:()=> (pausedAt??read())-offset,pause(){if(pausedAt===null)pausedAt=read();},resume(){if(pausedAt!==null){offset+=read()-pausedAt;pausedAt=null;}}};
  }
  window.LakeNature=Object.freeze({profile,clock});
})();
