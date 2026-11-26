import { describe, expect, it } from 'vitest'
import {
  decryptText,
  decryptTextWithRecoveryKey,
  encryptText,
  encryptTextWithRecoveryKey,
  expandCandidateWords,
  generateRecoveryKey,
  MAX_RECOVERY_CANDIDATES,
  parseEncryptedPayload,
  recoverPassword,
} from './crypto'

const ITERATIONS = 20_000

describe('crypto', () => {
  it('round-trips UTF-8 text with a password', async () => {
    const payload = await encryptText('Rahasia ONEV 🚀 café', 'sandikuat', ITERATIONS)

    expect(payload.v).toBe(1)
    expect(payload.alg).toBe('AES-GCM')
    expect(payload.mode).toBe('password')
    expect(payload.iterations).toBe(ITERATIONS)
    expect(payload.salt).not.toBe(payload.iv)
    expect(await decryptText(payload, 'sandikuat')).toBe('Rahasia ONEV 🚀 café')
  })

  it('accepts a serialized payload', async () => {
    const payload = await encryptText('hello', 'password', ITERATIONS)
    const decoded = await decryptText(JSON.stringify(payload), 'password')
    expect(decoded).toBe('hello')
  })

  it('round-trips text with a generated recovery key', async () => {
    const key = generateRecoveryKey()
    const payload = await encryptTextWithRecoveryKey('const x = 1', key)

    expect(payload.mode).toBe('recovery')
    expect(payload.iterations).toBe(0)
    expect(await decryptTextWithRecoveryKey(JSON.stringify(payload), key)).toBe('const x = 1')
    await expect(decryptText(payload, 'anything')).rejects.toThrow(/recovery key/)
  })

  it('rejects a wrong password', async () => {
    const payload = await encryptText('rahasia', 'password-satu', ITERATIONS)
    await expect(decryptText(payload, 'password-dua')).rejects.toThrow(/Decryption failed/)
  })

  it('rejects a tampered payload', async () => {
    const payload = await encryptText('jangan diubah', 'password', ITERATIONS)
    const last = payload.data.slice(-1)
    payload.data = `${payload.data.slice(0, -1)}${last === 'A' ? 'B' : 'A'}`

    await expect(decryptText(payload, 'password')).rejects.toThrow(/Decryption failed/)
  })

  it('validates payload shape and passwords', async () => {
    expect(() => parseEncryptedPayload('{}')).toThrow(/Unsupported payload/)
    expect(() => parseEncryptedPayload('not json')).toThrow(/not valid JSON/)
    await expect(encryptText('isi', '', ITERATIONS)).rejects.toThrow(/Enter a password/)
    await expect(decryptText('{}', 'password')).rejects.toThrow(/Unsupported payload/)
  })
})

describe('recoverPassword', () => {
  it('finds a password from a user-supplied candidate list', async () => {
    const payload = await encryptText('kode saya', 'kata-yang-benar', ITERATIONS)
    const result = await recoverPassword(payload, ['salah', '  kata-yang-benar  ', 'juga-salah'], {
      concurrency: 1,
    })

    expect(result.found).toBe(true)
    expect(result.password).toBe('kata-yang-benar')
    expect(result.attempts).toBe(2)
    expect(result.cancelled).toBe(false)
  })

  it('reports a miss, duplicate removal and truncation', async () => {
    const payload = await encryptText('kode saya', 'rahasia', ITERATIONS)
    const result = await recoverPayloadWith(payload, ['satu', 'satu', 'dua', 'tiga'], 2)

    expect(result.found).toBe(false)
    expect(result.attempts).toBe(2)
    expect(result.total).toBe(2)
    expect(result.truncated).toBe(true)
  })

  it('can be cancelled and refuses non-password payloads', async () => {
    const payload = await encryptText('isi', 'rahasia', ITERATIONS)
    const controller = new AbortController()
    controller.abort()
    const cancelled = await recoverPassword(payload, ['satu'], { signal: controller.signal })

    expect(cancelled.cancelled).toBe(true)
    expect(cancelled.found).toBe(false)

    const key = generateRecoveryKey()
    const recoveryPayload = await encryptTextWithRecoveryKey('isi', key)
    await expect(recoverPassword(recoveryPayload, ['satu'])).rejects.toThrow(/recovery key/)
    await expect(recoverPassword(payload, [])).rejects.toThrow(/at least one candidate/)
  })
})

async function recoverPayloadWith(
  payload: Parameters<typeof recoverPassword>[0],
  candidates: string[],
  maxAttempts: number,
) {
  return recoverPassword(payload, candidates, { maxAttempts, concurrency: 1 })
}

describe('expandCandidateWords', () => {
  it('expands only the words supplied by the caller', () => {
    const candidates = expandCandidateWords('nama, kota')

    expect(candidates).toContain('nama')
    expect(candidates).toContain('kota')
    expect(candidates.some((value) => value.includes(String(new Date().getFullYear())))).toBe(true)
    expect(new Set(candidates).size).toBe(candidates.length)
    expect(candidates.length).toBeLessThanOrEqual(MAX_RECOVERY_CANDIDATES)
  })
})
