import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Order matters: tokens define the variables everything else consumes.
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
