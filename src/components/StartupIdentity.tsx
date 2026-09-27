import { Loader2 } from 'lucide-react';
import cradlehubIcon from '../assets/brand/cradlehub-icon.png';

export function StartupIdentity() {
  return (
    <main
      className="login-container startup-identity"
      data-testid="startup-identity"
    >
      <div className="startup-identity-content">
        <img src={cradlehubIcon} alt="" className="startup-brand-icon" />
        <h1 className="login-title">CradleHub Desktop</h1>
        <p role="status" className="startup-status">
          <Loader2 size={16} aria-hidden="true" className="startup-spinner" />
          Checking secure access…
        </p>
      </div>
    </main>
  );
}
