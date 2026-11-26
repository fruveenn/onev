# ONEV

**One workspace. Every utility.** ONEV is a dark, fast developer-tools dashboard with 60 focused tools for generators, formatting, text, maths, unit/currency conversion, color, images, local encryption and small everyday workflows. Everything runs in the browser — no accounts, no uploads, no backend.

---

## Contents

- [Quick start](#quick-start)
- [Feature overview](#feature-overview)
- [Design system](#design-system)
- [Project structure](#project-structure)
- [Architecture: how the tool registry works](#architecture-how-the-tool-registry-works)
- [Adding a new tool](#adding-a-new-tool)
- [Data, privacy and external APIs](#data-privacy-and-external-apis)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Quick start

Requirements: Node.js 18+ (tested on Node 26) and npm.

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

Other scripts:

```bash
npm run build      # type-check with tsc, then production build into dist/
npm run preview    # serve the production build locally
npm test           # run the Vitest unit suite once
npm run test:watch # watch mode
```

---

## Feature overview

| Category | Tools |
| --- | --- |
| Generators | Password, random numbers, CSS gradients, emoji picker, UUID, Lorem ipsum |
| Formatters | JSON formatter / validator / minifier, CSS / JavaScript / HTML formatter |
| Text | Slug encode/decode, binary, Base64, URL encoding, case converter, find & replace, word counter, Markdown preview, repeater, reverser, line sorter |
| Calculators | Basic expression calculator, percentage, age, split bill, average/statistics, tip |
| Converters | Length, weight, temperature, area, volume, speed, time, data, frequency, power, pressure, energy, currency |
| Color | Hex/RGB/HSL converter, palette generator, WCAG contrast checker |
| Image | Resizer, cropper, PNG/JPG/WebP converter, compressor — all via Canvas |
| Security | Text/code encryptor & decryptor (AES-GCM), recovery key, capped password recovery |
| Utilities | Checklist, bookmark manager, stopwatch with laps, QR code generator |

Dashboard features include fuzzy-ish keyword search, a `⌘K` / `Ctrl+K` command palette with keyboard navigation, category browsing, favorites and recently-used tools (persisted locally), related-tool suggestions, and responsive layouts from mobile to wide desktop.

An **ID / EN** switch in the topbar toggles descriptive copy (tool, category and page descriptions, hints and empty states). Indonesian is the default; tool names, category names and titles stay in English. The choice is saved in `onev:language`. Add or update translations in `src/store/language.tsx`.

---

## Design system

The visual language is a precise, minimalist instrument panel for developers:

- **Page background:** `#0B0C0E`
- **Card background:** `#15171A`
- **Muted text:** `#9DA29E`; primary text `#EDEFEA`
- **Accent:** signal lime `#C6F36B` → soft sage `#9AD9A0`
- **Typography:** Inter for UI, JetBrains Mono for code and data
- **Shape:** 12px cards (`rounded-xl`), 8px controls (`rounded-lg`), pills only for chips
- **Depth:** thin `#292D30` borders, soft shadows, and restrained lime glow only on active or primary elements

Tokens live in `tailwind.config.js`; reusable classes (`.card`, `.input`, `.btn-primary`, `.label`, `.chip`, `.markdown-body`, etc.) live in `src/index.css`.

---

## Project structure

```text
src/
├── components/
│   ├── layout/        # app shell, sidebar, topbar, command palette
│   ├── tools/         # one folder per category; components are lazy-loaded
│   └── ui/            # shared buttons, fields, panels, cards, copy helpers
├── hooks/             # useLocalStorage
├── lib/               # pure, framework-free logic (also unit-tested)
├── pages/             # dashboard, category/search/favorites/recent, tool page, 404
├── registry/          # categories + the central tool registry
└── store/             # favorites/recents and toast context providers
```

All business logic is isolated in `src/lib/*` as pure functions (converters, calculators, text transforms, color maths, generators, currency). UI components are thin views over that layer, which keeps tools small and testable.

---

## Architecture: how the tool registry works

`src/registry/tools.tsx` exports a single `TOOLS` array of `ToolMeta` objects. The array is the source of truth for navigation, search, featured tools, counts, related tools and routing.

```ts
export interface ToolMeta {
  id: string                 // URL slug: /tools/<id>
  name: string               // Card and page heading
  description: string        // Card and page subtitle
  category: CategoryId       // Grouping + sidebar navigation
  icon: LucideIcon           // Card / breadcrumb icon
  keywords: string[]         // Extra search terms
  component: ComponentType   // Lazy-loaded tool UI
  props?: Record<string, unknown> // Optional configuration passed to the UI
  featured?: boolean         // Show on the dashboard hero grid
}
```

Routing is defined in `src/App.tsx`:

- `/` — dashboard
- `/tools/:id` — resolves `getTool(id)` and renders `tool.component` inside a `Suspense` boundary
- `/category/:categoryId` — category listing
- `/search?q=…`, `/favorites`, `/recent` — filtered collections
- `*` — not-found page

Components are loaded with `React.lazy`, so a visitor only downloads the code for tools they open. Prettier and its language plugins are loaded lazily *within* the formatter tool as well.

Search (`searchTools`) matches words across name, description, category and keywords, then ranks exact/prefix name matches first. The command palette reuses exactly the same function.

---

## Adding a new tool

1. **Add the logic (optional).** Put reusable, pure functions in `src/lib/`. Add a matching `*.test.ts` file for the important cases.

2. **Create the UI.** Add a component under `src/components/tools/<category>/`. Keep it self-contained; use the shared `Panel`, `Field`, `ResultBox`, `Segmented`, `Switch`, `StatTile` and `CopyButton` components for a consistent look.

   ```tsx
   export function ReverseString() {
     const [value, setValue] = useState('')
     return (
       <Panel title="Input">
         <textarea value={value} onChange={(e) => setValue(e.target.value)} className="input" />
       </Panel>
     )
   }
   ```

3. **Register it.** In `src/registry/tools.tsx`, add a lazy loader near the other tool loaders and append an entry to `TOOLS`:

   ```tsx
   const myTools = () => import('../components/tools/text/MyTools')

   {
     id: 'reverse-string',
     name: 'Reverse String',
     description: 'Flip a string character by character.',
     category: 'text',
     icon: FlipHorizontal,
     keywords: ['mirror', 'flip'],
     component: lazy(() => myTools().then((m) => ({ default: m.ReverseString }))),
   }
   ```

   No other changes are needed: the dashboard, command palette, sidebar counts, search, category pages and tool routing all read from `TOOLS`.

4. **Verify.** Run `npm test` and `npm run build`, then open the tool with `npm run dev`.

For tools that need configuration (like the 12 unit converters sharing one component), pass `props` in the registry entry:

```tsx
component: lazy(() => unitTools().then((m) => ({ default: m.UnitConverter }))),
props: { groupId: 'length' },
```

---

## Data, privacy and external APIs

- Favorites, recents, checklists, bookmarks and recently copied emojis are stored in `localStorage` under `onev:*` keys. They never leave the device.
- Image tools use the Canvas API and object URLs; image bytes are never uploaded.
- Password and UUID generation use `crypto.getRandomValues` / `crypto.randomUUID`.
- Markdown output is sanitized with DOMPurify before rendering.
- The expression calculator uses a hand-written shunting-yard parser — no `eval()` or `new Function()`.
- Currency rates come from `open.er-api.com`, with `frankfurter.app` as a second provider. If both are unreachable, ONEV uses a clearly-labelled bundled snapshot (`src/lib/currency.ts`) and displays an "Offline snapshot" notice. Rates are cached in memory for 30 minutes per base currency.

---

## Testing

Tests cover the pure logic layer and run with Vitest:

```bash
npm test
```

Current suite: 46 tests across text transforms, unit conversions (including round-trip checks for every unit pair), arithmetic parsing, percentages, age, bill splitting, statistics, colors/contrast, generators, currency conversion, AES-GCM crypto/recovery, code wrappers and language translations.

---

## Deployment

### Vercel

1. Push the project to a Git repository.
2. Import it in Vercel; framework preset **Vite** is detected automatically.
3. Build command: `npm run build`; output directory: `dist` — both are pinned in `vercel.json`.
4. Deploy. `vercel.json` already contains the SPA rewrite to `/index.html`, so deep links such as `/tools/password-generator` work on refresh.

Without a Git repository you can deploy straight from this folder with the Vercel CLI:

```bash
npx vercel login
npx vercel --prod
```

The CLI will ask you to create/link a project once; subsequent deploys are a single `npx vercel --prod`.

### Other static hosts

Build with `npm run build` and publish `dist/`. Configure a catch-all rewrite to `index.html` (SPA fallback). For Netlify, add `public/_redirects` with `/* /index.html 200`.

---

## License

MIT. Built as a demonstration of a clean, maintainable, locally-first utility dashboard.
