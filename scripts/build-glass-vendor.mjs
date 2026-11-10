// Rebuild the pinned browser-only glass engine without changing the site's static deployment.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'crew-glass-build-'));
try{
  execFileSync('npm',['install','--prefix',temp,'--save-exact','simple-liquid-glass@5.7.3','esbuild@0.28.2'],{stdio:'inherit'});
  const {build}=await import(pathToFileURL(path.join(temp,'node_modules/esbuild/lib/main.js')));
  const vendor=path.join(root,'design/vendor');await fs.mkdir(vendor,{recursive:true});
  await build({stdin:{contents:"import 'simple-liquid-glass/web-component';",resolveDir:temp,sourcefile:'glass-entry.js'},bundle:true,format:'esm',target:'es2022',outfile:path.join(vendor,'glass.js'),minify:true,legalComments:'eof'});
  for(const [source,target] of [['LICENSE','LICENSE-glass.txt'],['THIRD_PARTY_NOTICES.md','glass-NOTICES.md']])await fs.copyFile(path.join(temp,'node_modules/simple-liquid-glass',source),path.join(vendor,target));
  assert((await fs.stat(path.join(vendor,'glass.js'))).size>0);
}finally{await fs.rm(temp,{recursive:true,force:true});}
