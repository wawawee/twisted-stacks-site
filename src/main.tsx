import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import VRSuperPowers from './VRSuperPowers.tsx';
import './index.css';

function Root() {
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path === "/vr-superpowers") {
    return <VRSuperPowers />;
  }
  return <App />;
}

createRoot(document.getElementById('root')!).render(<Root />);
