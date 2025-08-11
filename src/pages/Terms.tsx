import React, { useEffect } from 'react';
import LegalAgreementBody from '@/components/legal/LegalAgreementBody';

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
      <main className="max-w-4xl mx-auto px-4 py-10">
        <article className="prose prose-neutral max-w-none">
          <h1>Terms of Service</h1>
          <LegalAgreementBody size="md" />
        </article>
      </main>
    </div>
  );
};

export default Terms;
