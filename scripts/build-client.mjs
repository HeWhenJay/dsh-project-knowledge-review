import { build } from 'esbuild'

const external = [
  'react',
  'react/jsx-runtime',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-runtime/client',
  '@deepseek-ai/dsh-client-ui-settings/client',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-api-remotes/client',
]

await build({
  entryPoints: ['src/client/index.tsx'],
  bundle: true,
  outfile: 'lib/client.js',
  platform: 'browser',
  format: 'cjs',
  target: 'es2022',
  sourcemap: true,
  external,
  banner: { js: 'window.__ModuleLoader__.load({ id: "dsh-project-knowledge-review", factory: (require) => {' },
  footer: { js: 'return module.exports; } });' },
  define: { 'process.env.NODE_ENV': '"production"' },
})
