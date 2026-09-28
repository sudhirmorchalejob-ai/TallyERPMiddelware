
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['server.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: '_bundle.cjs',

banner: {
    js: "const __importMetaUrl = require('url').pathToFileURL(__filename).href;",
  },
  define: {
    'import.meta.url': '__importMetaUrl',
  },

  external: [
    'axios', 'form-data', 'proxy-from-env', 'follow-redirects',
    'xml2js', 'xmlbuilder', 'sax',
    'cors', 'object-assign',
    'agentkeepalive', 'humanize-ms',
    'express', 'dotenv', 'node-cron',
  ],
});
console.log('esbuild bundle complete');
