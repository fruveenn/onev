import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

export type Language = 'id' | 'en'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

/**
 * Language toggle. Only descriptive copy is translated — tool names, page
 * titles and category names intentionally stay in English.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalStorage<Language>('onev:language', 'id')

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}

export function translate(
  text: string,
  language: Language,
  values?: Record<string, string | number>,
): string {
  const source = language === 'id' ? INDONESIAN[text] ?? text : text
  if (!values) return source
  return source.replace(/\{(\w+)\}/g, (_match: string, key: string) =>
    String(values[key] ?? `{${key}}`),
  )
}

export function useT() {
  const { language } = useLanguage()
  return useCallback(
    (text: string, values?: Record<string, string | number>) => translate(text, language, values),
    [language],
  )
}

export const INDONESIAN: Record<string, string> = {
  tool: 'alat',
  tools: 'alat',

  // Tool descriptions
  'Create strong, random passwords with custom character rules.':
    'Buat kata sandi acak yang kuat dengan aturan karakter sendiri.',
  'Pick random integers or decimals, with optional uniqueness.':
    'Pilih bilangan bulat atau desimal acak, dengan opsi nilai unik.',
  'Generate and fine-tune CSS gradients with copied code.':
    'Buat dan atur gradien CSS, lalu salin kodenya.',
  'Search and copy emojis by name across nine categories.':
    'Cari dan salin emoji berdasarkan nama dalam sembilan kategori.',
  'Generate RFC 4122 version 4 identifiers in bulk.':
    'Buat pengenal RFC 4122 versi 4 secara massal.',
  'Placeholder paragraphs, sentences or words on demand.':
    'Paragraf, kalimat, atau kata pengisi sesuai kebutuhan.',
  'Pretty-print JSON with adjustable indentation and syntax colors.':
    'Rapikan JSON dengan indentasi dan warna sintaks yang bisa diatur.',
  'Check JSON syntax and get the exact location of errors.':
    'Periksa sintaks JSON dan lihat lokasi kesalahan secara tepat.',
  'Strip whitespace from JSON and compare the size saved.':
    'Hapus spasi berlebih dari JSON dan bandingkan ukuran yang hemat.',
  'Beautify stylesheets with Prettier in your browser.':
    'Rapikan stylesheet dengan Prettier langsung di browser.',
  'Format JS or JSX consistently without leaving the page.':
    'Format JS atau JSX secara konsisten tanpa meninggalkan halaman.',
  'Tidy markup with reliable, configurable formatting.':
    'Rapikan markup dengan format yang andal dan bisa diatur.',
  'Turn headings into clean, URL-friendly slugs.':
    'Ubah judul menjadi slug yang bersih dan ramah URL.',
  'Convert kebab or snake case back into readable labels.':
    'Kembalikan kebab atau snake case menjadi label yang mudah dibaca.',
  'Encode UTF-8 text as space-separated binary bytes.':
    'Ubah teks UTF-8 menjadi byte biner yang dipisah spasi.',
  'Decode binary bytes back into human-readable text.':
    'Kembalikan byte biner menjadi teks yang bisa dibaca.',
  'Encode and decode UTF-8 text with Base64.':
    'Enkode dan dekode teks UTF-8 dengan Base64.',
  'Percent-encode query values and decode them safely.':
    'Enkode persentase nilai query dan dekode dengan aman.',
  'Switch between camel, snake, kebab, title and more.':
    'Ganti antara camel, snake, kebab, title, dan lainnya.',
  'Replace text with regex, whole-word and case options.':
    'Ganti teks dengan regex, opsi kata utuh, dan huruf besar/kecil.',
  'Live word, character, sentence and reading-time stats.':
    'Statistik kata, karakter, kalimat, dan waktu baca secara langsung.',
  'Write Markdown and preview sanitized HTML instantly.':
    'Tulis Markdown dan lihat pratinjau HTML yang dibersihkan seketika.',
  'Repeat any text a set number of times with a separator.':
    'Ulangi teks beberapa kali dengan pemisah tertentu.',
  'Flip text character-by-character, instantly.':
    'Balik teks per karakter secara instan.',
  'Sort lines alphabetically and remove duplicates.':
    'Urutkan baris berdasarkan abjad dan hapus duplikat.',
  'Keyboard-friendly arithmetic with parentheses and powers.':
    'Aritmetika ramah keyboard dengan tanda kurung dan pangkat.',
  'Find percentages, changes and increases in one place.':
    'Hitung persentase, perubahan, dan kenaikan di satu tempat.',
  'Calculate exact age in years, months and days.':
    'Hitung usia tepat dalam tahun, bulan, dan hari.',
  'Split a bill with tax and tip across any number of people.':
    'Bagi tagihan beserta pajak dan tip ke sejumlah orang.',
  'Mean, median, range and more from a list of numbers.':
    'Rata-rata, median, rentang, dan lain-lain dari daftar angka.',
  'Work out the right tip and total in seconds.':
    'Hitung tip dan total dengan tepat dalam hitungan detik.',
  'Convert between metric, imperial and nautical lengths.':
    'Konversi panjang metrik, imperial, dan nautika.',
  'Kilograms, pounds, ounces, stones and tonnes.':
    'Kilogram, pon, ons, stone, dan ton.',
  'Celsius, Fahrenheit and Kelvin without guesswork.':
    'Celsius, Fahrenheit, dan Kelvin tanpa tebakan.',
  'Square units, hectares and acres.': 'Satuan luas, hektar, dan acre.',
  'Litres, gallons, cups and cooking measures.':
    'Liter, galon, cangkir, dan takaran memasak.',
  'm/s, km/h, mph, knots and feet per second.':
    'm/s, km/jam, mph, knot, dan kaki per detik.',
  'Milliseconds to days, weeks and years.':
    'Milidetik hingga hari, minggu, dan tahun.',
  'Bits, bytes, KiB, MB and all the rest.':
    'Bit, byte, KiB, MB, dan satuan lainnya.',
  'Hertz, kilohertz, megahertz and RPM.':
    'Hertz, kilohertz, megahertz, dan RPM.',
  'Watts, kilowatts, horsepower and BTU/hour.':
    'Watt, kilowatt, daya kuda, dan BTU/jam.',
  'Pascal, bar, PSI, atmosphere and mmHg.':
    'Pascal, bar, PSI, atmosfer, dan mmHg.',
  'Joules, calories, watt-hours and electronvolts.':
    'Joule, kalori, watt-jam, dan elektronvolt.',
  'Live exchange rates with an offline fallback table.':
    'Kurs terkini dengan tabel cadangan saat offline.',
  'Convert between hex, RGB and HSL with live preview.':
    'Konversi hex, RGB, dan HSL dengan pratinjau langsung.',
  'Build complementary, analogous and monochromatic palettes.':
    'Buat palet komplemen, analog, dan monokromatik.',
  'Check WCAG contrast ratios for foreground and background.':
    'Periksa rasio kontras WCAG antara teks dan latar.',
  'Scale images precisely, entirely in your browser.':
    'Ubah ukuran gambar dengan presisi, sepenuhnya di browser.',
  'Crop images visually and export the result.':
    'Potong gambar secara visual dan ekspor hasilnya.',
  'Convert PNG, JPG and WebP without uploading anything.':
    'Konversi PNG, JPG, dan WebP tanpa mengunggah apa pun.',
  'Reduce file size with adjustable quality and max dimensions.':
    'Perkecil ukuran berkas dengan kualitas dan dimensi maksimal yang bisa diatur.',
  'Encrypt text with AES-GCM using a password you choose.':
    'Enkripsi teks dengan AES-GCM memakai kata sandi pilihan Anda.',
  'Decrypt ONEV AES-GCM payloads with the matching password.':
    'Dekripsi payload AES-GCM ONEV dengan kata sandi yang sesuai.',
  'Encrypt JS, TS, Python and other source with a password or recovery key.':
    'Enkripsi kode JS, TS, Python, dan lain-lain dengan kata sandi atau kunci pemulihan.',
  'Restore encrypted source from an ONEV payload or runnable wrapper.':
    'Pulihkan kode terenkripsi dari payload ONEV atau wrapper yang bisa dijalankan.',
  'Try your own candidate list against an ONEV payload you own. Capped and local.':
    'Coba daftar kandidat Anda sendiri pada payload ONEV milik Anda. Terbatas dan lokal.',
  'A persistent, no-frills checklist for repeatable tasks.':
    'Daftar tugas sederhana yang tersimpan untuk pekerjaan berulang.',
  'Save links locally with tags and quick search.':
    'Simpan tautan secara lokal dengan tag dan pencarian cepat.',
  'Precision timer with laps, kept in your browser tab.':
    'Penghitung waktu presisi dengan putaran, tersimpan di tab browser.',
  'Create downloadable QR codes for text, links or Wi-Fi.':
    'Buat kode QR yang bisa diunduh untuk teks, tautan, atau Wi-Fi.',

  // Category descriptions
  'Passwords, numbers, gradients and sample data':
    'Kata sandi, angka, gradien, dan data contoh',
  'Validate, prettify and minify source code':
    'Validasi, rapikan, dan perkecil kode sumber',
  'Transform, encode and analyse text': 'Ubah, enkode, dan analisis teks',
  'Everyday maths without the friction': 'Aritmetika sehari-hari tanpa ribet',
  'Units, currencies and data sizes': 'Satuan, mata uang, dan ukuran data',
  'Convert, harmonise and check contrast': 'Konversi, padukan, dan cek kontras warna',
  'Resize, crop, convert and compress locally':
    'Ubah ukuran, potong, konversi, dan kompres secara lokal',
  'Encrypt and decrypt text locally': 'Enkripsi dan dekripsi teks secara lokal',
  'Small tools for everyday workflows': 'Alat kecil untuk alur kerja sehari-hari',

  // Descriptive UI copy
  '{count} focused utilities for code, text, color, images and everyday maths. No sign-up, no uploads — just tools that get out of your way.':
    '{count} utilitas fokus untuk kode, teks, warna, gambar, dan matematika sehari-hari. Tanpa daftar akun, tanpa unggahan — hanya alat yang tidak mengganggu.',
  'The ones people reach for most.': 'Alat yang paling sering dipakai.',
  'Browse the full {count}-tool library.': 'Jelajahi seluruh pustaka {count} alat.',
  'Instant, offline-first': 'Instan, mengutamakan offline',
  'Your data stays local': 'Data Anda tetap lokal',
  'ONEV — one workspace, every utility.': 'ONEV — satu ruang kerja, semua utilitas.',
  'Built for people who build things.': 'Dibuat untuk orang yang membuat sesuatu.',
  'Private by onev.':
    'Privasi by onev.',
  'Search across names, descriptions, categories and keywords.':
    'Cari berdasarkan nama, deskripsi, kategori, dan kata kunci.',
  'Type a tool name or keyword…': 'Ketik nama alat atau kata kunci…',
  'No tools found': 'Tidak ada alat ditemukan',
  'Try a broader term like “convert”, “text” or “color”.':
    'Coba istilah yang lebih luas seperti “convert”, “text”, atau “color”.',
  'Your pinned tools, saved locally in this browser.':
    'Alat yang Anda sematkan, tersimpan lokal di browser ini.',
  'Tap the star on any tool card to pin it here for quick access.':
    'Ketuk bintang pada kartu alat untuk menyematkannya di sini.',
  'The last tools you opened, stored locally.':
    'Alat terakhir yang Anda buka, tersimpan secara lokal.',
  'Tools you visit will show up here automatically.':
    'Alat yang Anda kunjungi akan muncul di sini otomatis.',
  "The page or tool you were looking for doesn't exist. There are plenty of others to explore.":
    'Halaman atau alat yang Anda cari tidak ada. Masih banyak lain yang bisa dijelajahi.',
  'Loading tool…': 'Memuat alat…',
  'Search {count} tools by name, category or keyword…':
    'Cari {count} alat berdasarkan nama, kategori, atau kata kunci…',
  'No tools matched “{query}”': 'Tidak ada alat yang cocok dengan “{query}”',
  'Press Enter to run a full search anyway.':
    'Tekan Enter untuk tetap menjalankan pencarian penuh.',
}
