import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { FeedbackPage } from '../pages/FeedbackPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FeedbackPage />
  </StrictMode>
);
