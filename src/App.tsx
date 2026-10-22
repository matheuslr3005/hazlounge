import { Footer } from './components/Footer'
import { Intro } from './components/Intro'
import { Nav } from './components/Nav'
import { Events } from './sections/Events'
import { Hero } from './sections/Hero'
import { Ranking } from './sections/Ranking'
import { Reserve } from './sections/Reserve'

export const App = () => (
  <>
    <Intro />
    <Nav />
    <main>
      <Hero />
      <Events />
      <Ranking />
      <Reserve />
    </main>
    <Footer />
  </>
)
