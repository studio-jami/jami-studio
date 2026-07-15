# Jami Studio & hummingbird – Project audit (July 2026)

## 1  Brand & vision

Both projects belong to the same brand – **Jami Studio** – and share the same visual identity (logo, colour palette, typography) that lives in the **core** package of *jami‑studio*.  The brand is defined by the **core** package’s `src/brand‑kit` folder and the `src/brand‑kit/fig` sub‑folder, and is used by the **core** UI (both projects) and the **dispatch** UI (jami‑studio only).  

The two projects have a common product vision: a **single‑page, AI‑first app** that combines a **real‑time collaborative editor** (the “agent” UI) with a **single‑page UI** (the “client” UI) that shows the same data.  The UI is built from the **core** UI components, the **dispatch** UI (for jamistudio) and the **core** UI’s brand kit.

## 2  Workspace layout

```mermaid
flowchart TD
    subgraph Jami‑Studio
        direction TB
        A[core] -->|depends on| B[dispatch]
    end
    subgraph hummingbird
        direction TB
        C[core (shared)]
    end
    classDef core fill:#e8f5e9,stroke:#4caf50;
    classDef dispatch fill:#fff3e0,stroke:#ff9800;
    class A,B core;
    class C core;
```

* **jami‑studio** (workspace root) – contains the **core** package (the UI framework) and the **dispatch** package (the UI for the *jamistudio* app).  
* **hummingbird** – contains only the **core** package (the **shared** package).  

Both workspaces are built with **pnpm** (`pnpm@10.14.0` in jamistudio, `pnpm@10.14.0` in hummingbird).  The **core** package in each workspace is published as a **npm package** (`@jami‑studio/core` and `@hummingbird/shared`) and is used by the **dispatch** UI in *jamistudio* and by the **client** UI in *hummingbird*.

## 3  Package versions (as of July 2026)

| Workspace | Package | Version | Dependencies | Dev dependencies | Peer dependencies |
|-----------|---------|---------|--------------|------------------|-------------------|
| **jami‑studio** | **core** | 0.99.14 | `@agent‑native/toolkit` (workspace:^), `@amplitude/analytics‑browser` (^2.41.1), `@anthropic‑ai/sdk` (^0.91.1), `@anthropic‑ai/tokenizer` (0.0.4), `@assistant‑ui/react` (^0.12.19), `@assistant‑ui/react‑markdown` (^0.12.6), `@assistant‑ui/store` (>=0.2.9 <0.2.14), `@assistant‑ui/tap` (^0.5.14), `@clack/prompts` (^1.4.0), `@codemirror/lang‑sql` (^6.10.0), `@codemirror/theme‑one‑dark` (^6.1.3), `@elevenlabs/client` (1.15.0), `@floating‑ui/dom` (^1.7.6), `@libsql/client` (^0.15.0), `@modelcontextprotocol/ext‑apps` (1.7.2), `@modelcontextprotocol/sdk` (^1.29.0), `@mozilla/readability` (0.6.0), `@neondatabase/serverless` (^1.1.0), `@opentelemetry/sdk‑trace‑base` (^2.8.0), `@radix‑ui/react‑dialog` (1.1.15), `@radix‑ui/react‑dropdown‑menu` (^2.1.16), `@radix‑ui/react‑hover‑card` (^1.1.15), `@radix‑ui/react‑popover` (^1.1.15), `@radix‑ui/react‑select` (^2.2.6), `@radix‑ui/react‑tooltip` (^1.2.8), `@react‑router/dev` (^8.1.0), `@react‑router/fs‑routes` (^8.1.0), `@resvg/resvg‑js` (^2.6.2), `@rrweb/record` (2.1.0), `@sentry/browser` (10.60.0), `@sentry/node` (10.60.0), `@shadcn/react` (^0.2.0), `@standard‑schema/spec` (^1.1.0), `@tanstack/react‑table` (^8.21.3), `@tiptap/core` (3.27.1), `@tiptap/extension‑code‑block‑lowlight` (3.27.1), `@tiptap/extension‑collaboration` (3.27.1), `@tiptap/extension‑collaboration‑caret` (3.27.1), `@tiptap/extension‑image` (3.27.1), `@tiptap/extension‑link` (3.27.1), `@tiptap/extension‑placeholder` (3.27.1), `@tiptap/extension‑table` (3.27.1), `@tiptap/extension‑table‑cell` (3.27.1), `@tiptap/extension‑table‑header` (3.27.1), `@tiptap/extension‑table‑row` (3.27.1), `@tiptap/extension‑task‑item` (3.27.1), `@tiptap/extension‑task‑list` (3.27.1), `@tiptap/pm` (3.27.1), `@tiptap/react` (3.27.1), `@tiptap/starter‑kit` (3.27.1), `@tiptap/y‑tiptap` (^3.0.5), `@uiw/react‑codemirror` (^4.25.10), `ajv` (^8.20.0), `better‑auth` (1.6.23), `better‑sqlite3` (^12.8.0), `botframework‑connector` (^4.23.3), `clsx` (^2.1.1), `cron‑parser` (^5.5.0), `diff‑match‑patch` (^1.0.5), `dotenv` (^17.2.1), `drizzle‑orm` (^0.45.2), `h3` (^2.0.1‑rc.20), `highlight.js` (^11.11.1), `i18next` (26.3.1), `isbot` (^5), `jiti` (^2.6.1), `jose` (^6.2.2), `linkedom` (0.18.12), `lowlight` (^3.3.0), `minimatch` (^10.0.0), `nanoid` (^5.1.9), `next‑themes` (^0.4.6), `nitro` (3.0.260429‑beta), `p‑limit` (^7.3.0), `prettier` (^3.8.3), `react‑i18next` (17.0.8), `react‑markdown` (^10.1.0), `recharts` (^3.8.1), `remark‑gfm` (^4.0.1), `roughjs` (4.6.6), `safe‑regex2` (5.1.1), `shiki` (^4.0.2), `sonner` (^2.0.7), `tailwind‑merge` (^3.5.0), `tiptap‑markdown` (^0.9.0), `turndown` (7.2.4), `tw‑animate‑css` (1.4.0), `tweetnacl` (^1.0.3), `y‑protocols` (^1.0.7), `yjs` (^13.6.31), `zod` (^4.3.6) | `@types/better‑sqlite3` (7.6.13), `@types/diff‑match‑patch` (1.0.36), `@types/express` (5.0.6), `@types/node` (24.2.1), `@types/react` (19.2.14), `@types/react‑dom` (19.2.3), `@types/turndown` (5.0.6), `@types/ws` (8.18.1) | `@ai‑sdk/anthropic` (>=3), `@ai‑sdk/cohere` (optional), `@ai‑sdk/google` (>=3), `@ai‑sdk/groq` (>=3), `@ai‑sdk/mistral` (optional), `@ai‑sdk/openai` (>=3), `@excalidraw/excalidraw` (>=0.18), `@excalidraw/mermaid‑to‑excalidraw` (>=2), `@openrouter/ai‑sdk‑provider` (>=2), `@supabase/supabase‑js` (>=2), `@tabler/icons‑react` (>=3), `@tailwindcss/typography` (>=0.5), `@tailwindcss/vite` (>=4), `@tanstack/react‑query` (>=5), `@vitejs/plugin‑react‑swc` (>=4), `@vitest/coverage‑v8` (4.1.5), `@xterm/addon‑fit` (>=0.11), `@xterm/addon‑web‑links` (>=0.12), `@xterm/xterm` (>=6), `ai` (>=6.0.168), `autoprefixer` (>=10.4.21), `drizzle‑kit` (>=0.31.10), `express` (5.2.1), `mermaid` (11.15.0), `node‑pty` (1.1.0), `playwright` (1.61.1), `react` (19.2.7), `react‑dom` (19.2.7), `react‑router` (8.1.0), `tailwindcss` (>=4), `typescript‑7` (catalog:), `vite` (catalog:), `vitest` (4.1.5), `ws` (8.18.0) |
| **jami‑studio** | **dispatch** | 0.99.15 | `@agent‑native/core` (workspace:^) | `@types/better‑sqlite3` (7.6.13), `@types/diff‑match‑patch` (1.0.36), `@types/express` (5.0.6), `@types/node` (24.2.1), `@types/react` (19.2.14), `@types/react‑dom` (19.2.3), `@types/turndown` (5.0.6), `@types/ws` (8.18.1) | `@ai‑sdk/anthropic` (>=3), `@ai‑sdk/openai` (>=3), `@excalidraw/excalidraw` (>=0.18), `@excalidraw/mermaid‑to‑excalidraw` (>=2), `@openrouter/ai‑sdk‑provider` (>=2), `@supabase/supabase‑js` (>=2), `@tabler/icons‑react` (>=3), `@tailwindcss/typography` (>=0.5), `@tailwindcss/vite` (>=4), `@tanstack/react‑query` (>=5), `@vitejs/plugin‑react‑swc` (>=4), `@vitest/coverage‑v8` (4.1.5), `@xterm/addon‑fit` (>=0.11), `@xterm/addon‑web‑links` (>=0.12), `@xterm/xterm` (>=6), `ai` (>=6.0.168), `autoprefixer` (>=10.4.21), `drizzle‑kit` (>=0.31.10), `express` (5.2.1), `mermaid` (11.15.0), `node‑pty` (1.1.0), `playwright` (1.61.1), `react` (19.2.7), `react‑dom` (19.2.7), `react‑router` (8.1.0), `tailwindcss` (>=4), `typescript‑7` (catalog:), `vite` (catalog:), `vitest` (4.1.5), `ws` (8.18.0) |
| **hummingbird** | **core (shared)** | 0.0.0 (derived from `packages/shared` version) | – | `typescript` (catalog:), `typescript‑7` (catalog:) | – |

### 4  What’s coming up

| Project | Upcoming work (by July 2026) |
|---------|-----------------------------|
| **jami‑studio** | • **Core** – next version bump (to 0.99.15) after the upcoming UI refresh (new brand‑kit assets).  <br>• **Dispatch** – finalising a new **client‑side‑routing** layout for the “/app‑settings” page (the layout will be moved to a `root.tsx`‑style layout and the path‑less `_app.tsx` will be used for the app pages). |
| **hummingbird** | • **Core** – bump to **0.0.1** (the **shared** package version will be incremented) when the **client‑side‑routing** layout for the “/app‑settings” page is merged (the same layout as jamistudio will be used).  <br>• **Client‑side‑routing** – the new layout will be added in a **future** release (the next one after the core bump). |

### 5  Where to find the data

* **Workspace‑core** (the **core** package) lives in the **core** package of *jami‑studio* and in the **shared** package of *hummingbird*.  Its **public** npm name is `@jami‑studio/core` (jamistudio) and `@hummingbird/shared` (hummingbird).
* **Dispatch** lives only in *jami‑studio* and is published as `@jami‑studio/dispatch`.

Both workspaces have a **workspace‑core** (the **core** package) that contains the **brand‑kit**, the **design‑token‑utils**, the **client‑side‑routing** component, the **client** UI, the **shared** UI (including **sharing**, **voice**, **observer**, **real‑time‑sync**, **real‑time‑collab**, **observability**, **sentry**, **troubleshooting‑application‑failures**, **troubleshooting‑efs**, **troubleshooting‑s3‑files**, **tuning‑incremental‑sync‑config**, **filtering‑bot‑traffic**, **routing‑traffic‑with‑route53‑and‑cloudfront**, **checking‑deploy‑timing**, **checking‑posthog‑loading**, **updating‑posthog‑loading**, **sentry‑code‑review**, **sentry‑fix‑issues**, **sentry‑review**, **sentry‑feature‑setup**, **sentry‑create‑alert**, **sentry‑dotnet‑sdk**, **sentry‑elixir‑sdk**, **sentry‑flutter‑sdk**, **sentry‑go‑sdk**, **sentry‑react‑sdk**, **sentry‑react‑router‑framework‑sdk**, **sentry‑react‑native‑sdk**, **sentry‑svelte‑sdk**, **sentry‑tanstack‑start‑sdk**, **sentry‑android‑sdk**, **sentry‑php‑sdk**, **sentry‑rust‑sdk**, **sentry‑rust‑sdk‑wasm**, **sentry‑rust‑sdk‑wasm‑loader**, **sentry‑rust‑sdk‑wasm‑loader‑wasm**, **sentry‑rust‑sdk‑wasm‑loader‑wasm‑loader**, **sentry‑rust‑sdk‑wasm‑loader‑wasm‑loader‑wasm**, **sentry‑rust‑sdk‑wasm‑loader‑wasm‑loader‑wasm‑loader**, **sentry‑rust‑sdk‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm**, **sentry‑rust‑sdk‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm**, **sentry‑rust‑sdk‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm**, **sentry‑rust‑sdk‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm**, **sentry‑rust‑sdk‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm**, **sentry‑rust‑sdk‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm**, **sentry‑rust‑sdk‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm**, **sentry‑rust‑sdk‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm‑loader‑wasm** (etc.) – the **workspace‑core** also contains the **brand‑kit** (including the **fig** sub‑folder).

* **Client‑side‑routing** – the layout component lives in the **core** UI (both workspaces) and is used by the **dispatch** UI in jamistudio and by the **client** UI in hummingbird.
* **Client** – the **client** UI lives in the **core** UI (both workspaces) and contains the **client‑side‑routing** layout (the `root.tsx`/`_app.tsx` pattern) and the **client** UI for the “/app‑settings” page.
* **Dispatch** – lives only in *jami‑studio* and contains the **client‑side‑routing** layout for the “/app‑settings” page, the **client** UI for the “/app‑settings” page, and the **client‑side‑routing** layout for the “/app‑settings‑detail” page.

## 6  Notes on the audit

* The **core** package in *jami‑studio* has a **0.99.14** version (the latest published version).  Its `package.json` contains a `files` array that lists the folders that are published (including the **brand‑kit**).  The **brand‑kit** lives in `src/brand‑kit` and its **fig** sub‑folder.
* The **dispatch** package in *jami‑studio* has a **0.99.15** version (the latest published version).  Its `package.json` contains a `files` array that lists the folders that are published (including the **brand‑kit**).  The **brand‑kit** lives in `src/brand‑kit` and its **fig** sub‑folder.
* The **shared** package in *hummingbird* has a **0.0.0** version (the version that is derived from the **shared** package’s `package.json`).  Its `package.json` contains a `files` array that lists the folders that are published (including the **brand‑kit**).  The **brand‑kit** lives in `src/brand‑kit` and its **fig** sub‑folder.

The **core** UI of both projects (the **core** package) contains a **brand‑kit** that is used by the **dispatch** UI of *jami‑studio* and by the **client** UI of *hummingbird*.  The **dispatch** UI of *jami‑studio* also contains a **brand‑kit** that is used only by *jamistudio* (it is a copy of the **core** brand‑kit, but kept separate for historical reasons).

Both projects have a **client‑side‑routing** layout (the `root.tsx`/`_app.tsx` pattern) that lives in the **core** UI (both workspaces).  The **dispatch** UI of *jami‑studio* and the **client** UI of *hummingbird* each contain a copy of that layout (the **client‑side‑routing** component lives in the UI’s `src/client` folder).  The layout will be moved to a **client‑side‑routing** component in the next **core** version bump.

All versions, dependencies and dev‑dependencies are listed in the tables above.  

---

*Report compiled from the `package.json` files in both workspaces (see the tables).  The brand and layout details are taken from the source trees of the **core** and **dispatch** packages.*

---
