import { contact } from '../data/content';

export default function Contact() {
  return (
    <>
      <section className="contact" id="contact">
        <div className="wrap reveal">
          <div className="eyebrow">{contact.eyebrow}</div>
          <h2>{contact.heading}</h2>
          <p className="contact-blurb">{contact.blurb}</p>

          <a className="big-mail" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>

          <div className="links">
            {contact.links
              .filter((l) => l.href)
              .map((l) => (
                <a
                  href={l.href}
                  key={l.kind}
                  target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                >
                  <span className="l-k">{l.kind}</span>
                  <span className="l-v">{l.value} →</span>
                </a>
              ))}
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap foot-in">
          <span>{contact.footerLeft}</span>
          <span>{contact.footerRight}</span>
        </div>
      </footer>
    </>
  );
}
