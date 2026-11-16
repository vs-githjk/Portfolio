import { contact } from '../data/content';

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

/* The foot of the page, and its colophon: how the site was made, what it is set
   in, and what it measured (only when content.js holds numbers measured on the
   production build; otherwise that sentence is left out). */
export default function Footer() {
  const c = contact.colophon;
  return (
    <footer className="foot" data-realm="earth">
      <div className="wrap">
        <div className="colophon">
          <h2 className="eyebrow">{c.label}</h2>
          <p>
            {c.made} {c.type} {c.lighthouse ? fill(c.measured, c.lighthouse) : ''}
          </p>
          <a href={c.llms.href}>{c.llms.label}</a>
        </div>
        <div className="foot-line">
          <span>{contact.footerLeft}</span>
          <span>{contact.footerRight}</span>
          <a className="foot-top" href="#top">
            {contact.footerTop} <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
