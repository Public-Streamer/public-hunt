import React, { useEffect } from 'react';

const Terms: React.FC = () => {
  useEffect(() => {
    const title = 'Terms of Service - Public Streamer';
    const description = 'Read Public Streamer\'s Terms of Service for media streaming, content, and user responsibilities.';
    document.title = title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    setMeta('description', description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/terms`);

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Terms of Service',
      description,
      url: `${window.location.origin}/terms`
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <div>
      <header className="sr-only">
        <h1>Terms of Service</h1>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-10">
        <article className="prose prose-neutral max-w-none">
          <h1>Terms of Service</h1>
          <p>
            These Terms of Service outline the rules and guidelines for using Public Streamer. This public version exists for reference; the binding version is the one you electronically sign during account creation.
          </p>
          <section>
            <h2>Use of the Platform</h2>
            <p>
              You agree to comply with all applicable laws and our community standards when streaming or uploading media.
            </p>
          </section>
          <section>
            <h2>Content and Ownership</h2>
            <p>
              You are responsible for the content you publish and must have the rights to distribute it.
            </p>
          </section>
          <section>
            <h2>Payments</h2>
            <p>
              Events may be free or paid. Fees and revenue share details apply as communicated within the app.
            </p>
          </section>
          <section>
            <h2>Liability</h2>
            <p>
              Public Streamer is not liable for user-generated content or third-party claims arising from your use of the platform.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default Terms;
