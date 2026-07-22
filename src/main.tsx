import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import VRSuperPowers from './VRSuperPowers.tsx';
import SuparaysRoom from './suparays/SuparaysRoom.tsx';
import AteRoom from './ate/AteRoom.tsx';
import SpaceRoom from './space/SpaceRoom.tsx';
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
  if (path === "/ate" || path.startsWith("/ate/")) {
    return <AteRoom />;
  }
  if (path === "/space" || path.startsWith("/space/")) {
    return <SpaceRoom />;
  }
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
