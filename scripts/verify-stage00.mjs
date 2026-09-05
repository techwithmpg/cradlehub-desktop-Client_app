import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const files = [
  ...new Set(
    execFileSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard'],
      { encoding: 'utf8' },
    )
      .trim()
      .split('\n'),
  ),
];
let failures = 0;
function result(name, ok, details = '') {
  console.log(
    `${ok ? 'OK' : 'FAILED'}: ${name}${details ? ' — ' + details : ''}`,
  );
  if (!ok) failures++;
}
const textFiles = files.filter((f) =>
  /\.(md|json|ya?ml|toml|ts|tsx|js|mjs|rs|html|css|txt)$/.test(f),
);
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{50,}\b/,
  /\bsb_secret_[A-Za-z0-9_-]{15,}\b/,
  /postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@/,
];
const secretMatches = [];
for (const file of textFiles) {
  const content = readFileSync(file, 'utf8');
  if (secretPatterns.some((p) => p.test(content))) secretMatches.push(file);
}
result(
  'secret-pattern scan',
  secretMatches.length === 0,
  `${textFiles.length} text files; ${secretMatches.length} matching filenames (values never printed)`,
);
result(
  'environment files excluded',
  !files.some((f) => /(^|\/)\.env($|\.)/.test(f)),
);
const runtime = files.filter(
  (f) => /^src\//.test(f) || /^src-tauri\/src\//.test(f),
);
const runtimeText = runtime.map((f) => readFileSync(f, 'utf8')).join('\n');
result(
  'fake/demo normal-runtime scan',
  !/(\bdemo\b|\bfake\b|\bmock\b|\bcounter\b|sync success|\bLive\b)/i.test(
    runtimeText,
  ),
  runtime.join(', '),
);
result(
  'Foundation Showcase scan',
  !/Foundation\s+Showcase|component\s+gallery/i.test(runtimeText),
);
result(
  'sample-data scan',
  !/sample|fixture|seedData|mockData/i.test(runtimeText),
);
result(
  'parallel shell/V2 scan',
  !runtime.some((f) => /(V2\.|\/new-|alternate|showcase)/i.test(f)) &&
    files.filter((f) => f === 'src/App.tsx').length === 1,
);
result(
  'no speculative persistence/network implementation',
  !/sqlite|localStorage|sessionStorage|indexedDB|setInterval|fetch\(|WebSocket|invoke_handler|#\[tauri::command\]/i.test(
    runtimeText,
  ),
);
const config = JSON.parse(
  readFileSync('src-tauri/tauri.conf.json', 'utf8').replace(/^\uFEFF/, ''),
);
result(
  'least-privilege capability boundary',
  config.app.security.capabilities.length === 0 &&
    config.app.security.csp.includes("connect-src 'none'"),
);
result(
  'one token source',
  files.filter((f) => f.startsWith('src/') && f.endsWith('.css')).length === 1,
);
const state = readFileSync('docs/50-state/CURRENT_STATE.md', 'utf8');
const task = readFileSync('docs/50-state/CURRENT_TASK.md', 'utf8');
const gate = readFileSync('docs/50-state/LAST_VERIFIED_GATE.md', 'utf8');
result(
  'active documentation consistency',
  state.includes('ACTIVE / UNACCEPTED') &&
    task.includes('Stage 00') &&
    gate.includes(
      'No greenfield implementation gate has yet been owner-accepted',
    ),
);
const manifest = JSON.parse(readFileSync('bootstrap-manifest.json', 'utf8'));
for (const image of manifest.reference_images) {
  const file = 'docs/20-product/reference-ui/current/crm/' + image.file;
  const hash = createHash('sha256').update(readFileSync(file)).digest('hex');
  result('reference SHA-256 ' + image.file, hash === image.sha256);
}
result(
  'no SQL/schema/migration additions',
  !files.some((f) => /\.sql$|^supabase\//.test(f)),
);
const branch = execFileSync('git', ['branch', '--show-current'], {
  encoding: 'utf8',
}).trim();
const origin = execFileSync('git', ['remote', 'get-url', 'origin'], {
  encoding: 'utf8',
}).trim();
result('authorized branch', branch === 'stage/00-initialization', branch);
result(
  'desktop remote identity',
  origin === 'https://github.com/techwithmpg/cradlehub-desktop-Client_app.git',
  origin,
);
result(
  'required inventory present',
  existsSync('docs/10-architecture/WEB_CONTRACT_INVENTORY.md'),
);
console.log(
  'HEAD: ' +
    execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
);
console.log(
  `RESULT: ${failures} failed checks. Pattern scans are bounded checks, not a proof of absence of every possible secret or defect.`,
);
process.exitCode = failures ? 1 : 0;
