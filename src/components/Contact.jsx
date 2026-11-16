import { useRef, useState } from 'react';
import { contact } from '../data/content';
import { EV } from '../kit/contract';
import CopyEmail from './CopyEmail';
import PlaceName from './PlaceName';

const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(contact.mail.subject)}&body=${encodeURIComponent(contact.mail.body)}`;

/* The ask. The email is the largest thing in the section, set on the horizon the
   world draws under it; the link opens a draft with a subject and a first line
   already in it. Taking the one action the page exists for (copying the address
   or opening the draft) breaks first light: the section is marked data-dawn, a
   line of light runs under the address, and a `world:dawn` event tells the scene
   to bring the sun over the limb. It happens once, and it is the one success
   moment on the page. The email row is the scene's "contact" anchor. */
export default function Contact() {
  const [dawn, setDawn] = useState(false);
  const fired = useRef(false);
  const breakDawn = () => {
    if (fired.current) return;
    fired.current = true;
    setDawn(true);
    window.dispatchEvent(new CustomEvent(EV.dawn, { detail: {} }));
    window.dispatchEvent(new CustomEvent(EV.sound, { detail: { cue: 'copy' } }));
  };

  return (
    <section className="sec contact" id="contact" data-realm="earth" data-dawn={dawn ? 'on' : undefined}>
      <div className="wrap">
        <div className="c-who reveal">
          <img
            className="c-portrait"
            src={contact.portrait.src}
            srcSet={`${contact.portrait.src} 1x, ${contact.portrait.src2x} 2x`}
            alt={contact.portrait.alt}
            width="120"
            height="120"
            loading="lazy"
            decoding="async"
          />
          <div>
            <span className="eyebrow">
              {contact.eyebrow}
              <PlaceName section="contact" />
            </span>
            <p className="c-avail">
              <i aria-hidden="true" />
              {contact.availability}
            </p>
          </div>
        </div>
        <h2 className="reveal">
          {contact.heading} <em>{contact.headingEm}</em>
        </h2>
        <p className="blurb reveal" data-delay="1">
          {contact.blurb}
        </p>
        <div className="email-row reveal" data-delay="2" data-world-anchor="contact">
          <a className="email" href={mailto} onClick={breakDawn}>
            {contact.email}
          </a>
          <CopyEmail onDone={breakDawn} />
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
