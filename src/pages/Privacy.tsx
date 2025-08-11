import React, { useEffect } from 'react';

const Privacy: React.FC = () => {
  useEffect(() => {
    const title = 'Privacy Policy - Public Streamer';
    const description = 'Learn how Public Streamer collects, uses, and protects your data while streaming and interacting on the platform.';
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
    canonical.setAttribute('href', `${window.location.origin}/privacy`);

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy',
      description,
      url: `${window.location.origin}/privacy`
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
          <h1>Privacy Policy</h1>
          <p>
            This public Privacy Policy explains how we handle your information. The version you accept during signup remains the binding version.
          </p>
          <section>
            <h2>Information We Collect</h2>
            <p>
              We collect account details you provide and usage data to improve streaming experiences.
            </p>
          </section>
          <section>
            <h2>How We Use Information</h2>
            <p>
              We use your information to operate the platform, process payments, enhance safety, and provide support.
            </p>
          </section>
          <section>
            <h2>Payment Processing and Fraud Prevention (Stripe)</h2>
            <p>
              We use Stripe to process payments. Stripe may collect and process your payment information; Public Streamer does not store full card details. We share only the minimum necessary data (e.g., email, name, order info) to complete transactions and prevent fraud. See Stripe’s Privacy Policy for details.
            </p>
          </section>
          <section>
            <h2>Your Choices</h2>
            <p>
              You can update or delete certain information from your profile and adjust privacy settings.
            </p>
          </section>
          <section>
            <h2>Safety, Risk, and Enforcement</h2>
            <p>
              We take steps to protect users and comply with payment and legal requirements. This may include reviewing content for prohibited monetization categories, restricting monetization, pausing payouts, or sharing limited information with our payment processor strictly for fraud, risk, or compliance purposes as outlined in this Privacy Policy.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default Privacy;
