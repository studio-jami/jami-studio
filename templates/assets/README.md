# Assets

An open-source, agent-native digital asset manager (DAM) and brand-image/video
generation workspace — a self-hostable alternative to tools like Brandfolder and
Air, with generation built in.

**Live app: [assets.jami.studio](https://assets.jami.studio)**

Organize uploaded and generated media into libraries and folders, then route
image and video generation through the agent chat so every asset can be reviewed,
refined, and kept on-brand. Every generated asset writes an audit run with the
prompt, model, references, and lineage.

## Features

- Brand-consistent image and video generation through the agent.
- Libraries, folders, and brand kits for organizing uploads and generated results.
- Generation presets that carry a brand style brief, prompt template, and logo policy.
- Pixel-perfect canonical logo compositing onto generated images.
- Reusable across apps: pick or generate assets from other apps over A2A and MCP.
- Full audit log of every generation run, exportable to CSV.

## Develop locally

Scaffold your own copy and run it:

```bash
npx @agent-native/core@latest create my-assets --standalone --template assets
cd my-assets
pnpm install
pnpm dev
```

Full docs: [jami.studio/docs/template-assets](https://jami.studio/docs/template-assets).
