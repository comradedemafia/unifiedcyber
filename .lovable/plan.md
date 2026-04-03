

# Mpango wa Kukamilisha Mfumo wa Ulinzi wa Mtandao (Cyber Defense System)

Mfumo uliopo tayari una vipengele vikuu vingi — Incident Response, Firewall, IDS/IPS, Encryption, Live Monitoring, Threat Feed, na Kali Terminal. Ili kuufanya uwe kamili zaidi kwa ulimwengu halisi wa kuzuia cyber attacks, hapa kuna maboresho muhimu:

---

## Hatua 1: Admin Authentication & Dashboard ya Ulinzi

Kuongeza mfumo wa login kwa admin ili arifa na data za usalama zilindwe.

- Kuunda login/signup page kwa admin
- Dashboard page yenye muhtasari wa hali ya mfumo (summary stats) — total threats blocked, active incidents, system health
- Protected routes — dashboard haionekani bila login

**Faili mpya:** `src/pages/Login.tsx`, `src/pages/Dashboard.tsx`, `src/contexts/AuthContext.tsx`
**Mabadiliko:** `src/App.tsx` (routes), `src/components/Navbar.tsx` (login/logout button)

---

## Hatua 2: Database ya Kuhifadhi Security Events

Kuunda database tables kwenye Lovable Cloud kwa ajili ya kuhifadhi:

- **security_incidents** — incidents zilizotambuliwa (type, severity, source IP, status, timestamps)
- **firewall_logs** — traffic entries (src/dst IP, port, status, threat type)
- **threat_alerts** — alerts kutoka IDS/IPS
- **blocked_ips** — IP addresses zilizozuiwa (blacklist)

RLS policies ili admin peke yake aweze kusoma/kuandika data.

---

## Hatua 3: Real-Time Alert Notification System

Mfumo wa kutoa arifa kwa admin moja kwa moja:

- **In-app notifications** — bell icon kwenye navbar inayoonyesha idadi ya alerts mpya
- **Notification panel** — slide-out panel inayoonyesha alerts za hivi karibuni zenye severity badges
- **Sound alerts** — sauti ya onyo kwa critical threats
- **Email notifications** — Edge Function itakayotuma email kwa admin kwa critical incidents

**Faili mpya:** `src/components/NotificationPanel.tsx`, `supabase/functions/send-alert/index.ts`

---

## Hatua 4: Threat Intelligence & IP Reputation

Kuongeza uwezo wa kuchunguza IP addresses:

- **IP Blacklist Management** — admin anaweza kuongeza/kuondoa IPs kutoka blacklist
- **Threat Intelligence Feed** — kuonyesha known malicious IPs, CVEs, na attack patterns
- **GeoIP Mapping** — ramani inayoonyesha mahali mashambulizi yanatoka (world map visualization)
- **Auto-blocking** — IPs zinazo-repeat attacks zinazuiwa automatically

**Faili mpya:** `src/components/ThreatIntelligence.tsx`, `src/components/GeoThreatMap.tsx`

---

## Hatua 5: Vulnerability Scanner Simulation

Kuongeza scanner ya kutambua udhaifu kwenye mfumo:

- **Port Scanner** — inaonyesha ports zilizo wazi na hatari zake
- **Service Detection** — kutambua services zinazoendesha na versions zake
- **CVE Checker** — kuangalia known vulnerabilities kwa services zilizotambuliwa
- **Security Score** — overall score ya usalama wa mfumo (A-F grading)

**Faili mpya:** `src/components/VulnerabilityScanner.tsx`

---

## Hatua 6: Automated Response Playbooks

Kuongeza playbooks za kiotomatiki kwa aina tofauti za mashambulizi:

- **DDoS Playbook** — rate limiting → IP block → CDN failover → admin alert
- **Brute Force Playbook** — account lockout → IP ban → password policy enforcement
- **Malware Playbook** — quarantine → scan → clean → restore
- **Data Exfiltration Playbook** — network isolation → forensics → data integrity check

Kila playbook inaonyesha hatua kwa hatua na status ya kila hatua (running/complete/failed).

**Mabadiliko:** `src/components/IncidentResponse.tsx` (tab mpya ya Playbooks)

---

## Hatua 7: Security Reports & Analytics

Dashboard ya ripoti na uchambuzi:

- **Daily/Weekly/Monthly reports** — muhtasari wa matukio ya usalama
- **Trend charts** — mwelekeo wa mashambulizi kwa muda
- **Top attacked services** — services zinazoshambuliwa zaidi
- **Export capability** — download reports kama PDF

**Faili mpya:** `src/components/SecurityReports.tsx`

---

## Mpangilio wa Utekelezaji

| Hatua | Kipaumbele | Sababu |
|-------|-----------|--------|
| 1. Auth & Dashboard | Juu | Msingi wa mfumo wote — kulinda data |
| 2. Database | Juu | Kuhifadhi events za kweli |
| 3. Notifications | Juu | Admin lazima apate arifa |
| 4. Threat Intelligence | Kati | Kuongeza uwezo wa uchambuzi |
| 5. Vulnerability Scanner | Kati | Kutambua udhaifu mapema |
| 6. Playbooks | Kati | Kuzuia mashambulizi kiotomatiki |
| 7. Reports | Chini | Uchambuzi wa muda mrefu |

---

## Maelezo ya Kiufundi

- Authentication itatumia Lovable Cloud auth (email/password)
- Database migrations kwa tables zote na RLS policies
- Edge Function kwa email alerts (kutumia LOVABLE_API_KEY iliyopo)
- Recharts kwa charts na analytics
- Framer Motion kwa animations za real-time
- Data ya simulation itahifadhiwa kwenye database kwa ajili ya analytics na reports

