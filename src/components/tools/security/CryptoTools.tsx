import { Download, Eye, EyeOff, Lock, Sparkles, Unlock } from 'lucide-react'
import { useState } from 'react'
import { Field } from '../../ui/Field'
import { Panel } from '../../ui/Panel'
import { ResultBox } from '../../ui/ResultBox'
import { Segmented } from '../../ui/Segmented'
import {
  decryptText,
  encryptText,
  ENCRYPTION_ITERATIONS,
} from '../../../lib/crypto'
import { generatePassword } from '../../../lib/generators'
import { downloadText } from '../../../lib/utils'

export function PasswordField({
  id,
  value,
  onChange,
  label = 'Password',
}: {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder="Enter a password"
          className="input pr-10 font-mono"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-slate-500 transition hover:text-cyan"
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
    </Field>
  )
}

export function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Something went wrong.'
}

// ------------------------------------------------------------------ Encrypt ---

export function TextEncryptor() {
  const [plainText, setPlainText] = useState('')
  const [password, setPassword] = useState('')
  const [iterations, setIterations] = useState(String(ENCRYPTION_ITERATIONS))
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    setError('')
    setResult('')
    try {
      const payload = await encryptText(plainText, password, Number(iterations))
      setResult(JSON.stringify(payload, null, 2))
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
        <Panel title="Plaintext" subtitle="Anything you type stays in this browser tab.">
          <textarea
            value={plainText}
            onChange={(event) => {
              setPlainText(event.target.value)
              setResult('')
            }}
            rows={10}
            spellCheck={false}
            placeholder="Type or paste the text you want to protect…"
            aria-label="Plaintext to encrypt"
            className="input min-h-[220px] w-full resize-y leading-relaxed"
          />
        </Panel>

        <Panel title="Encryption key">
          <div className="space-y-4">
            <PasswordField id="encrypt-password" value={password} onChange={setPassword} />
            <button
              type="button"
              onClick={() => setPassword(generatePassword({
                length: 24,
                uppercase: true,
                lowercase: true,
                digits: true,
                symbols: true,
                excludeSimilar: true,
              }))}
              className="btn-ghost !py-1.5 !text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate a strong password
            </button>

            <Field label="Key derivation" hint="More iterations are slower but harder to brute-force.">
              <Segmented
                size="sm"
                value={iterations}
                onChange={setIterations}
                options={[
                  { value: '100000', label: 'Fast · 100k' },
                  { value: '250000', label: 'Balanced · 250k' },
                  { value: '600000', label: 'Strong · 600k' },
                ]}
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={() => void run()}
            disabled={busy || !password || !plainText}
            className="btn-primary mt-5 w-full"
          >
            <Lock className="h-4 w-4" />
            {busy ? 'Encrypting…' : 'Encrypt text'}
          </button>
          {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
        </Panel>
      </div>

      <div className="min-w-0 space-y-5">
        <Panel
          title="Encrypted payload"
          subtitle="Copy this whole JSON block to the Decrypt tool."
          action={
            result ? (
              <button
                type="button"
                onClick={() => downloadText('onev-encrypted.json', result, 'application/json')}
                className="btn-ghost !py-1.5 !text-xs"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            ) : undefined
          }
        >
          <ResultBox
            value={result}
            minHeight="300px"
            copyLabel="Copy payload"
            downloadFilename="onev-encrypted.json"
            downloadMime="application/json"
          />
        </Panel>

        <Panel title="How it works">
          <ul className="space-y-2 text-xs leading-relaxed text-muted">
            <li>• <span className="font-mono text-cyan">AES-256-GCM</span> authenticated encryption.</li>
            <li>• Key derived with <span className="font-mono text-cyan">PBKDF2-SHA256</span> from your password.</li>
            <li>• Fresh 16-byte salt and 12-byte IV for every message.</li>
            <li>• The password is never stored or sent anywhere.</li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Decrypt ---

export function TextDecryptor() {
  const [payload, setPayload] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    setError('')
    setResult('')
    try {
      setResult(await decryptText(payload, password))
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
        <Panel title="Encrypted payload" subtitle="Paste the JSON produced by the Encrypt tool.">
          <textarea
            value={payload}
            onChange={(event) => {
              setPayload(event.target.value)
              setResult('')
              setError('')
            }}
            rows={14}
            spellCheck={false}
            placeholder={'{\n  "v": 1,\n  "alg": "AES-GCM",\n  ...\n}'}
            aria-label="Encrypted payload"
            className="input-mono min-h-[300px] w-full resize-y leading-relaxed"
          />
        </Panel>

        <Panel title="Decryption key">
          <PasswordField id="decrypt-password" value={password} onChange={setPassword} />
          <button
            type="button"
            onClick={() => void run()}
            disabled={busy || !password || !payload.trim()}
            className="btn-primary mt-5 w-full"
          >
            <Unlock className="h-4 w-4" />
            {busy ? 'Decrypting…' : 'Decrypt text'}
          </button>
          {error && <p className="mt-3 break-words text-xs text-rose-400">{error}</p>}
        </Panel>
      </div>

      <div className="min-w-0 space-y-5">
        <Panel
          title="Decrypted text"
          subtitle="Shown only after the authentication tag is verified."
          action={
            result ? (
              <button
                type="button"
                onClick={() => downloadText('onev-decrypted.txt', result)}
                className="btn-ghost !py-1.5 !text-xs"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            ) : undefined
          }
        >
          <ResultBox
            value={result}
            mono={false}
            minHeight="300px"
            copyLabel="Copy plaintext"
            downloadFilename="onev-decrypted.txt"
          />
        </Panel>

        <Panel title="Good to know">
          <ul className="space-y-2 text-xs leading-relaxed text-muted">
            <li>• The salt, IV and iteration count travel inside the payload.</li>
            <li>• A wrong password or edited cipher will be rejected.</li>
            <li>• Decryption runs locally with the browser&apos;s Web Crypto API.</li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}
