import { site } from '../data/site'
import { InstagramIcon } from './Icons'
import { Logo } from './Logo'
import './Footer.css'

const links = [
  { href: '#topo', label: 'A Mesa' },
  { href: '#eventos', label: 'Eventos' },
  { href: '#ranking', label: 'Ranking' },
  { href: '#reservar', label: 'Reservar' },
]

export const Footer = () => (
  <footer className="footer">
    <hr className="divider" />
    <div className="footer__inner">
      <div className="footer__brand">
        <Logo className="footer__logo" />
        <p>Home game. Poker. Texas Hold’em.</p>
      </div>

      <nav aria-label="Rodapé" className="footer__nav">
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <a className="footer__social" href={site.instagramUrl} target="_blank" rel="noreferrer">
        <InstagramIcon />
        <span>@{site.instagramHandle}</span>
      </a>
    </div>
    <div className="footer__legal">
      <p>
        Proibido para menores de 18 anos. Jogue com responsabilidade e beba com moderação. © {new Date().getFullYear()}{' '}
        {site.name}.
      </p>
      <p className="footer__credit">
        Produzido por <strong>LAX</strong>
      </p>
    </div>
  </footer>
)
