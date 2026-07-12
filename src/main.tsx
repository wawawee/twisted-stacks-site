import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import VRSuperPowers from './VRSuperPowers.tsx';
import SuparaysRoom from './suparays/SuparaysRoom.tsx';
import {LanguageProvider} from './i18n/context';
import './index.css';

function Root() {
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path === "/vr-superpowers") {
    return (
      <LanguageProvider>
        <VRSuperPowers />
      </LanguageProvider>
    );
  }
  if (path === "/suparays" || path.startsWith("/suparays/")) {
    return <SuparaysRoom />;
  }
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
