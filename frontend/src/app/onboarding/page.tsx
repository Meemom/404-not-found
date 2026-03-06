"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Factory,
  Gauge,
  Truck,
  FileWarning,
  Sparkles,
  Check,
  Plus,
  X,
  Radio,
  Activity,
  Globe,
  Upload,
  ClipboardList,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useWardenStore } from "@/lib/store";
import { updateCompanyProfile, getCompanyProfile, uploadDocument } from "@/lib/api";
import { useRouter } from "next/navigation";
import Typewriter from "@/components/onboarding/Typewriter";
import GlowingOrb from "@/components/onboarding/GlowingOrb";

/* ── Floating network nodes for welcome background ── */
interface FloatingNode {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
}

function generateNodes(count: number): FloatingNode[] {
  const nodes: FloatingNode[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 3 + Math.random() * 4,
      duration: 12 + Math.random() * 18,
      delay: Math.random() * 5,
      dx: (Math.random() - 0.5) * 30,
      dy: (Math.random() - 0.5) * 30,
    });
  }
  return nodes;
}

function NetworkBackground() {
  const [mounted, setMounted] = useState(false);
  const nodes = useMemo(() => generateNodes(24), []);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)]" />

      {/* Floating nodes */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute rounded-full bg-blue-400/20"
          style={{
            width: node.size,
            height: node.size,
            left: `${node.x}%`,
            top: `${node.y}%`,
          }}
          animate={{
            x: [0, node.dx, -node.dx * 0.5, 0],
            y: [0, node.dy, -node.dy * 0.5, 0],
            opacity: [0.15, 0.4, 0.2, 0.15],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{
            duration: node.duration,
            delay: node.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Animated connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        {nodes.slice(0, 10).map((node, i) => {
          const target = nodes[(i + 3) % nodes.length];
          return (
            <motion.line
              key={`line-${i}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${target.x}%`}
              y2={`${target.y}%`}
              stroke="rgba(59,130,246,0.07)"
              strokeWidth="1"
              animate={{ opacity: [0, 0.12, 0] }}
              transition={{
                duration: 6 + Math.random() * 4,
                delay: i * 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </svg>

      {/* Pulse rings from center */}
      {[0, 2, 4].map((delay) => (
        <motion.div
          key={`ring-${delay}`}
          className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/10"
          animate={{
            width: [80, 500],
            height: [80, 500],
            opacity: [0.3, 0],
          }}
          transition={{
            duration: 6,
            delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated counter ── */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, target, {
      duration: 2,
      ease: "easeOut",
    });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [count, rounded, target]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

/* ── Welcome step feature cards ── */
const FEATURES = [
  {
    icon: Radio,
    title: "Real-Time Monitoring",
    description: "Scans global news, shipping data, and geopolitical signals 24/7",
  },
  {
    icon: Activity,
    title: "Risk Quantification",
    description: "Calculates revenue at risk, SLA breach probability, and cascade impact",
  },
  {
    icon: Globe,
    title: "Autonomous Response",
    description: "Drafts emails, adjusts POs, and escalates — you just approve",
  },
];

const INDUSTRIES = [
  { id: "automotive", label: "Automotive & Transportation Components", icon: "🚗" },
  { id: "electronics", label: "Electronics & Electrical Equipment", icon: "💻" },
  { id: "machinery", label: "Industrial Machinery & Equipment", icon: "🏭" },
  { id: "metal", label: "Metal Fabrication & Components", icon: "🔩" },
  { id: "consumer goods", label: "Consumer Goods Manufacturing", icon: "🛍️" },
  { id: "medical", label: "Medical Devices & Life Sciences Manufacturing", icon: "🏥" },
  { id: "food", label: "Food & Beverage Processing", icon: "🍎" },
  { id: "chemicals", label: "Chemicals & Materials", icon: "🧪" },
];

const RISK_LABELS: Record<string, { label: string; description: string; color: string }> = {
  conservative: {
    label: "Conservative",
    description: "Minimize risk at all costs. Higher inventory buffers, multiple backup suppliers.",
    color: "bg-blue-600",
  },
  moderate: {
    label: "Moderate",
    description: "Balanced approach. Reasonable safety stock with selective redundancy.",
    color: "bg-blue-500",
  },
  aggressive: {
    label: "Aggressive",
    description: "Optimize for cost. Lean inventory, accept higher disruption exposure.",
    color: "bg-blue-400",
  },
};

function getRiskFromSlider(value: number): string {
  if (value <= 33) return "conservative";
  if (value <= 66) return "moderate";
  return "aggressive";
}

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "industry", label: "Industry" },
  { id: "company", label: "Company" },
  { id: "risk", label: "Risk Tolerance" },
  { id: "suppliers", label: "Suppliers" },
  { id: "sla", label: "SLA Penalties" },
  { id: "bom", label: "Bill of Materials" },
  { id: "review", label: "Review" },
];

interface SupplierEntry {
  name: string;
  components: string;
  country: string;
}

interface SLAPenalty {
  customer: string;
  slaDays: string;
  penaltyPercent: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setCompany } = useWardenStore();

  // tracking uploads
  const [uploadedSuppliers, setUploadedSuppliers] = useState<any[] | null>(null);
  const [uploadedSLA, setUploadedSLA] = useState<any[] | null>(null);
  const [uploadedBOM, setUploadedBOM] = useState<any[] | null>(null);
  const [uploading, setUploading] = useState<string | null>(null); // "suppliers" | "sla" | "bom"

  // Step data
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [hqCity, setHqCity] = useState("");
  const [hqCountry, setHqCountry] = useState("");
  const [employees, setEmployees] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");

  const [riskSlider, setRiskSlider] = useState(50);
  const riskAppetite = getRiskFromSlider(riskSlider);

  const [suppliers, setSuppliers] = useState<SupplierEntry[]>([
    { name: "", components: "", country: "" },
  ]);

  const [slaPenalties, setSlaPenalties] = useState<SLAPenalty[]>([
    { customer: "", slaDays: "", penaltyPercent: "" },
  ]);

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return selectedIndustry !== "";
      case 2:
        return companyName.trim() !== "" && hqCountry.trim() !== "";
      case 3:
        return true;
      case 4:
        return suppliers.some((s) => s.name.trim() !== "") || (uploadedSuppliers !== null && uploadedSuppliers.length > 0);
      case 5:
        return slaPenalties.some((s) => s.customer.trim() !== "") || (uploadedSLA !== null && uploadedSLA.length > 0);
      default:
        return true;
    }
  };

  const addSupplier = () => {
    if (suppliers.length < 10) {
      setSuppliers([...suppliers, { name: "", components: "", country: "" }]);
    }
  };

  const removeSupplier = (index: number) => {
    if (suppliers.length > 1) {
      setSuppliers(suppliers.filter((_, i) => i !== index));
    }
  };

  const updateSupplier = (index: number, field: keyof SupplierEntry, value: string) => {
    const updated = [...suppliers];
    updated[index] = { ...updated[index], [field]: value };
    setSuppliers(updated);
  };

  const addSLAPenalty = () => {
    if (slaPenalties.length < 10) {
      setSlaPenalties([...slaPenalties, { customer: "", slaDays: "", penaltyPercent: "" }]);
    }
  };

  const removeSLAPenalty = (index: number) => {
    if (slaPenalties.length > 1) {
      setSlaPenalties(slaPenalties.filter((_, i) => i !== index));
    }
  };

  const updateSLAPenalty = (index: number, field: keyof SLAPenalty, value: string) => {
    const updated = [...slaPenalties];
    updated[index] = { ...updated[index], [field]: value };
    setSlaPenalties(updated);
  };

  const handleUpload = async (
    file: File,
    type: "suppliers" | "sla" | "bom"
  ) => {
    setUploading(type);
    try {
      const result = await uploadDocument(type, file, "default");
      if (type === "suppliers") setUploadedSuppliers(result.extracted);
      if (type === "sla") setUploadedSLA(result.extracted);
      if (type === "bom") setUploadedBOM(result.extracted);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(null);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const industryLabel =
        INDUSTRIES.find((i) => i.id === selectedIndustry)?.label || selectedIndustry;

      await updateCompanyProfile({
        name: companyName,
        industry: industryLabel,
        headquarters: {
          city: hqCity,
          country: hqCountry,
          lat: 50.1109,
          lng: 8.6821,
        },
        employees: parseInt(employees) || 0,
        annual_revenue_eur: parseFloat(annualRevenue) || 0,
        risk_appetite: riskAppetite,
        onboarding_suppliers: suppliers.filter((s) => s.name.trim()),
        onboarding_sla_penalties: slaPenalties.filter((s) => s.customer.trim()),
        uploaded_suppliers: uploadedSuppliers || [],
        uploaded_sla: uploadedSLA || [],
        uploaded_bom: uploadedBOM || [],
      });
      const profile = await getCompanyProfile();
      setCompany(profile);
      router.push("/");
    } catch (err) {
      console.error("Onboarding error:", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const riskInfo = RISK_LABELS[riskAppetite];

  return (
    <div className="onboarding-page min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        {step > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all shrink-0 ${
                      i < step
                        ? "bg-blue-500 text-white cursor-pointer hover:bg-blue-600"
                        : i === step
                        ? "bg-blue-500 text-white ring-4 ring-blue-100"
                        : "bg-gray-100 text-gray-400 border border-gray-200 cursor-default"
                    }`}
                  >
                    {i < step ? <Check size={14} /> : i + 1}
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                        i < step ? "bg-blue-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">
              Step {step} of {STEPS.length - 1} &mdash; {STEPS[step].label}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
              className="text-center relative"
            >
              <NetworkBackground />

              <div className="relative z-10">
                {/* Three.js glowing orb */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="mb-6"
                >
                  <GlowingOrb size={350} />
                </motion.div>

                {/* Typewriter tagline */}
                <div className="min-h-[120px] mb-6">
                  <Typewriter
                    startDelay={800}
                    speed={35}
                    delayBetweenLines={200}
                    lines={[
                      {
                        text: "Meet Warden,",
                        className: "text-sm font-semibold text-blue-500 uppercase tracking-widest mb-3",
                      },
                      {
                        text: "Your Supply Chain Resilience",
                        className: "text-4xl font-bold text-gray-900 leading-tight",
                      },
                      {
                        text: "Agent Who Never Sleeps.",
                        className: "text-4xl font-bold ob-text-gradient-blue leading-tight mb-4",
                      },
                    ]}
                  />
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 4.5, duration: 0.8 }}
                  className="text-gray-400 max-w-lg mx-auto mb-10 leading-relaxed"
                >
                  Warden autonomously monitors your supply chain, quantifies risk in real-time,
                  and takes action before disruptions hit your bottom line.
                </motion.p>

                {/* Animated stats row */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 5, duration: 0.6 }}
                  className="flex items-center justify-center gap-8 mb-10"
                >
                  {[
                    { value: 24, suffix: "/7", label: "Monitoring" },
                    { value: 150, suffix: "+", label: "Risk signals/day" },
                    { value: 95, suffix: "%", label: "Faster response" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl font-bold text-gray-900 font-data">
                        <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>

                {/* Feature cards with stagger */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.15, delayChildren: 5.5 } },
                  }}
                  className="grid grid-cols-3 gap-3 mb-10 max-w-xl mx-auto"
                >
                  {FEATURES.map((feature) => (
                    <motion.div
                      key={feature.title}
                      variants={{
                        hidden: { opacity: 0, y: 20, scale: 0.95 },
                        visible: { opacity: 1, y: 0, scale: 1 },
                      }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="ob-card p-4 text-center cursor-default"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3">
                        <feature.icon size={18} className="text-blue-500" />
                      </div>
                      <h3 className="text-xs font-semibold text-gray-900 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 leading-snug">
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 6.2, duration: 0.5 }}
                >
                  <button onClick={next} className="ob-btn-primary mx-auto text-base px-8 py-3">
                    Configure Your Agent <ArrowRight size={18} />
                  </button>
                  <p className="text-xs text-gray-300 mt-3">Takes about 2 minutes</p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Industry ── */}
          {step === 1 && (
            <motion.div
              key="industry"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Factory size={20} className="text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">What do you manufacture?</h2>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                This helps Warden tailor risk signals and disruption models.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => setSelectedIndustry(ind.id)}
                    className={`ob-card text-left flex items-center gap-3 p-4 transition-all ${
                      selectedIndustry === ind.id
                        ? "ring-2 ring-blue-500 border-blue-200 bg-blue-50/50"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{ind.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{ind.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-8">
                <button onClick={back} className="ob-btn-back">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={next} disabled={!canProceed()} className="ob-btn-primary">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Company Info ── */}
          {step === 2 && (
            <motion.div
              key="company"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Factory size={20} className="text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">Tell us about your company</h2>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Basic info to set up your Warden profile.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="ob-label">Company Name *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. AutoParts GmbH"
                    className="ob-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="ob-label">HQ City</label>
                    <input
                      type="text"
                      value={hqCity}
                      onChange={(e) => setHqCity(e.target.value)}
                      placeholder="e.g. Frankfurt"
                      className="ob-input"
                    />
                  </div>
                  <div>
                    <label className="ob-label">Country *</label>
                    <input
                      type="text"
                      value={hqCountry}
                      onChange={(e) => setHqCountry(e.target.value)}
                      placeholder="e.g. Germany"
                      className="ob-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="ob-label">Employees</label>
                    <input
                      type="number"
                      value={employees}
                      onChange={(e) => setEmployees(e.target.value)}
                      placeholder="e.g. 1400"
                      className="ob-input"
                    />
                  </div>
                  <div>
                    <label className="ob-label">Annual Revenue (EUR)</label>
                    <input
                      type="number"
                      value={annualRevenue}
                      onChange={(e) => setAnnualRevenue(e.target.value)}
                      placeholder="e.g. 280000000"
                      className="ob-input"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-8">
                <button onClick={back} className="ob-btn-back">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={next} disabled={!canProceed()} className="ob-btn-primary">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Risk Tolerance ── */}
          {step === 3 && (
            <motion.div
              key="risk"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Gauge size={20} className="text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  What&apos;s your risk tolerance?
                </h2>
              </div>
              <p className="text-sm text-gray-400 mb-8">
                This determines how aggressively Warden flags threats and recommends actions.
              </p>

              <div className="ob-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                    Conservative
                  </span>
                  <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                    Aggressive
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={riskSlider}
                  onChange={(e) => setRiskSlider(parseInt(e.target.value))}
                  className="ob-slider w-full"
                />

                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${riskInfo.color}`} />
                    <span className="text-sm font-semibold text-gray-900">
                      {riskInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {riskInfo.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button onClick={back} className="ob-btn-back">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={next} className="ob-btn-primary">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Suppliers ── */}
          {step === 4 && (
            <motion.div
              key="suppliers"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Truck size={20} className="text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  Who are your top suppliers?
                </h2>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Add your most critical suppliers so Warden can monitor them. You can add more later.
              </p>

              <div className="space-y-3">
                {suppliers.map((supplier, i) => (
                  <div key={i} className="ob-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Supplier {i + 1}
                      </span>
                      {suppliers.length > 1 && (
                        <button
                          onClick={() => removeSupplier(i)}
                          className="text-gray-300 hover:text-pink-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={supplier.name}
                        onChange={(e) => updateSupplier(i, "name", e.target.value)}
                        placeholder="Supplier name"
                        className="ob-input"
                      />
                      <input
                        type="text"
                        value={supplier.components}
                        onChange={(e) => updateSupplier(i, "components", e.target.value)}
                        placeholder="Components supplied"
                        className="ob-input"
                      />
                      <input
                        type="text"
                        value={supplier.country}
                        onChange={(e) => updateSupplier(i, "country", e.target.value)}
                        placeholder="Country"
                        className="ob-input"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {suppliers.length < 10 && (
                <button
                  onClick={addSupplier}
                  className="mt-3 flex items-center gap-2 text-sm text-blue-500 font-medium hover:text-blue-600 transition-colors"
                >
                  <Plus size={16} /> Add another supplier
                </button>
              )}

              {/* Upload alternative */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <label className={`ob-card flex flex-col items-center gap-2 p-5 cursor-pointer transition-all text-center ${
                  uploadedSuppliers ? "border-green-300 bg-green-50/30" : "hover:border-blue-300 hover:bg-blue-50/30"
                }`}>
                  {uploading === "suppliers" ? (
                    <>
                      <Loader2 size={24} className="text-blue-500 animate-spin" />
                      <span className="text-sm font-medium text-gray-700">Processing with AI...</span>
                      <span className="text-xs text-gray-400">Extracting supplier data from your document</span>
                    </>
                  ) : uploadedSuppliers ? (
                    <>
                      <CheckCircle2 size={24} className="text-green-500" />
                      <span className="text-sm font-medium text-green-700">{uploadedSuppliers.length} suppliers extracted</span>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {uploadedSuppliers.slice(0, 3).map((s: any, i: number) => (
                          <p key={i}>{s.name}{s.country ? ` — ${s.country}` : ""}</p>
                        ))}
                        {uploadedSuppliers.length > 3 && <p>+{uploadedSuppliers.length - 3} more</p>}
                      </div>
                      <span className="text-xs text-blue-500 mt-1">Click to re-upload</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <Upload size={18} className="text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Upload a document</span>
                      <span className="text-xs text-gray-400">CSV, Excel, or PDF with supplier information</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "suppliers");
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button onClick={back} className="ob-btn-back">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={next} disabled={!canProceed()} className="ob-btn-primary">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 5: SLA Penalties ── */}
          {step === 5 && (
            <motion.div
              key="sla"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileWarning size={20} className="text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  What are your SLA penalties?
                </h2>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Help Warden understand the financial impact of delivery delays. You can skip this
                and add details later.
              </p>

              <div className="space-y-3">
                {slaPenalties.map((sla, i) => (
                  <div key={i} className="ob-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Customer {i + 1}
                      </span>
                      {slaPenalties.length > 1 && (
                        <button
                          onClick={() => removeSLAPenalty(i)}
                          className="text-gray-300 hover:text-pink-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={sla.customer}
                        onChange={(e) => updateSLAPenalty(i, "customer", e.target.value)}
                        placeholder="Customer name"
                        className="ob-input"
                      />
                      <input
                        type="number"
                        value={sla.slaDays}
                        onChange={(e) => updateSLAPenalty(i, "slaDays", e.target.value)}
                        placeholder="SLA (days)"
                        className="ob-input"
                      />
                      <input
                        type="number"
                        value={sla.penaltyPercent}
                        onChange={(e) => updateSLAPenalty(i, "penaltyPercent", e.target.value)}
                        placeholder="Penalty %"
                        className="ob-input"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {slaPenalties.length < 10 && (
                <button
                  onClick={addSLAPenalty}
                  className="mt-3 flex items-center gap-2 text-sm text-blue-500 font-medium hover:text-blue-600 transition-colors"
                >
                  <Plus size={16} /> Add another customer
                </button>
              )}

              {/* Upload alternative */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <label className={`ob-card flex flex-col items-center gap-2 p-5 cursor-pointer transition-all text-center ${
                  uploadedSLA ? "border-green-300 bg-green-50/30" : "hover:border-blue-300 hover:bg-blue-50/30"
                }`}>
                  {uploading === "sla" ? (
                    <>
                      <Loader2 size={24} className="text-blue-500 animate-spin" />
                      <span className="text-sm font-medium text-gray-700">Processing with AI...</span>
                      <span className="text-xs text-gray-400">Extracting customer and SLA data</span>
                    </>
                  ) : uploadedSLA ? (
                    <>
                      <CheckCircle2 size={24} className="text-green-500" />
                      <span className="text-sm font-medium text-green-700">{uploadedSLA.length} customers extracted</span>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {uploadedSLA.slice(0, 3).map((s: any, i: number) => (
                          <p key={i}>{s.customer}{s.sla_days ? ` — ${s.sla_days}d SLA` : ""}</p>
                        ))}
                        {uploadedSLA.length > 3 && <p>+{uploadedSLA.length - 3} more</p>}
                      </div>
                      <span className="text-xs text-blue-500 mt-1">Click to re-upload</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <Upload size={18} className="text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Upload a document</span>
                      <span className="text-xs text-gray-400">CSV, Excel, or PDF with SLA and penalty details</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "sla");
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button onClick={back} className="ob-btn-back">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={next} disabled={!canProceed()} className="ob-btn-primary">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 6: Bill of Materials ── */}
          {step === 6 && (
            <motion.div
              key="bom"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList size={20} className="text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  Upload your Bill of Materials
                </h2>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Upload your BOM so Warden can map parts to suppliers and identify single-source risks. You can skip this and add it later.
              </p>

              <label className={`ob-card flex flex-col items-center gap-3 p-8 cursor-pointer transition-all text-center ${
                uploadedBOM ? "border-green-300 bg-green-50/30" : "hover:border-blue-300 hover:bg-blue-50/30"
              }`}>
                {uploading === "bom" ? (
                  <>
                    <Loader2 size={28} className="text-blue-500 animate-spin" />
                    <div>
                      <span className="text-sm font-semibold text-gray-700 block">Processing with AI...</span>
                      <span className="text-xs text-gray-400 mt-1 block">Extracting parts and supplier mappings</span>
                    </div>
                  </>
                ) : uploadedBOM ? (
                  <>
                    <CheckCircle2 size={28} className="text-green-500" />
                    <div>
                      <span className="text-sm font-semibold text-green-700 block">{uploadedBOM.length} parts extracted</span>
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        {uploadedBOM.slice(0, 3).map((p: any, i: number) => (
                          <p key={i}>{p.part_number}{p.supplier_name ? ` — ${p.supplier_name}` : ""}</p>
                        ))}
                        {uploadedBOM.length > 3 && <p>+{uploadedBOM.length - 3} more</p>}
                      </div>
                      <span className="text-xs text-blue-500 mt-2 block">Click to re-upload</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <Upload size={24} className="text-blue-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-700 block">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-xs text-gray-400 mt-1 block">
                        CSV, Excel (.xlsx), or PDF &mdash; max 10MB
                      </span>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, "bom");
                    e.target.value = "";
                  }}
                />
              </label>

              <div className="mt-5 ob-card p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Expected columns</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Part number / SKU
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Part description
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Supplier name
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Quantity per unit
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Lead time (days)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Unit cost (optional)
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button onClick={back} className="ob-btn-back">
                  <ArrowLeft size={14} /> Back
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={next} className="ob-btn-back">
                    Skip for now
                  </button>
                  <button onClick={next} disabled={!canProceed()} className="ob-btn-primary">
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 7: Review ── */}
          {step === 7 && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={36} className="text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h1>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Here&apos;s a summary of your configuration. You can always update these in
                settings later.
              </p>

              <div className="ob-card p-5 text-left max-w-md mx-auto mb-8 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    Company
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{companyName || "—"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    Industry
                  </span>
                  <span className="text-sm text-gray-700">
                    {INDUSTRIES.find((i) => i.id === selectedIndustry)?.label || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    Headquarters
                  </span>
                  <span className="text-sm text-gray-700">
                    {[hqCity, hqCountry].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    Risk Tolerance
                  </span>
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${riskInfo.color}`} />
                    {riskInfo.label}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    Suppliers
                  </span>
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    {suppliers.filter((s) => s.name.trim()).length + (uploadedSuppliers?.length ?? 0)} configured
                    {uploadedSuppliers && <CheckCircle2 size={14} className="text-green-500" />}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    SLA Rules
                  </span>
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    {slaPenalties.filter((s) => s.customer.trim()).length + (uploadedSLA?.length ?? 0)} configured
                    {uploadedSLA && <CheckCircle2 size={14} className="text-green-500" />}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    Bill of Materials
                  </span>
                  <span className="text-sm text-gray-700 flex items-center gap-2">
                    {uploadedBOM ? `${uploadedBOM.length} parts` : "Not uploaded"}
                    {uploadedBOM && <CheckCircle2 size={14} className="text-green-500" />}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button onClick={back} className="ob-btn-back">
                  <ArrowLeft size={14} /> Edit
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="ob-btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Launch Dashboard <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
