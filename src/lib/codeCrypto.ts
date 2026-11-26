import type { EncryptedPayload } from './crypto'

export type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'go'
  | 'rust'
  | 'php'
  | 'java'
  | 'csharp'
  | 'sql'
  | 'bash'
  | 'text'

export interface LanguageOption {
  id: CodeLanguage
  label: string
  extension: string
  wrapper: boolean
}

export const CODE_LANGUAGES: LanguageOption[] = [
  { id: 'javascript', label: 'JavaScript', extension: 'js', wrapper: true },
  { id: 'typescript', label: 'TypeScript', extension: 'ts', wrapper: true },
  { id: 'python', label: 'Python', extension: 'py', wrapper: true },
  { id: 'go', label: 'Go', extension: 'go', wrapper: false },
  { id: 'rust', label: 'Rust', extension: 'rs', wrapper: false },
  { id: 'php', label: 'PHP', extension: 'php', wrapper: false },
  { id: 'java', label: 'Java', extension: 'java', wrapper: false },
  { id: 'csharp', label: 'C#', extension: 'cs', wrapper: false },
  { id: 'sql', label: 'SQL', extension: 'sql', wrapper: false },
  { id: 'bash', label: 'Bash', extension: 'sh', wrapper: false },
  { id: 'text', label: 'Plain text', extension: 'txt', wrapper: false },
]

export function getLanguage(id: string): LanguageOption {
  return CODE_LANGUAGES.find((language) => language.id === id) ?? CODE_LANGUAGES[0]
}

/** Infer the language selector from an uploaded filename. */
export function languageFromFilename(filename: string): CodeLanguage {
  const extension = filename.split('.').pop()?.toLowerCase() ?? ''
  const extensions: Record<string, CodeLanguage> = {
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    pyw: 'python',
    go: 'go',
    rs: 'rust',
    php: 'php',
    java: 'java',
    cs: 'csharp',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    txt: 'text',
    json: 'text',
  }
  return extensions[extension] ?? 'text'
}

/** Self-decrypting JavaScript that prints the restored source to the console. */
export function buildJavaScriptWrapper(payload: EncryptedPayload): string {
  const json = JSON.stringify(payload, null, 2)
  const recovery = payload.mode === 'recovery'

  return `// ONEV self-decrypting wrapper — JavaScript / TypeScript
// Password mode:     ONEV_PASSWORD="..." node restored.js
// Recovery mode:     ONEV_RECOVERY_KEY='{"key":"..."}' node restored.js
// In a browser, a prompt is used instead. The restored source is printed.

const PAYLOAD = ${json};

const crypto = globalThis.crypto;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const toBytes = (value) =>
  Uint8Array.from(atob(value.replace(/\\s/g, '')), (char) => char.charCodeAt(0));

async function getKey() {
  if (!crypto?.subtle) throw new Error('Web Crypto is not available in this runtime.');

  ${recovery ? `const raw = globalThis.process?.env?.ONEV_RECOVERY_KEY || (globalThis.prompt?.('Recovery key JSON:') ?? '');
  if (!raw) throw new Error('A recovery key is required for this payload.');
  const parsed = JSON.parse(raw);
  return crypto.subtle.importKey('raw', toBytes(parsed.key), { name: 'AES-GCM' }, false, ['decrypt']);` : `const password = globalThis.process?.env?.ONEV_PASSWORD || (globalThis.prompt?.('Password:') ?? '');
  if (!password) throw new Error('A password is required for this payload.');
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: toBytes(PAYLOAD.salt), iterations: PAYLOAD.iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );`}
}

(async () => {
  const key = await getKey();
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toBytes(PAYLOAD.iv) },
    key,
    toBytes(PAYLOAD.data),
  );
  const source = decoder.decode(plain);
  console.log(source);
  // To execute the restored source instead: new Function(source)();
})().catch((error) => {
  console.error('ONEV decrypt failed:', error.message ?? error);
});
`
}

/** Self-decrypting Python script that prints the restored source. */
export function buildPythonWrapper(payload: EncryptedPayload): string {
  const json = JSON.stringify(payload, null, 2)
  const recovery = payload.mode === 'recovery'

  return `"""ONEV self-decrypting wrapper — Python.
Install: pip install cryptography
Run:     ONEV_PASSWORD="..." python restored.py
Or:      ONEV_RECOVERY_KEY='{"key":"..."}' python restored.py
The restored source is printed to stdout.
"""

import base64
import getpass
import json
import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

PAYLOAD = json.loads(r'''${json}''')


def b64(value):
    return base64.b64decode(value)


${
  recovery
    ? `raw = os.environ.get("ONEV_RECOVERY_KEY") or input("Recovery key JSON: ")
parsed = json.loads(raw)
key = base64.b64decode(parsed["key"])`
    : `password = os.environ.get("ONEV_PASSWORD") or getpass.getpass("Password: ")
kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=b64(PAYLOAD["salt"]),
    iterations=PAYLOAD["iterations"],
)
key = kdf.derive(password.encode())`
}

plain = AESGCM(key).decrypt(b64(PAYLOAD["iv"]), b64(PAYLOAD["data"]), None)
print(plain.decode())
# exec(plain.decode())  # uncomment to execute the restored source
`
}

export function buildWrapper(payload: EncryptedPayload, language: CodeLanguage): string {
  if (language === 'javascript' || language === 'typescript') return buildJavaScriptWrapper(payload)
  if (language === 'python') return buildPythonWrapper(payload)
  return ''
}

/** Pull the embedded ONEV payload back out of a generated wrapper (or pass JSON through). */
export function extractPayload(input: string): string {
  const trimmed = input.trim()
  if (trimmed.startsWith('{')) return trimmed

  const javascript = trimmed.match(/const PAYLOAD = (\{[\s\S]*?\});/)
  if (javascript) return javascript[1]

  const python = trimmed.match(/PAYLOAD = json\.loads\(r'''(\{[\s\S]*?\})'''\)/)
  if (python) return python[1]

  throw new Error('No ONEV payload found. Paste the JSON payload or a generated wrapper.')
}
