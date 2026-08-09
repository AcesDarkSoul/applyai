import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { startFirebaseAuthListener } from './features/auth/authStore';
import './index.css';

startFirebaseAuthListener();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
