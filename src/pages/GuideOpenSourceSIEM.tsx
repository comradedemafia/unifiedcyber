import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft, ExternalLink, CheckCircle2 } from "lucide-react";

const TITLE = "Open-Source SIEM Tools: A 2026 Guide for Self-Hosted SOCs";
const DESCRIPTION =
  "Compare the top open-source SIEM tools — Wazuh, Suricata, ELK, Graylog, OpenSearch, Security Onion — with deployment patterns, strengths, and a self-hosted reference architecture.";
const CANONICAL = "https://unified-cyber-guard.lovable.app/guides/open-source-siem-tools";

const tools = [
  {
    name: "Wazuh",
    role: "Host-based detection (HIDS) & endpoint security",
    strengths: ["File integrity monitoring", "Log analysis & rootkit detection", "MITRE ATT&CK mapping", "Free, active community"],
    link: "https://wazuh.com",
  },
  {
    name: "Suricata",
    role: "Network IDS/IPS & traffic analysis",
    strengths: ["Multi-threaded packet inspection", "Lua scripting & rules", "TLS, HTTP, DNS protocol parsing", "EVE JSON output for SIEM ingest"],
    link: "https://suricata.io",
  },
  {
    name: "Elastic Stack (ELK)",
    role: "Log aggregation, search & visualization",
    strengths: ["Powerful full-text search", "Kibana dashboards", "Beats agents", "Mature ecosystem"],
    link: "https://www.elastic.co/elastic-stack",
  },
  {
    name: "OpenSearch",
    role: "Apache-2.0 fork of Elasticsearch + Kibana",
    strengths: ["Truly open source license", "Built-in security plugin", "Anomaly detection module", "AWS-backed development"],
    link: "https://opensearch.org",
  },
  {
    name: "Graylog Open",
    role: "Centralized log management",
    strengths: ["Stream processing & alerting", "Pipeline rules for parsing", "Lower resource footprint than ELK", "REST API & content packs"],
    link: "https://graylog.org",
  },
  {
    name: "Security Onion",
    role: "All-in-one SOC distribution",
    strengths: ["Bundles Suricata, Zeek, Wazuh, ELK", "Hunt & case management UI", "Network & host telemetry", "Great for labs & SMBs"],
    link: "https://securityonionsolutions.com",
  },
  {
    name: "TheHive + Cortex",
    role: "Incident response & threat-intel orchestration",
    strengths: ["Case management for analysts", "MISP integration", "Cortex analyzers automate enrichment", "Playbook-friendly"],
    link: "https://thehive-project.org",
  },
];

const GuideOpenSourceSIEM = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;

    const setMeta = (selector: string, attr: string, name: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      return el;
    };

    const desc = setMeta('meta[name="description"]', "name", "description", DESCRIPTION);
    const ogt = setMeta('meta[property="og:title"]', "property", "og:title", TITLE);
    const ogd = setMeta('meta[property="og:description"]', "property", "og:description", DESCRIPTION);
    const ogu = setMeta('meta[property="og:url"]', "property", "og:url", CANONICAL);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const created = !canonical;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const prevCanonical = canonical.getAttribute("href");
    canonical.setAttribute("href", CANONICAL);

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: TITLE,
      description: DESCRIPTION,
      mainEntityOfPage: CANONICAL,
      author: { "@type": "Organization", name: "RUCU Unified Cyber Security" },
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      document.head.removeChild(ld);
      if (created && canonical) document.head.removeChild(canonical);
      else if (canonical && prevCanonical) canonical.setAttribute("href", prevCanonical);
      void desc; void ogt; void ogd; void ogu;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-primary transition">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <Shield className="w-4 h-4" />
            <span className="font-mono text-xs tracking-[0.25em] uppercase">Guides</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-10 max-w-4xl">
        <article>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-3">SIEM · Open Source · 2026</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Open-Source SIEM Tools: A 2026 Guide for Self-Hosted SOCs
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-8">
            A practical walkthrough of the open-source SIEM stack we run inside the RUCU Unified Cyber Security platform —
            what each tool does, where it shines, and how the pieces fit into a self-hosted SOC.
          </p>

          <section className="prose prose-invert max-w-none mb-10">
            <h2 className="text-2xl font-semibold mb-3">Why open-source SIEM?</h2>
            <p className="text-foreground/90 leading-relaxed">
              Commercial SIEMs (Splunk, QRadar, Sentinel) bill per ingested GB, which quickly becomes prohibitive for universities,
              SMBs, and labs. Open-source SIEM tools give you the same detection, correlation, and response surface with a
              transparent code base — at the cost of operating the pipeline yourself. The trade-off is usually worth it once
              ingest volume crosses ~50 GB/day.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">The top open-source SIEM tools</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {tools.map((t) => (
                <div key={t.name} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{t.name}</h3>
                    <a
                      href={t.link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-muted-foreground hover:text-primary transition"
                      aria-label={`Visit ${t.name} site`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{t.role}</p>
                  <ul className="space-y-1.5">
                    {t.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">Reference architecture</h2>
            <p className="text-foreground/90 leading-relaxed mb-3">
              The RUCU platform layers three families: <strong>host telemetry (Wazuh)</strong>,
              <strong> network telemetry (Suricata + Zeek)</strong>, and <strong>web/application telemetry (ModSecurity)</strong>.
              All three feed JSON events into an <strong>OpenSearch</strong> cluster; Kibana/OpenSearch Dashboards drive analyst
              search and visualization, while <strong>TheHive + Cortex</strong> picks up alerts for case management and automated
              enrichment.
            </p>
            <pre className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs font-mono overflow-x-auto">
{`Endpoints ──► Wazuh agents ─┐
Web servers ► ModSecurity ──┼──► Logstash/Fluent Bit ──► OpenSearch ──► Dashboards
Mirror port ► Suricata/Zeek ─┘                                  │
                                                                ▼
                                                          TheHive + Cortex`}
            </pre>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">How to choose</h2>
            <ul className="space-y-2 text-foreground/90">
              <li>• <strong>Just starting?</strong> Deploy Security Onion in a VM — you get the full stack in one ISO.</li>
              <li>• <strong>Endpoint-first?</strong> Wazuh alone covers HIDS, FIM, and compliance benchmarks.</li>
              <li>• <strong>Network-first?</strong> Suricata + Zeek + OpenSearch is the classic NSM pipeline.</li>
              <li>• <strong>License-sensitive?</strong> Pick OpenSearch over Elasticsearch to stay on Apache-2.0.</li>
              <li>• <strong>Need IR workflow?</strong> Bolt on TheHive + Cortex + MISP for case management and threat intel.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h2 className="text-xl font-semibold mb-2">See it running</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The RUCU dashboard demonstrates this stack live — Wazuh-style host alerts, Suricata-style network events, and
              correlated incidents in a single SIEM view.
            </p>
            <Link
              to="/siem"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              Open the SIEM dashboard <ArrowLeft className="w-3 h-3 rotate-180" />
            </Link>
          </section>
        </article>
      </main>
    </div>
  );
};

export default GuideOpenSourceSIEM;
