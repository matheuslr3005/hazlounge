import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/global.css'

const render = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

// The 3D textures draw text on canvas, so the brand fonts have to be ready first (but never block for long).
const fonts = Promise.all([document.fonts.load("1em 'Instrument Serif'"), document.fonts.load('600 1em Inter')])
Promise.race([fonts, new Promise((resolve) => setTimeout(resolve, 1500))]).finally(render)
