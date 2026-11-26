import { describe, expect, it } from 'vitest'
import type { EncryptedPayload } from './crypto'
import {
  buildJavaScriptWrapper,
  buildPythonWrapper,
  buildWrapper,
  CODE_LANGUAGES,
  extractPayload,
  getLanguage,
  languageFromFilename,
} from './codeCrypto'

const payload: EncryptedPayload = {
  v: 1,
  alg: 'AES-GCM',
  mode: 'password',
  iterations: 100_000,
  salt: 'c2FsdHNhbHRzYWx0c2FsdA==',
  iv: 'aXZpdml2aXY=',
  data: 'ZGF0YWRhdGE=',
}

describe('codeCrypto', () => {
  it('builds a JavaScript wrapper with the embedded payload', () => {
    const wrapper = buildJavaScriptWrapper(payload)

    expect(wrapper).toContain('const PAYLOAD = {')
    expect(wrapper).toContain('ONEV_PASSWORD')
    expect(JSON.parse(extractPayload(wrapper))).toEqual(payload)
  })

  it('builds a Python wrapper with the embedded payload', () => {
    const wrapper = buildPythonWrapper(payload)

    expect(wrapper).toContain("PAYLOAD = json.loads(r'''")
    expect(wrapper).toContain('PBKDF2HMAC')
    expect(JSON.parse(extractPayload(wrapper))).toEqual(payload)
  })

  it('handles recovery-mode wrappers and unsupported languages', () => {
    const recoveryPayload: EncryptedPayload = { ...payload, mode: 'recovery', iterations: 0 }

    expect(buildJavaScriptWrapper(recoveryPayload)).toContain('ONEV_RECOVERY_KEY')
    expect(buildPythonWrapper(recoveryPayload)).toContain('ONEV_RECOVERY_KEY')
    expect(buildWrapper(payload, 'go')).toBe('')
    expect(buildWrapper(payload, 'python')).toContain('AESGCM')
  })

  it('passes JSON through and rejects unknown input', () => {
    const json = JSON.stringify(payload, null, 2)

    expect(extractPayload(`  ${json}  `)).toBe(json)
    expect(() => extractPayload('console.log(1)')).toThrow(/No ONEV payload/)
  })

  it('exposes every language with the right wrapper support', () => {
    expect(CODE_LANGUAGES).toHaveLength(11)
    expect(getLanguage('python').extension).toBe('py')
    expect(getLanguage('javascript').wrapper).toBe(true)
    expect(getLanguage('unknown').id).toBe('javascript')
  })

  it('infers language from uploaded filenames', () => {
    expect(languageFromFilename('app.py')).toBe('python')
    expect(languageFromFilename('index.tsx')).toBe('typescript')
    expect(languageFromFilename('main.go')).toBe('go')
    expect(languageFromFilename('mystery.bin')).toBe('text')
  })
})
