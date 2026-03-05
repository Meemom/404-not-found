"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { useWardenStore } from "@/lib/store";
import { updateCompanyProfile, getCompanyProfile } from "@/lib/api";
import { useRouter } from "next/navigation";

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
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-6">
                <Shield size={36} className="text-blue-500" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Welcome to Warden
              </h1>
              <p className="text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
                Your autonomous supply chain resilience co-pilot. We&apos;ll ask a few
                questions to tailor Warden to your operations.
              </p>
              <button
                onClick={next}
                className="ob-btn-primary mx-auto"
              >
                Get Started <ArrowRight size={16} />
              </button>
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
