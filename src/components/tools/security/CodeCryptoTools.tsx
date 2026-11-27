import {
  Download,
  FileUp,
  KeyRound,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Unlock,
} from 'lucide-react'
import { useRef, useState } from 'react'
import {
  buildWrapper,
  CODE_LANGUAGES,
  extractPayload,
  getLanguage,
  languageFromFilename,
  type CodeLanguage,
} from '../../../lib/codeCrypto'
import {
  decryptText,
  decryptTextWithRecoveryKey,
  encryptText,
  encryptTextWithRecoveryKey,
  ENCRYPTION_ITERATIONS,
  expandCandidateWords,
  generateRecoveryKey,
  MAX_RECOVERY_CANDIDATES,
  recoverPassword,
  type EncryptionMode,
  type RecoveryResult,
} from '../../../lib/crypto'
import { generatePassword } from '../../../lib/generators'
import { downloadText } from '../../../lib/utils'
import { Field } from '../../ui/Field'
import { Panel } from '../../ui/Panel'
import { ResultBox } from '../../ui/ResultBox'
import { Segmented } from '../../ui/Segmented'
import { errorMessage, PasswordField } from './CryptoTools'

interface KeyControlsProps {
  idPrefix: string
  mode: EncryptionMode
  onModeChange: (mode: EncryptionMode) => void
  password: string
  onPasswordChange: (value: string) => void
  recoveryKey: string
  onRecoveryKeyChange: (value: string) => void
  iterations?: string
  onIterationsChange?: (value: string) => void
}

function KeyControls({
  idPrefix,
  mode,
  onModeChange,
  password,
  onPasswordChange,
  recoveryKey,
  onRecoveryKeyChange,
  iterations,
  onIterationsChange,
}: KeyControlsProps) {
  return (
    <div className="space-y-4">
      <Field label="Key source">
        <Segmented
          size="sm"
          value={mode}
          onChange={onModeChange}
          options={[
            { value: 'password', label: 'Password', icon: Lock },
            { value: 'recovery', label: 'Recovery key', icon: KeyRound },
          ]}
        />
      </Field>

      {mode === 'password' ? (
        <>
          <PasswordField id={`${idPrefix}-password`} value={password} onChange={onPasswordChange} />
          <button
            type="button"
            onClick={() =>
              onPasswordChange(
                generatePassword({
                  length: 24,
                  uppercase: true,
                  lowercase: true,
                  digits: true,
                  symbols: true,
                  excludeSimilar: true,
                }),
              )
            }
            className="btn-ghost !py-1.5 !text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" /> Generate a strong password
          </button>

          {onIterationsChange && (
            <Field label="Key derivation" hint="The count is stored inside the payload.">
              <Segmented
                size="sm"
                value={iterations ?? String(ENCRYPTION_ITERATIONS)}
                onChange={onIterationsChange}
                options={[
                  { value: '100000', label: 'Fast · 100k' },
                  { value: '250000', label: 'Balanced · 250k' },
                  { value: '600000', label: 'Strong · 600k' },
                ]}
              />
            </Field>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onRecoveryKeyChange(generateRecoveryKey())}
            className="btn-ghost !py-1.5 !text-xs"
          >
            <KeyRound className="h-3.5 w-3.5" /> Generate recovery key
          </button>
          <Field
            label="Recovery key JSON"
            hint="Store this key separately from the encrypted code."
          >
            <textarea
              value={recoveryKey}
              onChange={(event) => onRecoveryKeyChange(event.target.value)}
              rows={5}
              spellCheck={false}
              placeholder={'{\n  "v": 1,\n  "alg": "AES-256-GCM",\n  "key": "..."\n}'}
              aria-label="Recovery key JSON"
              className="input-mono min-h-[110px] w-full resize-y leading-relaxed"
            />
          </Field>
          {recoveryKey && (
            <button
              type="button"
              onClick={() => downloadText('onev-recovery-key.json', recoveryKey, 'application/json')}
              className="btn-ghost !py-1.5 !text-xs"
            >
              <Download className="h-3.5 w-3.5" /> Download key
            </button>
          )}
        </>
      )}
    </div>
  )
}

function FilePicker({
  accept,
  label,
  onLoad,
}: {
  accept: string
  label: string
  onLoad: (filename: string, content: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          void file.text().then((content) => onLoad(file.name, content))
          event.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="btn-ghost !py-1.5 !text-xs"
      >
        <FileUp className="h-3.5 w-3.5" /> {label}
      </button>
    </>
  )
}

async function encryptSource(
  source: string,
  mode: EncryptionMode,
  password: string,
  recoveryKey: string,
  iterations: string,
) {
  return mode === 'recovery'
    ? encryptTextWithRecoveryKey(source, recoveryKey)
    : encryptText(source, password, Number(iterations))
}

async function decryptSource(
  input: string,
  mode: EncryptionMode,
  password: string,
  recoveryKey: string,
) {
  const payload = extractPayload(input)
  return mode === 'recovery'
    ? decryptTextWithRecoveryKey(payload, recoveryKey)
    : decryptText(payload, password)
}

// --------------------------------------------------------------- Code encrypt ---

export function CodeEncryptor() {
  const [language, setLanguage] = useState<CodeLanguage>('javascript')
  const [source, setSource] = useState('')
  const [mode, setMode] = useState<EncryptionMode>('password')
  const [password, setPassword] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [iterations, setIterations] = useState(String(ENCRYPTION_ITERATIONS))
  const [outputMode, setOutputMode] = useState<'payload' | 'wrapper'>('wrapper')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const languageInfo = getLanguage(language)
  const wrapperMode = outputMode === 'wrapper' && languageInfo.wrapper

  function resetResult() {
    setResult('')
    setError('')
  }

  async function run() {
    setBusy(true)
    resetResult()
    try {
      const payload = await encryptSource(source, mode, password, recoveryKey, iterations)
      setResult(
        wrapperMode
          ? buildWrapper(payload, languageInfo.id)
          : JSON.stringify(payload, null, 2),
      )
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
        <Panel
          title="Source code"
          subtitle="JS, TS, Python, Go, Rust and more — nothing leaves this tab."
          action={
            <FilePicker
              accept=".js,.jsx,.mjs,.ts,.tsx,.py,.pyw,.go,.rs,.php,.java,.cs,.sql,.sh,.txt,.json"
              label="Load file"
              onLoad={(filename, content) => {
                setLanguage(languageFromFilename(filename))
                setSource(content)
                setOutputMode('wrapper')
                resetResult()
              }}
            />
          }
        >
          <Field label="Language">
            <select
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value as CodeLanguage)
                setOutputMode('wrapper')
                resetResult()
              }}
              className="input"
              aria-label="Code language"
            >
              {CODE_LANGUAGES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <textarea
            value={source}
            onChange={(event) => {
              setSource(event.target.value)
              resetResult()
            }}
            rows={12}
            spellCheck={false}
            placeholder={`// Paste your ${languageInfo.label} source here…`}
            aria-label="Source code to encrypt"
            className="input-mono mt-4 min-h-[240px] w-full resize-y leading-relaxed"
          />
        </Panel>

        <Panel title="Encryption key">
          <KeyControls
            idPrefix="code-encrypt"
            mode={mode}
            onModeChange={(value) => {
              setMode(value)
              resetResult()
            }}
            password={password}
            onPasswordChange={(value) => {
              setPassword(value)
              resetResult()
            }}
            recoveryKey={recoveryKey}
            onRecoveryKeyChange={(value) => {
              setRecoveryKey(value)
              resetResult()
            }}
            iterations={iterations}
            onIterationsChange={(value) => {
              setIterations(value)
              resetResult()
            }}
          />

          <div className="mt-5">
            <Field
              label="Output format"
              hint={
                languageInfo.runnable
                  ? 'Wrapper prints the restored source; payload is plain JSON.'
                  : 'Wrapper keeps the original file format; restore it with Code Decryptor.'
              }
            >
              <Segmented
                size="sm"
                value={outputMode}
                onChange={(value) => {
                  setOutputMode(value)
                  resetResult()
                }}
                options={[
                  { value: 'payload', label: 'JSON payload' },
                  {
                    value: 'wrapper',
                    label: languageInfo.runnable ? 'Runnable wrapper' : 'Source wrapper',
                  },
                ]}
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={() => void run()}
            disabled={
              busy ||
              !source ||
              (mode === 'password' ? !password : !recoveryKey.trim())
            }
            className="btn-primary mt-5 w-full"
          >
            <Lock className="h-4 w-4" />
            {busy ? 'Encrypting…' : 'Encrypt code'}
          </button>
          {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
        </Panel>
      </div>

      <div className="min-w-0 space-y-5">
        <Panel
          title={
            wrapperMode
              ? languageInfo.runnable
                ? 'Runnable wrapper'
                : `${languageInfo.label} wrapper`
              : 'Encrypted payload'
          }
          subtitle={
            wrapperMode
              ? languageInfo.runnable
                ? 'Set ONEV_PASSWORD (or ONEV_RECOVERY_KEY) and run the file to print your source.'
                : `Paste this file into Code Decryptor with the matching key to restore .${languageInfo.extension} source.`
              : 'Feed this to Code Decryptor with the matching key.'
          }
          action={
            result ? (
              <button
                type="button"
                onClick={() =>
                  downloadText(
                    wrapperMode
                      ? `onev-encrypted.${languageInfo.extension}`
                      : 'onev-code-encrypted.json',
                    result,
                    wrapperMode ? 'text/plain' : 'application/json',
                  )
                }
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
            copyLabel={wrapperMode ? 'Copy wrapper' : 'Copy payload'}
            downloadFilename={
              wrapperMode ? `onev-encrypted.${languageInfo.extension}` : 'onev-code-encrypted.json'
            }
            downloadMime={wrapperMode ? 'text/plain' : 'application/json'}
          />
        </Panel>

        <Panel title="Recovery tip">
          <ul className="space-y-2 text-xs leading-relaxed text-muted">
            <li>
              • Save a <span className="font-mono text-cyan">recovery key</span> alongside the
              payload so a forgotten password is not fatal.
            </li>
            <li>• Keep the key in a different place from the encrypted file.</li>
            <li>
              • Runnable wrappers print the restored source; other languages keep their file format
              and are restored here with the matching key.
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}

// --------------------------------------------------------------- Code decrypt ---

export function CodeDecryptor() {
  const [language, setLanguage] = useState<CodeLanguage>('javascript')
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<EncryptionMode>('password')
  const [password, setPassword] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const languageInfo = getLanguage(language)

  async function run() {
    setBusy(true)
    setResult('')
    setError('')
    try {
      setResult(await decryptSource(input, mode, password, recoveryKey))
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
        <Panel
          title="Encrypted input"
          subtitle="Paste the JSON payload or the full generated wrapper."
          action={
            <div className="flex gap-2">
              <FilePicker
                accept=".json,.js,.jsx,.mjs,.cjs,.ts,.tsx,.py,.pyw,.go,.rs,.php,.java,.cs,.sql,.sh,.txt"
                label="Load file"
                onLoad={(filename, content) => {
                  setInput(content)
                  const inferred = languageFromFilename(filename)
                  if (inferred !== 'text') setLanguage(inferred)
                  setResult('')
                  setError('')
                }}
              />
              <button
                type="button"
                disabled={!input.trim()}
                onClick={() => {
                  try {
                    setInput(extractPayload(input))
                    setResult('')
                    setError('')
                  } catch (cause) {
                    setError(errorMessage(cause))
                  }
                }}
                className="btn-ghost !py-1.5 !text-xs"
              >
                Extract payload
              </button>
            </div>
          }
        >
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setResult('')
              setError('')
            }}
            rows={14}
            spellCheck={false}
            placeholder={'{\n  "v": 1,\n  "alg": "AES-GCM",\n  ...\n}'}
            aria-label="Encrypted code payload"
            className="input-mono min-h-[280px] w-full resize-y leading-relaxed"
          />
        </Panel>

        <Panel title="Decryption key">
          <KeyControls
            idPrefix="code-decrypt"
            mode={mode}
            onModeChange={(value) => {
              setMode(value)
              setError('')
            }}
            password={password}
            onPasswordChange={(value) => {
              setPassword(value)
              setError('')
            }}
            recoveryKey={recoveryKey}
            onRecoveryKeyChange={(value) => {
              setRecoveryKey(value)
              setError('')
            }}
          />
          <button
            type="button"
            onClick={() => void run()}
            disabled={busy || !input.trim() || (mode === 'password' ? !password : !recoveryKey.trim())}
            className="btn-primary mt-5 w-full"
          >
            <Unlock className="h-4 w-4" />
            {busy ? 'Decrypting…' : 'Decrypt code'}
          </button>
          {error && <p className="mt-3 break-words text-xs text-rose-400">{error}</p>}
        </Panel>
      </div>

      <div className="min-w-0 space-y-5">
        <Panel
          title="Restored source"
          subtitle="Shown only after the authentication tag is verified."
          action={
            result ? (
              <button
                type="button"
                onClick={() => downloadText(`restored.${languageInfo.extension}`, result)}
                className="btn-ghost !py-1.5 !text-xs"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            ) : undefined
          }
        >
          <Field label="Save as">
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as CodeLanguage)}
              className="input"
              aria-label="Restored file language"
            >
              {CODE_LANGUAGES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} (.{option.extension})
                </option>
              ))}
            </select>
          </Field>
          <div className="mt-4">
            <ResultBox
              value={result}
              minHeight="300px"
              copyLabel="Copy source"
              downloadFilename={`restored.${languageInfo.extension}`}
            />
          </div>
        </Panel>

        <Panel title="Good to know">
          <ul className="space-y-2 text-xs leading-relaxed text-muted">
            <li>• Wrappers are parsed automatically; the embedded payload is used for decryption.</li>
            <li>• A wrong key or a single changed character is rejected by AES-GCM.</li>
            <li>• Everything happens locally with the browser Web Crypto API.</li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}

// ---------------------------------------------------------- Password recovery ---

export function PasswordRecovery() {
  const [payload, setPayload] = useState('')
  const [candidates, setCandidates] = useState('')
  const [seedWords, setSeedWords] = useState('')
  const [maxAttempts, setMaxAttempts] = useState('500')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ attempts: 0, total: 0 })
  const [result, setResult] = useState<RecoveryResult | null>(null)
  const [error, setError] = useState('')
  const controllerRef = useRef<AbortController | null>(null)

  async function run() {
    const controller = new AbortController()
    controllerRef.current = controller
    setBusy(true)
    setError('')
    setResult(null)
    setProgress({ attempts: 0, total: 0 })

    try {
      const outcome = await recoverPassword(payload, candidates.split(/\r?\n/), {
        maxAttempts: Number(maxAttempts),
        signal: controller.signal,
        onProgress: (next) => setProgress(next),
      })
      setResult(outcome)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      controllerRef.current = null
      setBusy(false)
    }
  }

  const percent = progress.total ? Math.round((progress.attempts / progress.total) * 100) : 0

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
        <Panel
          title="Your ONEV payload"
          subtitle="Only ONEV-format payloads are accepted."
          action={
            <FilePicker
              accept=".json,.txt"
              label="Load file"
              onLoad={(_filename, content) => {
                setPayload(content)
                setResult(null)
                setError('')
              }}
            />
          }
        >
          <textarea
            value={payload}
            onChange={(event) => {
              setPayload(event.target.value)
              setResult(null)
              setError('')
            }}
            rows={9}
            spellCheck={false}
            placeholder={'{\n  "v": 1,\n  "alg": "AES-GCM",\n  ...\n}'}
            aria-label="Payload for password recovery"
            className="input-mono min-h-[190px] w-full resize-y leading-relaxed"
          />
        </Panel>

        <Panel title="Candidate passwords" subtitle="One guess per line, in the order you want them tried.">
          <textarea
            value={candidates}
            onChange={(event) => {
              setCandidates(event.target.value)
              setResult(null)
              setError('')
            }}
            rows={9}
            spellCheck={false}
            placeholder={'password-saya\nnama+2024\nalamat-rumah'}
            aria-label="Candidate passwords"
            className="input-mono min-h-[190px] w-full resize-y leading-relaxed"
          />
          <div className="mt-4 space-y-4">
            <Field
              label="Expand my words"
              hint="Combines only the words you type below with common separators and recent years."
            >
              <div className="flex gap-2">
                <input
                  value={seedWords}
                  onChange={(event) => setSeedWords(event.target.value)}
                  placeholder="nama, kota, hewan"
                  aria-label="Seed words for candidate expansion"
                  className="input font-mono !py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const expanded = expandCandidateWords(seedWords)
                    if (!expanded.length) {
                      setError('Isi kata dasar dulu sebelum dikembangkan.')
                      return
                    }
                    const existing = candidates.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
                    setCandidates([...new Set([...existing, ...expanded])].join('\n'))
                    setError('')
                  }}
                  className="btn-ghost shrink-0 !py-2 !text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Expand
                </button>
              </div>
            </Field>

            <Field label="Attempt limit" hint={`Hard cap: ${MAX_RECOVERY_CANDIDATES.toLocaleString()} guesses. Default 500.`}>
              <Segmented
                size="sm"
                value={maxAttempts}
                onChange={(value) => {
                  setMaxAttempts(value)
                  setResult(null)
                }}
                options={[
                  { value: '100', label: '100' },
                  { value: '500', label: '500' },
                  { value: '5000', label: '5.000' },
                ]}
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Run recovery">
          <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-muted">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-cyan"
            />
            <span>
              Saya yakin payload ini milik saya dan kandidatnya berasal dari ingatan saya sendiri.
            </span>
          </label>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy || !consent || !payload.trim() || !candidates.trim()}
              className="btn-primary flex-1"
            >
              <Search className="h-4 w-4" />
              {busy ? 'Mencoba…' : 'Coba kandidat'}
            </button>
            {busy && (
              <button type="button" onClick={() => controllerRef.current?.abort()} className="btn-ghost">
                Stop
              </button>
            )}
          </div>

          {(busy || progress.attempts > 0) && (
            <div className="mt-4 space-y-1.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-soft">
                <div
                  className="h-full bg-gradient-to-r from-cyan to-electric transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-[11px] text-muted">
                {progress.attempts} / {progress.total} percobaan · {percent}%
              </p>
            </div>
          )}
          {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
        </Panel>
      </div>

      <div className="min-w-0 space-y-5">
        <Panel title="Hasil" subtitle="Ditemukan hanya jika tag autentikasi AES-GCM cocok.">
          {!result ? (
            <p className="text-xs text-muted">Belum ada percobaan dijalankan.</p>
          ) : result.found ? (
            <ResultBox
              label="Password ditemukan"
              value={result.password ?? ''}
              hint="Simpan password ini di tempat yang aman."
              copyLabel="Copy password"
            />
          ) : (
            <div className="rounded-lg border border-line/70 bg-panel-soft/70 p-4 text-sm text-muted">
              {result.cancelled
                ? 'Percobaan dihentikan.'
                : `Tidak ada kandidat yang cocok dalam ${result.attempts} percobaan.`}
            </div>
          )}

          {result && (
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-muted">
              <div className="rounded-lg border border-line/70 bg-panel-soft/50 p-2">
                <div className="font-mono text-sm text-ink">{result.attempts}</div>
                percobaan
              </div>
              <div className="rounded-lg border border-line/70 bg-panel-soft/50 p-2">
                <div className="font-mono text-sm text-ink">{(result.elapsedMs / 1000).toFixed(1)}s</div>
                waktu
              </div>
              <div className="rounded-lg border border-line/70 bg-panel-soft/50 p-2">
                <div className="font-mono text-sm text-ink">{result.truncated ? 'Ya' : 'Tidak'}</div>
                terpotong
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Batas & keamanan">
          <ul className="space-y-2 text-xs leading-relaxed text-muted">
            <li>
              • Ini <span className="font-mono text-cyan">bukan</span> pemecah AES — setiap kandidat
              lewat jalur PBKDF2 + dekripsi yang sama.
            </li>
            <li>• Hanya payload format ONEV yang diterima; kandidat berasal dari Anda.</li>
            <li>• Maksimal {MAX_RECOVERY_CANDIDATES.toLocaleString()} kandidat unik, bisa dihentikan kapan saja.</li>
            <li>• Semua berjalan di browser. Tidak ada jaringan, tidak ada unggahan.</li>
          </ul>
          <p className="mt-4 flex items-center gap-2 text-[11px] text-muted">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cyan" />
            Kalau Anda punya recovery key, itu jauh lebih cepat daripada menebak password.
          </p>
        </Panel>
      </div>
    </div>
  )
}
