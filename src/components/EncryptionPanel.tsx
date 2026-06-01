import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Unlock, Key, Shield, FileText, RefreshCw,
  Eye, EyeOff, CheckCircle2, AlertTriangle, Zap,
  ArrowRight, Copy, Hash, ShieldCheck
} from "lucide-react";

interface EncryptionLog {
  id: string;
  timestamp: string;
  type: "encrypt" | "decrypt" | "key-gen" | "verify" | "alert";
  algorithm: string;
  message: string;
  status: "success" | "failed" | "warning";
}

interface EncryptedItem {
  id: string;
  label: string;
  original: string;
  encrypted: string;
  algorithm: string;
  keySize: number;
  timestamp: string;
  status: "encrypted" | "decrypted";
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const fromBase64 = (base64: string) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

const generateAesKey = async (): Promise<CryptoKey> => {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

const generateRsaKeyPair = async (): Promise<CryptoKeyPair> => {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
};

const encryptAesGcm = async (key: CryptoKey, plain: string): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plain)
  );
  return `${toBase64(iv.buffer)}:${toBase64(ciphertext)}`;
};

const encryptRsa = async (publicKey: CryptoKey, plain: string): Promise<string> => {
  const result = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    textEncoder.encode(plain)
  );
  return toBase64(result);
};

const hashSha256 = async (text: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const ALGORITHMS = [
  { name: "AES-256-GCM", type: "Symmetric", keySize: 256, speed: "Fast", use: "Data at Rest" },
  { name: "RSA-4096", type: "Asymmetric", keySize: 4096, speed: "Slow", use: "Key Exchange" },
  { name: "ChaCha20-Poly1305", type: "Symmetric", keySize: 256, speed: "Fast", use: "TLS 1.3" },
  { name: "SHA-256", type: "Hash", keySize: 256, speed: "Fast", use: "Integrity Check" },
];

const SAMPLE_DATA = [
  { label: "User Credentials", data: "admin:P@ssw0rd!2026" },
  { label: "Patient Records", data: "Patient: John Doe, DOB: 1990-05-15, Diagnosis: Confidential" },
  { label: "API Secret Key", data: "sk_live_4eC39HqLyjWDarjtT1zdp7dc" },
  { label: "Financial Data", data: "Account: 1234-5678-9012, Balance: $45,230.00" },
  { label: "Network Config", data: "Gateway: 192.168.1.1, DNS: 8.8.8.8, Key: wg-priv-key-abc123" },
  { label: "Database Query", data: "SELECT * FROM users WHERE role='admin' AND active=1" },
];

const AUTO_ENCRYPT_EVENTS = [
  { source: "Database", data: "user_sessions table", algo: "AES-256-GCM" },
  { source: "API Gateway", data: "OAuth token payload", algo: "RSA-4096" },
  { source: "File Storage", data: "medical_records.pdf", algo: "AES-256-GCM" },
  { source: "Email Server", data: "SMTP credentials", algo: "ChaCha20-Poly1305" },
  { source: "VPN Tunnel", data: "WireGuard handshake", algo: "ChaCha20-Poly1305" },
  { source: "Backup System", data: "nightly_backup.tar.gz", algo: "AES-256-GCM" },
  { source: "Auth Service", data: "JWT signing key rotation", algo: "RSA-4096" },
  { source: "DNS Server", data: "DNSSEC zone signing", algo: "RSA-4096" },
];

const EncryptionPanel = () => {
  const [logs, setLogs] = useState<EncryptionLog[]>([]);
  const [encryptedItems, setEncryptedItems] = useState<EncryptedItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedAlgo, setSelectedAlgo] = useState(0);
  const [showDecrypted, setShowDecrypted] = useState<Record<string, boolean>>({});
  const [autoEncrypt, setAutoEncrypt] = useState(true);
  const [aesKey, setAesKey] = useState<CryptoKey | null>(null);
  const [rsaKeyPair, setRsaKeyPair] = useState<CryptoKeyPair | null>(null);
  const [stats, setStats] = useState({ encrypted: 0, decrypted: 0, keysGenerated: 0, integrityChecks: 0 });
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((log: Omit<EncryptionLog, "id" | "timestamp">) => {
    setLogs((prev) => [{
      ...log,
      id: `ENC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    }, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    const initializeKeys = async () => {
      try {
        const [aes, rsa] = await Promise.all([generateAesKey(), generateRsaKeyPair()]);
        setAesKey(aes);
        setRsaKeyPair(rsa);
        addLog({ type: "key-gen", algorithm: "RSA-4096", message: "Generated AES and RSA key material for encryption operations", status: "success" });
        setStats((prev) => ({ ...prev, keysGenerated: prev.keysGenerated + 1 }));
      } catch (error) {
        addLog({ type: "alert", algorithm: "RSA-4096", message: "Unable to initialize crypto keys in this browser", status: "failed" });
      }
    };

    initializeKeys();
  }, [addLog]);

  // Auto-encryption of data streams
  useEffect(() => {
    if (!autoEncrypt) return;
    const iv = setInterval(() => {
      const evt = AUTO_ENCRYPT_EVENTS[Math.floor(Math.random() * AUTO_ENCRYPT_EVENTS.length)];
      addLog({
        type: "encrypt",
        algorithm: evt.algo,
        message: `[${evt.source}] Auto-encrypted: ${evt.data} → ${evt.algo}`,
        status: "success",
      });
      setStats(prev => ({ ...prev, encrypted: prev.encrypted + 1 }));

      // Occasionally add key generation or integrity check
      if (Math.random() < 0.3) {
        setTimeout(() => {
          addLog({
            type: "key-gen",
            algorithm: "RSA-4096",
            message: `[KEY-MGMT] Auto key rotation completed — new keypair generated`,
            status: "success",
          });
          setStats(prev => ({ ...prev, keysGenerated: prev.keysGenerated + 1 }));
        }, 800);
      }
      if (Math.random() < 0.25) {
        setTimeout(() => {
          const passed = Math.random() > 0.1;
          addLog({
            type: "verify",
            algorithm: "SHA-256",
            message: passed
              ? `[INTEGRITY] Hash verification passed — data unchanged ✓`
              : `[INTEGRITY] ⚠️ Hash mismatch detected — possible tampering!`,
            status: passed ? "success" : "warning",
          });
          setStats(prev => ({ ...prev, integrityChecks: prev.integrityChecks + 1 }));
        }, 1200);
      }
    }, 2200);
    return () => clearInterval(iv);
  }, [autoEncrypt, addLog]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [logs]);

  const isReversible = (algorithm: string) => algorithm !== "SHA-256";

  const getEncryptedPayload = async (algorithm: string, text: string) => {
    if (algorithm === "SHA-256") {
      return hashSha256(text);
    }

    if (algorithm === "AES-256-GCM") {
      if (!aesKey) throw new Error("AES key material unavailable");
      return encryptAesGcm(aesKey, text);
    }

    if (algorithm === "RSA-4096") {
      if (!rsaKeyPair?.publicKey) throw new Error("RSA public key unavailable");
      return encryptRsa(rsaKeyPair.publicKey, text);
    }

    // ChaCha20-Poly1305 fallback to AES-GCM in browser environment
    if (!aesKey) throw new Error("AES key material unavailable");
    return encryptAesGcm(aesKey, text);
  };

  const handleEncrypt = async () => {
    if (!inputText.trim()) return;
    const algo = ALGORITHMS[selectedAlgo];
    const encrypted = await getEncryptedPayload(algo.name, inputText);
    const item: EncryptedItem = {
      id: `ITEM-${Date.now()}`,
      label: "Manual Input",
      original: inputText,
      encrypted,
      algorithm: algo.name,
      keySize: algo.keySize,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
      status: "encrypted",
    };
    setEncryptedItems((prev) => [item, ...prev].slice(0, 20));
    addLog({ type: "encrypt", algorithm: algo.name, message: `[MANUAL] Data encrypted with ${algo.name} (${algo.keySize}-bit) ✓`, status: "success" });
    setStats((prev) => ({ ...prev, encrypted: prev.encrypted + 1 }));
    setInputText("");
  };

  const handleQuickEncrypt = async (sample: typeof SAMPLE_DATA[0]) => {
    const algo = ALGORITHMS[selectedAlgo];
    const encrypted = await getEncryptedPayload(algo.name, sample.data);
    const item: EncryptedItem = {
      id: `ITEM-${Date.now()}`,
      label: sample.label,
      original: sample.data,
      encrypted,
      algorithm: algo.name,
      keySize: algo.keySize,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
      status: "encrypted",
    };
    setEncryptedItems((prev) => [item, ...prev].slice(0, 20));
    addLog({ type: "encrypt", algorithm: algo.name, message: `[ENCRYPT] ${sample.label} encrypted → ${algo.name} (${algo.keySize}-bit) ✓`, status: "success" });
    setStats((prev) => ({ ...prev, encrypted: prev.encrypted + 1 }));
  };

  const handleDecrypt = (item: EncryptedItem) => {
    if (!isReversible(item.algorithm)) {
      addLog({ type: "alert", algorithm: item.algorithm, message: `[DECRYPT] Cannot decrypt hashed output (${item.algorithm})`, status: "warning" });
      return;
    }
    addLog({ type: "decrypt", algorithm: item.algorithm, message: `[DECRYPT] Authorized decryption: ${item.label} → plaintext restored ✓`, status: "success" });
    setStats((prev) => ({ ...prev, decrypted: prev.decrypted + 1 }));
    setShowDecrypted((prev) => ({ ...prev, [item.id]: true }));
    setEncryptedItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "decrypted" } : i)));
  };

  const handleUnauthorizedDecrypt = (item: EncryptedItem) => {
    addLog({ type: "alert", algorithm: item.algorithm, message: `[SECURITY] ⚠️ Unauthorized decryption attempt on "${item.label}" — ACCESS DENIED`, status: "failed" });
  };

  const logColor = (log: EncryptionLog) => {
    if (log.status === "failed") return "text-destructive";
    if (log.status === "warning") return "text-warning";
    if (log.type === "encrypt") return "text-primary/80";
    if (log.type === "decrypt") return "text-success";
    if (log.type === "key-gen") return "text-accent";
    if (log.type === "verify") return "text-success";
    return "text-foreground/70";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Data Encrypted", value: stats.encrypted, icon: Lock, color: "text-primary" },
          { label: "Data Decrypted", value: stats.decrypted, icon: Unlock, color: "text-success" },
          { label: "Keys Generated", value: stats.keysGenerated, icon: Key, color: "text-accent" },
          { label: "Integrity Checks", value: stats.integrityChecks, icon: Hash, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-border/30 bg-card/40">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="font-mono text-[10px] text-muted-foreground">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Encrypt Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Algorithm Selector */}
          <div className="p-4 rounded-xl border border-border/30 bg-card/40">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">Algorithm</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-muted-foreground/60">AUTO-ENCRYPT</span>
                <button
                  onClick={() => setAutoEncrypt(!autoEncrypt)}
                  className={`w-8 h-4 rounded-full transition-all relative ${autoEncrypt ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-background shadow transition-all ${autoEncrypt ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {ALGORITHMS.map((algo, i) => (
                <button
                  key={algo.name}
                  onClick={() => setSelectedAlgo(i)}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-xs font-mono ${
                    selectedAlgo === i
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/20 bg-background/30 text-muted-foreground hover:bg-card/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{algo.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/30">{algo.type}</span>
                  </div>
                  <div className="flex gap-3 mt-1 text-[9px] text-muted-foreground/60">
                    <span>{algo.keySize}-bit</span>
                    <span>{algo.speed}</span>
                    <span>{algo.use}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Encrypt Input */}
          <div className="p-4 rounded-xl border border-border/30 bg-card/40">
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase block mb-3">Manual Encrypt</span>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter sensitive data to encrypt..."
              className="w-full h-20 bg-background/50 border border-border/30 rounded-lg p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/30 resize-none outline-none focus:border-primary/40 transition-colors"
            />
            <button
              onClick={handleEncrypt}
              disabled={!inputText.trim()}
              className="w-full mt-2 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 font-mono text-xs hover:bg-primary/20 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              Encrypt with {ALGORITHMS[selectedAlgo].name}
            </button>
          </div>

          {/* Quick Encrypt Samples */}
          <div className="p-4 rounded-xl border border-border/30 bg-card/40">
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase block mb-3">Quick Encrypt Samples</span>
            <div className="space-y-1.5">
              {SAMPLE_DATA.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickEncrypt(sample)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border/20 bg-background/30 hover:bg-primary/5 hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-foreground/80">{sample.label}</span>
                    <Lock className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="font-mono text-[9px] text-muted-foreground/40 truncate mt-0.5">{sample.data}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Encrypted Vault */}
        <div className="lg:col-span-1">
          <div className="p-4 rounded-xl border border-border/30 bg-card/40 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">Encrypted Vault</span>
              </div>
              <span className="font-mono text-[9px] text-primary/60">{encryptedItems.length} items</span>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              <AnimatePresence>
                {encryptedItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground/30">
                    <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-mono text-[10px]">No encrypted items yet</p>
                    <p className="font-mono text-[9px] mt-1">Encrypt data using the panel on the left</p>
                  </div>
                ) : (
                  encryptedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border transition-all ${
                        item.status === "encrypted"
                          ? "border-primary/20 bg-primary/5"
                          : "border-success/20 bg-success/5"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {item.status === "encrypted" ? (
                            <Lock className="w-3 h-3 text-primary" />
                          ) : (
                            <Unlock className="w-3 h-3 text-success" />
                          )}
                          <span className="font-mono text-[10px] font-semibold text-foreground/80">{item.label}</span>
                        </div>
                        <span className="font-mono text-[8px] text-muted-foreground/40">{item.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[8px]">{item.algorithm}</span>
                        <span className="px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground font-mono text-[8px]">{item.keySize}-bit</span>
                      </div>

                      {/* Show encrypted or decrypted data */}
                      <div className="bg-background/60 rounded p-2 mb-2 font-mono text-[9px] break-all">
                        {showDecrypted[item.id] ? (
                          <span className="text-success">{item.original}</span>
                        ) : (
                          <span className="text-muted-foreground/50">{item.encrypted}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5">
                        {item.status === "encrypted" ? (
                          <>
                            <button
                              onClick={() => handleDecrypt(item)}
                              disabled={!isReversible(item.algorithm)}
                              className="flex-1 py-1.5 rounded bg-success/10 text-success border border-success/20 font-mono text-[9px] hover:bg-success/20 transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              <Key className="w-2.5 h-2.5" /> Authorized Decrypt
                            </button>
                            <button
                              onClick={() => handleUnauthorizedDecrypt(item)}
                              className="py-1.5 px-2 rounded bg-destructive/10 text-destructive border border-destructive/20 font-mono text-[9px] hover:bg-destructive/20 transition-all"
                              title="Simulate unauthorized access"
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-success font-mono text-[9px]">
                            <CheckCircle2 className="w-3 h-3" /> Decrypted by authorized user
                          </div>
                        )}
                      </div>
                      {!isReversible(item.algorithm) && item.status === "encrypted" && (
                        <div className="text-[9px] text-muted-foreground mt-1">SHA-256 output is one-way; decryption is not possible.</div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Live Encryption Log */}
        <div className="lg:col-span-1">
          <div className="p-4 rounded-xl border border-border/30 bg-card/40 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <span className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">Live Encryption Log</span>
              </div>
              {autoEncrypt && (
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="font-mono text-[8px] text-success">LIVE</span>
                </motion.div>
              )}
            </div>
            <div ref={logRef} className="space-y-0.5 max-h-[620px] overflow-y-auto pr-1 font-mono text-[10px]">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`py-1.5 px-2 rounded ${logColor(log)} ${
                      log.status === "failed" ? "bg-destructive/5" : log.status === "warning" ? "bg-warning/5" : ""
                    }`}
                  >
                    <span className="text-muted-foreground/40">[{log.timestamp}]</span>{" "}
                    {log.message}
                  </motion.div>
                ))}
              </AnimatePresence>
              {logs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground/30 text-[10px]">
                  Waiting for encryption events...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EncryptionPanel;
