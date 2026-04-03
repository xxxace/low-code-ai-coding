const { execSync } = require('child_process')
try {
  const r = execSync('node_modules\\.bin\\vue-tsc --noEmit', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
  console.log('STDOUT:', r || '(empty - zero errors)')
} catch (e) {
  console.log('EXIT CODE:', e.status)
  console.log('STDOUT:', e.stdout || '(empty)')
  console.log('STDERR:', e.stderr || '(empty)')
}
