import { Nav } from '@/components/nav'
import { Hero } from '@/components/sections/hero'
import { Parity } from '@/components/sections/parity'
import { JamiVoice } from '@/components/sections/jami-voice'
import { Registry } from '@/components/sections/registry'
import { Orchestration } from '@/components/sections/orchestration'
import { Stack } from '@/components/sections/stack'
import { Ecosystem } from '@/components/sections/ecosystem'
import { Footer } from '@/components/footer'

// ─── Page ────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Stack />
        <JamiVoice />
        <Registry />
        <Orchestration />
        <Parity />
        <Ecosystem />
      </main>
      <Footer />
    </>
  )
}
