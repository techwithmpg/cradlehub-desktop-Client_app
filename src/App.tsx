import { LockKeyhole } from 'lucide-react';
export function App() {
  return (
    <main className="initialization" aria-labelledby="app-title">
      <div className="identity">
        CradleHub <span>Desktop</span>
      </div>
      <section className="initialization-panel">
        <LockKeyhole aria-hidden="true" size={24} strokeWidth={1.5} />
        <p className="eyebrow">Application initialized</p>
        <h1 id="app-title">CradleHub Desktop</h1>
        <p className="description">
          CRM is unavailable until authentication is introduced in a later
          authorized stage.
        </p>
        <dl>
          <div>
            <dt>Authentication</dt>
            <dd>Not authenticated</dd>
          </div>
          <div>
            <dt>Connection</dt>
            <dd>Not established</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
