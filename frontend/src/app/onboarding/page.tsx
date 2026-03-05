"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Shield,
  Check,
  Sparkles,
} from "lucide-react";
import { useWardenStore } from "@/lib/store";
import { updateCompanyProfile, getCompanyProfile } from "@/lib/api";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: "welcome", title: "Welcome to Warden" },
  { id: "company", title: "Company Profile" },
  { id: "ready", title: "You're All Set" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("AutoParts GmbH");
  const [industry, setIndustry] = useState("Automotive Components");
  const [hqCity, setHqCity] = useState("Frankfurt am Main");
  const [hqCountry, setHqCountry] = useState("Germany");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setCompany } = useWardenStore();

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Update profile via API
      await updateCompanyProfile({
        name,
        industry,
        headquarters: { city: hqCity, country: hqCountry, lat: 50.1109, lng: 8.6821 },
      });
      const profile = await getCompanyProfile();
      setCompany(profile);
      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      // Still navigate even if API is down
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warden-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  i <= step
                    ? "bg-warden-amber text-warden-bg-primary"
                    : "bg-warden-bg-elevated border border-warden-border text-warden-text-tertiary"
                }`}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px ${
                    i < step ? "bg-warden-amber" : "bg-warden-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-warden-amber/20 to-warden-amber/5 border border-warden-amber/30 flex items-center justify-center mx-auto mb-6">
                <Shield size={36} className="text-warden-amber" />
              </div>
              <h1 className="text-2xl font-bold text-warden-text-primary mb-2">
                Welcome to Warden
              </h1>
              <p className="text-sm text-warden-text-secondary max-w-sm mx-auto mb-8 leading-relaxed">
                Your autonomous supply chain resilience co-pilot. Let&apos;s configure
                your company profile to get started.
              </p>
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-warden-amber text-warden-bg-primary font-bold text-sm rounded-xl hover:bg-warden-amber-glow transition-colors flex items-center gap-2 mx-auto"
              >
                Get Started <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Step 2: Company Profile */}
          {step === 1 && (
            <motion.div
              key="company"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Building2 size={20} className="text-warden-amber" />
                <h2 className="text-lg font-bold text-warden-text-primary">
                  Company Profile
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-warden-text-tertiary uppercase tracking-wider font-medium mb-1.5 block">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-warden-bg-elevated border border-warden-border rounded-xl px-4 py-2.5 text-sm text-warden-text-primary placeholder:text-warden-text-tertiary focus:border-warden-amber/50 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs text-warden-text-tertiary uppercase tracking-wider font-medium mb-1.5 block">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-warden-bg-elevated border border-warden-border rounded-xl px-4 py-2.5 text-sm text-warden-text-primary placeholder:text-warden-text-tertiary focus:border-warden-amber/50 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-warden-text-tertiary uppercase tracking-wider font-medium mb-1.5 block">
                      HQ City
                    </label>
                    <input
                      type="text"
                      value={hqCity}
                      onChange={(e) => setHqCity(e.target.value)}
                      className="w-full bg-warden-bg-elevated border border-warden-border rounded-xl px-4 py-2.5 text-sm text-warden-text-primary placeholder:text-warden-text-tertiary focus:border-warden-amber/50 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-warden-text-tertiary uppercase tracking-wider font-medium mb-1.5 block">
                      Country
                    </label>
                    <input
                      type="text"
                      value={hqCountry}
                      onChange={(e) => setHqCountry(e.target.value)}
                      className="w-full bg-warden-bg-elevated border border-warden-border rounded-xl px-4 py-2.5 text-sm text-warden-text-primary placeholder:text-warden-text-tertiary focus:border-warden-amber/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1.5 text-sm text-warden-text-tertiary hover:text-warden-text-primary transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-warden-amber text-warden-bg-primary font-bold text-sm rounded-xl hover:bg-warden-amber-glow transition-colors flex items-center gap-2"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Ready */}
          {step === 2 && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-warden-teal/20 to-warden-teal/5 border border-warden-teal/30 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={36} className="text-warden-teal" />
              </div>
              <h1 className="text-2xl font-bold text-warden-text-primary mb-2">
                You&apos;re All Set
              </h1>
              <p className="text-sm text-warden-text-secondary max-w-sm mx-auto mb-4 leading-relaxed">
                Warden is now configured for <strong>{name}</strong>. Your
                autonomous supply chain co-pilot is ready to monitor, analyze, and
                protect your operations.
              </p>

              <div className="warden-card border border-warden-border p-4 mb-8 text-left max-w-xs mx-auto">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-warden-text-tertiary">Company</span>
                    <span className="text-warden-text-primary font-medium">
                      {name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warden-text-tertiary">Industry</span>
                    <span className="text-warden-text-primary">
                      {industry}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warden-text-tertiary">HQ</span>
                    <span className="text-warden-text-primary">
                      {hqCity}, {hqCountry}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-sm text-warden-text-tertiary hover:text-warden-text-primary transition-colors"
                >
                  <ArrowLeft size={14} /> Edit
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="px-8 py-3 bg-warden-amber text-warden-bg-primary font-bold text-sm rounded-xl hover:bg-warden-amber-glow transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-warden-bg-primary/30 border-t-warden-bg-primary rounded-full animate-spin" />
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
