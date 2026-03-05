"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Shield,
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
} from "lucide-react";
import { useWardenStore } from "@/lib/store";
import { updateCompanyProfile, getCompanyProfile } from "@/lib/api";
import { useRouter } from "next/navigation";

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
  const nodes = useMemo(() => generateNodes(24), []);

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
        return suppliers.some((s) => s.name.trim() !== "");
      case 5:
        return true;
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
      });
      const profile = await getCompanyProfile();
      setCompany(profile);
      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      router.push("/dashboard");
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
                {/* Animated shield icon with glow */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="relative w-24 h-24 mx-auto mb-8"
                >
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-blue-400/20"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/60 flex items-center justify-center shadow-lg shadow-blue-100/50">
                    <Shield size={42} className="text-blue-500" />
                  </div>
                  {/* Online indicator */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center"
                  >
                    <motion.div
                      className="w-2 h-2 bg-emerald-200 rounded-full"
                      animate={{ scale: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                </motion.div>

                {/* Title with staggered reveal */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <p className="text-sm font-semibold text-blue-500 uppercase tracking-widest mb-3">
                    Meet Warden
                  </p>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.6 }}
                  className="text-4xl font-bold text-gray-900 mb-4 leading-tight"
                >
                  Your Supply Chain Resilience
                  <br />
                  <span className="ob-text-gradient-blue">Agent Who Never Sleeps</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="text-gray-400 max-w-lg mx-auto mb-10 leading-relaxed"
                >
                  Warden autonomously monitors your supply chain, quantifies risk in real-time,
                  and takes action before disruptions hit your bottom line.
                </motion.p>

                {/* Animated stats row */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
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
                    visible: { transition: { staggerChildren: 0.15, delayChildren: 1.1 } },
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
                  transition={{ delay: 1.6, duration: 0.5 }}
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
                          className="text-gray-300 hover:text-red-400 transition-colors"
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
                          className="text-gray-300 hover:text-red-400 transition-colors"
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

          {/* ── Step 6: Review ── */}
          {step === 6 && (
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
                  <span className="text-sm text-gray-700">
                    {suppliers.filter((s) => s.name.trim()).length} configured
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    SLA Rules
                  </span>
                  <span className="text-sm text-gray-700">
                    {slaPenalties.filter((s) => s.customer.trim()).length} configured
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
