import { spawnSync } from 'node:child_process';

const commands = [
  ['npm', ['run', 'typecheck']],
  ['npm', ['run', 'build']],
  ['npm', ['run', 'qa:e2e']],
];

for (const [cmd, args] of commands) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`\nCARRTELL QA: FAIL -> ${cmd} ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

console.log('\nCARRTELL QA: PASS');
