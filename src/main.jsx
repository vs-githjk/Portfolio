import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

// Order matters: tokens define the variables everything else consumes.
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/v3-shell.css';
import './styles/v3-world.css';
import './styles/v3-sections.css';
import './styles/v4-opening.css';

import App from './App.jsx';

/* The build prerenders the page into index.html (scripts/prerender.mjs), so the
   first paint needs no JavaScript. When that markup is there, hydrate it;
   in `npm run dev` the root is empty and the app simply mounts. */
const root = document.getElementById('root');
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
