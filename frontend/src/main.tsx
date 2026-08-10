import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { startFirebaseAuthListener } from './features/auth/authStore';
import { installWebErrorReporting } from './shared/firebase/analytics';
import './index.css';

startFirebaseAuthListener();
installWebErrorReporting();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
