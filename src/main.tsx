// Browser entry point: loads the styles and mounts the app into index.html's #root.

import { StrictMode } from 'react' // dev-time checks
import { createRoot } from 'react-dom/client' // React 19 mount
import { App } from './app/App.tsx' // the shell
import './styles/index.css' // Tailwind and tokens

const rootElement = document.getElementById('root') // the mount point
if (!rootElement) throw new Error('index.html has no #root element') // fail loudly, not a blank page

// Render the app.
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
