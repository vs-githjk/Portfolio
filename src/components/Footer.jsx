import { contact } from '../data/content';

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <span>{contact.footerLeft}</span>
        <span>{contact.footerRight}</span>
        <a className="foot-top" href="#top">
          {contact.footerTop} <span aria-hidden="true">↑</span>
        </a>
      </div>
    </footer>
  );
}
