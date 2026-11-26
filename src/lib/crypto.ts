/**
 * Local, password-based text encryption using the Web Crypto API.
 *
 * Format: AES-256-GCM. The key is either derived from a password with
 * PBKDF2-SHA256, or supplied directly as a randomly generated recovery key.
 * The result is a plain JSON payload so it can be copied, stored or versioned
 * easily. Nothing leaves the browser.
 */

export const ENCRYPTION_VERSION = 1
export const ENCRYPTION_ITERATIONS = 250_000
export const MAX_RECOVERY_CANDIDATES = 5_000

export type EncryptionMode = 'password' | 'recovery'

export interface EncryptedPayload {
  v: number
  alg: 'AES-GCM'
  mode: EncryptionMode
  iterations: number
  salt: string
  iv: string
  data: string
}

export interface RecoveryKey {
  v: number
  alg: 'AES-256-GCM'
  key: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function getWebCrypto(): Crypto {
  const candidate = globalThis.crypto
  if (!candidate?.subtle || typeof candidate.getRandomValues !== 'function') {
    throw new Error('Web Crypto is unavailable. Open ONEV over HTTPS or on localhost.')
  }
  return candidate
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const normalized = value.replace(/\s/g, '')
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
  usage: KeyUsage[],
): Promise<CryptoKey> {
  const crypto = getWebCrypto()
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    usage,
  )
}

async function importAesKey(bytes: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  if (bytes.length !== 32) throw new Error('Recovery key must be 256 bits.')
  return getWebCrypto().subtle.importKey('raw', bytes as BufferSource, { name: 'AES-GCM' }, false, usage)
}

function assertIterations(iterations: number): void {
  if (!Number.isInteger(iterations) || iterations < 1000 || iterations > 5_000_000) {
    throw new Error('Iterations must be between 1,000 and 5,000,000.')
  }
}

async function encryptWithKey(plainText: string, key: CryptoKey, iv: Uint8Array): Promise<string> {
  const crypto = getWebCrypto()
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoder.encode(plainText) as BufferSource,
  )
  return bytesToBase64(new Uint8Array(cipher))
}

async function decryptWithKey(payload: EncryptedPayload, key: CryptoKey, failureMessage: string): Promise<string> {
  const crypto = getWebCrypto()
  const iv = base64ToBytes(payload.iv)
  if (iv.length !== 12) throw new Error('Payload has an invalid IV.')

  try {
    const data = base64ToBytes(payload.data)
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      data as BufferSource,
    )
    return decoder.decode(plain)
  } catch {
    throw new Error(failureMessage)
  }
}

// ------------------------------------------------------------- Password mode ---

export async function encryptText(
  plainText: string,
  password: string,
  iterations = ENCRYPTION_ITERATIONS,
): Promise<EncryptedPayload> {
  if (!password) throw new Error('Enter a password before encrypting.')
  assertIterations(iterations)

  const crypto = getWebCrypto()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt, iterations, ['encrypt'])

  return {
    v: ENCRYPTION_VERSION,
    alg: 'AES-GCM',
    mode: 'password',
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: await encryptWithKey(plainText, key, iv),
  }
}

export async function decryptText(input: string | EncryptedPayload, password: string): Promise<string> {
  if (!password) throw new Error('Enter the password used for encryption.')
  const payload = typeof input === 'string' ? parseEncryptedPayload(input) : input

  if (payload.mode === 'recovery') {
    throw new Error('This payload uses a recovery key. Switch to Recovery key mode.')
  }

  const salt = base64ToBytes(payload.salt)
  if (salt.length < 8) throw new Error('Payload has an invalid salt.')
  const key = await deriveKey(password, salt, payload.iterations, ['decrypt'])
  return decryptWithKey(payload, key, 'Decryption failed. Check the password or whether the payload was changed.')
}

// ------------------------------------------------------------- Recovery mode ---

export function generateRecoveryKey(): string {
  const crypto = getWebCrypto()
  const key: RecoveryKey = {
    v: ENCRYPTION_VERSION,
    alg: 'AES-256-GCM',
    key: bytesToBase64(crypto.getRandomValues(new Uint8Array(32))),
  }
  return JSON.stringify(key, null, 2)
}

export function parseRecoveryKey(input: string): RecoveryKey {
  let value: unknown
  try {
    value = JSON.parse(input.trim())
  } catch {
    throw new Error('That is not valid JSON. Paste the full recovery key file.')
  }

  if (!value || typeof value !== 'object') {
    throw new Error('That is not an ONEV recovery key.')
  }

  const candidate = value as Partial<RecoveryKey>
  if (candidate.v !== ENCRYPTION_VERSION || candidate.alg !== 'AES-256-GCM' || typeof candidate.key !== 'string') {
    throw new Error('Unsupported recovery key.')
  }

  try {
    if (base64ToBytes(candidate.key).length !== 32) throw new Error()
  } catch {
    throw new Error('Recovery key must contain 256 bits of key material.')
  }

  return {
    v: ENCRYPTION_VERSION,
    alg: 'AES-256-GCM',
    key: candidate.key,
  }
}

export async function encryptTextWithRecoveryKey(
  plainText: string,
  recoveryKey: string | RecoveryKey,
): Promise<EncryptedPayload> {
  const parsed = typeof recoveryKey === 'string' ? parseRecoveryKey(recoveryKey) : recoveryKey
  const crypto = getWebCrypto()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await importAesKey(base64ToBytes(parsed.key), ['encrypt'])

  return {
    v: ENCRYPTION_VERSION,
    alg: 'AES-GCM',
    mode: 'recovery',
    iterations: 0,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: await encryptWithKey(plainText, key, iv),
  }
}

export async function decryptTextWithRecoveryKey(
  input: string | EncryptedPayload,
  recoveryKey: string | RecoveryKey,
): Promise<string> {
  const payload = typeof input === 'string' ? parseEncryptedPayload(input) : input
  if (payload.mode !== 'recovery') {
    throw new Error('This payload was encrypted with a password. Switch to Password mode.')
  }

  const parsed = typeof recoveryKey === 'string' ? parseRecoveryKey(recoveryKey) : recoveryKey
  const key = await importAesKey(base64ToBytes(parsed.key), ['decrypt'])
  return decryptWithKey(payload, key, 'Recovery key does not match this payload.')
}

// ------------------------------------------------------------- Shared parsing ---

export function parseEncryptedPayload(input: string): EncryptedPayload {
  let value: unknown
  try {
    value = JSON.parse(input.trim())
  } catch {
    throw new Error('That is not valid JSON. Paste the full encrypted payload.')
  }

  if (!value || typeof value !== 'object') {
    throw new Error('That payload is not an ONEV encrypted message.')
  }

  const candidate = value as Partial<EncryptedPayload>
  const mode: EncryptionMode = candidate.mode ?? 'password'
  const valid =
    candidate.v === ENCRYPTION_VERSION &&
    candidate.alg === 'AES-GCM' &&
    (mode === 'password' || mode === 'recovery') &&
    typeof candidate.salt === 'string' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.data === 'string'

  if (!valid) {
    throw new Error('Unsupported payload. Expected an ONEV AES-GCM message.')
  }

  const rawIterations = Number(candidate.iterations ?? 0)
  if (mode === 'password' && (rawIterations < 1000 || rawIterations > 5_000_000)) {
    throw new Error('Payload has an invalid iteration count.')
  }

  return {
    v: ENCRYPTION_VERSION,
    alg: 'AES-GCM',
    mode,
    iterations: mode === 'password' ? rawIterations : 0,
    salt: candidate.salt as string,
    iv: candidate.iv as string,
    data: candidate.data as string,
  }
}

// ------------------------------------------------------ Candidate recovery ---

export interface RecoveryResult {
  found: boolean
  password?: string
  attempts: number
  total: number
  elapsedMs: number
  truncated: boolean
  cancelled: boolean
}

export interface RecoverOptions {
  /** Default 500; hard-capped at MAX_RECOVERY_CANDIDATES. */
  maxAttempts?: number
  /** Parallel guesses. Default 2, capped at 8. */
  concurrency?: number
  signal?: AbortSignal
  onProgress?: (progress: { attempts: number; total: number }) => void
}

/**
 * Try a user-supplied list of candidate passwords against an ONEV payload.
 *
 * This does not attack or bypass AES-GCM: every guess goes through the exact
 * same authenticated PBKDF2 + decrypt path. Only ONEV-format payloads are
 * accepted, the list is deduplicated and capped, and the caller can cancel.
 */
export async function recoverPassword(
  input: string | EncryptedPayload,
  candidates: Iterable<string>,
  options: RecoverOptions = {},
): Promise<RecoveryResult> {
  const payload = typeof input === 'string' ? parseEncryptedPayload(input) : input
  if (payload.mode === 'recovery') {
    throw new Error('This payload uses a recovery key, not a password. Switch to Recovery key mode.')
  }

  const unique = [...new Set([...candidates].map((candidate) => candidate.trim()).filter(Boolean))]
  if (unique.length === 0) {
    throw new Error('Add at least one candidate password to try.')
  }

  const maxAttempts = Math.min(
    Math.max(1, Math.floor(options.maxAttempts ?? 500)),
    MAX_RECOVERY_CANDIDATES,
  )
  const list = unique.slice(0, maxAttempts)
  const concurrency = Math.min(Math.max(1, Math.floor(options.concurrency ?? 2)), 8)
  const started = Date.now()
  let cursor = 0
  let attempts = 0
  let found: string | undefined
  let cancelled = false

  async function worker(): Promise<void> {
    while (cursor < list.length && !found && !cancelled) {
      if (options.signal?.aborted) {
        cancelled = true
        break
      }

      const password = list[cursor]
      cursor += 1
      attempts += 1

      try {
        await decryptText(payload, password)
        found = password
      } catch {
        // A wrong guess is expected; continue with the next candidate.
      }

      options.onProgress?.({ attempts, total: list.length })
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, () => worker()))

  return {
    found: Boolean(found),
    password: found,
    attempts,
    total: list.length,
    elapsedMs: Date.now() - started,
    truncated: unique.length > list.length,
    cancelled,
  }
}

/** Expand words the user typed into likely personal patterns (never downloads anything). */
export function expandCandidateWords(raw: string): string[] {
  const words = raw
    .split(/[\s,;]+/)
    .map((word) => word.trim())
    .filter(Boolean)
  if (words.length === 0) return []

  const separators = ['', '-', '_', '.', '!']
  const year = new Date().getFullYear()
  const suffixes = Array.from({ length: 12 }, (_, index) => String(year - index))
  const candidates = new Set<string>(words)

  for (const word of words) {
    for (const separator of separators) {
      for (const suffix of suffixes) {
        candidates.add(`${word}${separator}${suffix}`)
        candidates.add(`${suffix}${separator}${word}`)
      }
    }
  }

  return [...candidates].slice(0, MAX_RECOVERY_CANDIDATES)
}
