import React, { useEffect } from 'react';

const ReportDMCA: React.FC = () => {
  useEffect(() => {
    const title = 'Report Abuse & DMCA - Public Streamer';
    const description =
      'Report abuse or copyright infringement. Learn our review process, repeat-violator policy, and how moderators act on reports.';
    document.title = title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(
        `meta[name="${name}"]`
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    setMeta('description', description);

    let canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/report`);

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Report Abuse & DMCA',
      description,
      url: `${window.location.origin}/report`,
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
          <h1>Report Abuse & DMCA</h1>

          <nav aria-label="Report navigation" className="not-prose my-4">
            <ul className="flex flex-wrap gap-4 text-sm">
              <li>
                <a href="#abuse" className="underline">
                  Report abuse
                </a>
              </li>
              <li>
                <a href="#dmca" className="underline">
                  DMCA / Copyright
                </a>
              </li>
            </ul>
          </nav>

          <section id="abuse">
            <h2>Report Abuse</h2>
            <p>
              If you or someone else is in immediate danger, contact your local
              authorities. For issues occurring on Public Streamer, please use
              the in-app Report button to flag the content for review by our
              moderation team.
            </p>
            <h3>What counts as abuse</h3>
            <ul>
              <li>
                Harassment, hate, or targeted insults toward a protected class
                or individual
              </li>
              <li>Sexual exploitation or non-consensual sexual content</li>
              <li>Threats of violence or encouragement of dangerous acts</li>
              <li>
                Stalking, doxxing, or disclosure of private personal information
              </li>
              <li>Spam, scams, and malicious links</li>
            </ul>
            <h3>How to report in the app</h3>
            <ol>
              <li>Open the event or content you want to report.</li>
              <li>
                Click the Report button and select the most accurate reason.
              </li>
              <li>
                Add any context that will help reviewers understand the
                situation.
              </li>
              <li>Submit your report. We will confirm receipt in-app.</li>
            </ol>
            <h3>Tips for evidence</h3>
            <ul>
              <li>
                Provide timestamps or short descriptions of what happened and
                when
              </li>
              <li>
                Include relevant usernames or links to the content within Public
                Streamer
              </li>
              <li>
                Keep reports factual; avoid sharing personal data not directly
                related to the issue
              </li>
            </ul>
            <h3>What happens next</h3>
            <p>
              Our moderators review each report. We may remove content, restrict
              monetization, issue warnings, or suspend accounts. Repeat or
              egregious violations may lead to permanent restrictions as
              described in our Terms.
            </p>
          </section>

          <section>
            <h2>How Reporting Works</h2>
            <p>
              Use the in-app Report button on any event to flag content for
              review. Reports are saved to our database and appear in our
              moderation queue. Master Admins and moderators review each report
              and may remove content, restrict monetization, or take other
              actions consistent with our Terms.
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
              We follow a graduated enforcement program for repeat violators:
              warnings, temporary monetization suspensions, and permanent bans
              for repeated or egregious violations. Users may appeal within the
              window described in our Terms.
            </p>
          </section>

          <section id="dmca">
            <h2>Copyright and DMCA</h2>
            <p>
              If you believe your work has been used without authorization,
              submit a report using the Copyright/IP reason with enough detail
              for our moderators to evaluate the claim. We will review and may
              remove content or restrict monetization while investigating.
            </p>
          </section>

          <section>
            <h2>What Moderators Can Do</h2>
            <ul>
              <li>Remove reported content or end a live event</li>
              <li>Issue warnings and log violations</li>
              <li>Temporarily suspend monetization during review</li>
              <li>
                Escalate or apply permanent restrictions for repeat violations
              </li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  );
};

export default ReportDMCA;
