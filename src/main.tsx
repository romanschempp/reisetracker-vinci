import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter-tight';
import './styles/index.css';
import { App } from './app/App';
import { requestPersistentStorage } from './db/schema';
import { applyTheme, watchSystemTheme } from './lib/theme';

applyTheme();
watchSystemTheme();
void requestPersistentStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
