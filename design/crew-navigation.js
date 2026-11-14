/** Open the requested view immediately; restoring the 3D scene runs alongside it. */
export function createSceneNavigation({needsRestore,restore,enter}) {
 return (...destination)=>{
  if(needsRestore(...destination))restore();
  return enter(...destination);
 };
}
