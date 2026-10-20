import { renderToString } from 'react-dom/server';
import App from './App.jsx';

/* Used only by scripts/prerender.mjs at build time: the page as an HTML string. */
export function render() {
  return renderToString(<App />);
}

// The prerender step writes the page title and description from this, so they live in one place.
export { meta } from './data/content';
