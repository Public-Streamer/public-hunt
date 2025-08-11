import React, { useEffect } from 'react';

const ReportDMCA: React.FC = () => {
  useEffect(() => {
    const title = 'Report Content / DMCA - Public Streamer';
    const description = 'Report abusive or infringing content. Learn our review process, repeat violators policy, and how moderators act on reports.';
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
    canonical.setAttribute('href', `${window.location.origin}/report`);

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Report Content / DMCA',
      description,
      url: `${window.location.origin}/report`
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
          <h1>Report Content / DMCA</h1>

          <section>
            <h2>How Reporting Works</h2>
            <p>
              Use the in-app Report button on any event to flag content for review. Reports are saved to our database and appear in our moderation queue. Master Admins and moderators review each report and may remove content, restrict monetization, or take other actions consistent with our Terms.
            </p>
          </section>

          <section>
            <h2>Reasons You Can Report</h2>
            <ul>
              <li>Spam or scams</li>
              <li>Hate or harassment</li>
              <li>Sexual content or nudity</li>
              <li>Violence or dangerous acts</li>
              <li>Copyright/IP concerns</li>
              <li>Misleading content</li>
              <li>Other policy violations</li>
            </ul>
          </section>

          <section>
            <h2>Enforcement and Appeals</h2>
            <p>
              We follow a graduated enforcement program for repeat violators: warnings, temporary monetization suspensions, and permanent bans for repeated or egregious violations. Users may appeal within the window described in our Terms.
            </p>
          </section>

          <section>
            <h2>Copyright and DMCA</h2>
            <p>
              If you believe your work has been used without authorization, submit a report using the Copyright/IP reason with enough detail for our moderators to evaluate the claim. We will review and may remove content or restrict monetization while investigating.
            </p>
          </section>

          <section>
            <h2>What Moderators Can Do</h2>
            <ul>
              <li>Remove reported content or end a live event</li>
              <li>Issue warnings and log violations</li>
              <li>Temporarily suspend monetization during review</li>
              <li>Escalate or apply permanent restrictions for repeat violations</li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  );
};

export default ReportDMCA;
