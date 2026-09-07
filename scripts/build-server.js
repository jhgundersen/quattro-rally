import {build} from 'esbuild';
await build({entryPoints:['server/index.js'],bundle:true,platform:'node',target:'node22',format:'cjs',outfile:'dist/server/app.cjs',external:['bufferutil','utf-8-validate'],minify:true});
