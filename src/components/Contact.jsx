import { contact } from '../data/content';
import CopyEmail from './CopyEmail';

/* The ask. The email is the hero of the section; no color flood. */
export default function Contact() {
  return (
    <>
      <section className="sec contact" id="contact">
        <div className="wrap">
          <div className="reveal">
            <div className="contact-head">
              <span className="eyebrow">{contact.eyebrow}</span>
              <h2>
                {contact.heading} <em>{contact.headingEm}</em>
              </h2>
            </div>
            <p className="contact-blurb">{contact.blurb}</p>
            <div className="contact-mail">
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              <CopyEmail />
            </div>
            <ul className="contact-links">
              {contact.links
                .filter((l) => l.href)
                .map((l) => (
                  <li key={l.kind}>
                    <a
                      href={l.href}
                      {...(/^https?:/.test(l.href)
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {l.kind} <span>{l.value}</span>
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </section>
      <footer className="foot">
        <div className="wrap">
          <span>{contact.footerLeft}</span>
          <span>{contact.footerRight}</span>
        </div>
      </footer>
    </>
  );
}
