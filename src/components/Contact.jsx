import { contact } from '../data/content';
import CopyEmail from './CopyEmail';

/* The ask, and a second pedestal: beams rise from the ground behind the email
   (CSS only, no canvas). The email is the largest thing in the section. */
export default function Contact() {
  return (
    <section className="sec contact" id="contact">
      <div className="rise" aria-hidden="true" />
      <div className="wrap">
        <span className="eyebrow reveal">{contact.eyebrow}</span>
        <h2 className="reveal">
          {contact.heading} <em>{contact.headingEm}</em>
        </h2>
        <p className="blurb reveal" data-delay="1">
          {contact.blurb}
        </p>
        <div className="email-row reveal" data-delay="2">
          <a className="email" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          <CopyEmail />
        </div>
        <ul className="c-links reveal" data-delay="3">
          {contact.links
            .filter((l) => l.href)
            .map((l) => (
              <li key={l.kind}>
                <a
                  href={l.href}
                  {...(/^https?:/.test(l.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {l.kind} <b>{l.value}</b>
                </a>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}
