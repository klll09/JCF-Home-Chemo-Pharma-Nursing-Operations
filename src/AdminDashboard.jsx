import { useState, useEffect, useRef } from "react";
import {
  Activity,
  RefreshCw,
  CalendarDays,
  FlaskConical,
  ClipboardList,
  UserCheck,
  Users,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Stethoscope,
  PlusCircle,
  ShieldAlert,
  Syringe,
  FileText,
  UserPlus,
  Zap,
  Circle,
  TrendingUp,
  BadgeCheck,
} from "lucide-react";

// ─── Seed Data ────────────────────────────────────────────────────────────────
const INITIAL_PATIENTS = [
  {
    id: "JC-P-26-8941",
    name: "Ramesh Damodar Kulkarni",
    age: 61,
    phone: "+91 98201 33847",
    diagnosis: "Stage III Adenocarcinoma — Protocol FOLFOX",
    doctor: "Dr. Suresh Mehta",
    riskTier: "High",
    status: "Pending Doc",
    createdAt: "Jun 23, 2026",
    notes: "Post-surgical patient — port-a-cath fitted June 12",
  },
  {
    id: "JC-P-26-7762",
    name: "Priya Ananthakrishnan",
    age: 47,
    phone: "+91 91234 56789",
    diagnosis: "Stage II Invasive Ductal Carcinoma — Protocol AC-T",
    doctor: "Dr. Nandini Joshi",
    riskTier: "Medium",
    status: "Ready to Match",
    createdAt: "Jun 24, 2026",
    notes: "Cycle 3 of 8 — tolerating well, mild nausea reported",
  },
  {
    id: "JC-P-26-6530",
    name: "Mohanlal Bhimsen Tiwari",
    age: 69,
    phone: "+91 77334 19902",
    diagnosis: "Stage IV Colorectal Carcinoma — Protocol XELOX",
    doctor: "Dr. Arvind Rao",
    riskTier: "Critical",
    status: "In Session",
    createdAt: "Jun 25, 2026",
    notes: "Active home session — Nurse Kavitha assigned, ETA completion 14:40",
  },
  {
    id: "JC-P-26-5811",
    name: "Sunita Vijaykumar Desai",
    age: 54,
    phone: "+91 98765 43210",
    diagnosis: "Stage II Cervical Carcinoma — Protocol Carboplatin/Paclitaxel",
    doctor: "Dr. Suresh Mehta",
    riskTier: "Medium",
    status: "Pending Doc",
    createdAt: "Jun 25, 2026",
    notes: "Awaiting signed treatment authorisation from oncologist",
  },
];

const DOCTORS = [
  "Dr. Suresh Mehta",
  "Dr. Nandini Joshi",
  "Dr. Arvind Rao",
  "Dr. Preethi Srinivasan",
  "Dr. Rajan Pillai",
];

const STATUS_CONFIG = {
  "Pending Doc": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  "Ready to Match": {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    dot: "bg-teal-400",
  },
  "In Session": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
    pulse: true,
  },
  Committed: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

const RISK_CONFIG = {
  Critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  High: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Medium: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  Low: { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" },
};

// ─── Sub-Components ────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Committed"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`}
      />
      {status}
    </span>
  );
}

function RiskPill({ tier }) {
  const cfg = RISK_CONFIG[tier] || RISK_CONFIG["Low"];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {tier}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, sub, accentClass, borderClass, trend }) {
  return (
    <div
      className={`bg-white rounded-xl border ${borderClass} p-4 flex flex-col gap-2 shadow-sm relative overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${accentClass}`}>
          <Icon size={16} className="opacity-80" />
        </div>
        {trend !== undefined && (
          <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">
            <TrendingUp size={9} />
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-800 leading-none tracking-tight">{value}</p>
        <p className="text-[11px] text-slate-500 mt-1 font-medium leading-snug">{label}</p>
      </div>
      <p className="text-[10px] text-slate-400 font-mono">{sub}</p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  // ── Ledger State
  const [patientLedger, setPatientLedger] = useState(INITIAL_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // ── DB Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState("Just now");
  const syncTimerRef = useRef(null);

  // ── Triage Counter (tracks 'Pending Doc' status count)
  const triageCount = patientLedger.filter((p) => p.status === "Pending Doc").length;
  const readyCount = patientLedger.filter((p) => p.status === "Ready to Match").length;
  const inSessionCount = patientLedger.filter((p) => p.status === "In Session").length;

  // ── Intake Form State
  const [form, setForm] = useState({
    name: "",
    age: "",
    phone: "",
    diagnosis: "",
    doctor: "",
    riskTier: "Medium",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [commitSuccess, setCommitSuccess] = useState(false);

  // ── Handlers
  const handleSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      setIsSyncing(false);
      setLastSynced("Just now");
    }, 2200);
  };

  useEffect(() => {
    return () => clearTimeout(syncTimerRef.current);
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const handleCommit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Patient full legal name is required."); return; }
    if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 120) {
      setFormError("Please enter a valid age between 1 and 120."); return;
    }
    if (!form.phone.trim()) { setFormError("Primary phone number is required."); return; }
    if (!form.diagnosis.trim()) { setFormError("Oncology classification / clinical notes are required."); return; }
    if (!form.doctor) { setFormError("Please assign a treating doctor."); return; }

    const seq = Math.floor(1000 + Math.random() * 8999);
    const newPatient = {
      id: `JC-P-26-${seq}`,
      name: form.name.trim(),
      age: Number(form.age),
      phone: form.phone.trim(),
      diagnosis: form.diagnosis.trim(),
      doctor: form.doctor,
      riskTier: form.riskTier,
      status: "Pending Doc",
      createdAt: "Jun 25, 2026",
      notes: form.notes.trim() || "No additional notes.",
    };

    setPatientLedger((prev) => [newPatient, ...prev]);
    setForm({ name: "", age: "", phone: "", diagnosis: "", doctor: "", riskTier: "Medium", notes: "" });
    setFormError("");
    setCommitSuccess(true);
    setTimeout(() => setCommitSuccess(false), 3000);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-50 flex flex-col font-sans">

      {/* ══ ZONE 1: HEADER ══════════════════════════════════════════════════════ */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-600 shadow-sm">
            <Syringe size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-extrabold text-[15px] tracking-widest uppercase leading-none">
                Jarurat Care
              </span>
              <span className="text-[9px] font-bold bg-teal-600 text-white px-1.5 py-0.5 rounded tracking-widest uppercase leading-none">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 leading-none tracking-wide">
              Command Deck v3.2 · Oncology Home-Care Logistics
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          {/* Sync indicator */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">
              {isSyncing ? "Syncing…" : `Last sync: ${lastSynced}`}
            </span>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isSyncing
                  ? "bg-teal-50 border-teal-200 text-teal-600 cursor-not-allowed"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 active:scale-95 cursor-pointer"
              }`}
            >
              <RefreshCw
                size={12}
                className={isSyncing ? "animate-spin text-teal-500" : "text-slate-400"}
              />
              <span className="flex items-center gap-1">
                <Circle
                  size={6}
                  className={`${isSyncing ? "fill-amber-400 text-amber-400 animate-pulse" : "fill-emerald-400 text-emerald-400"}`}
                />
                Live DB Sync
              </span>
            </button>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg">
            <CalendarDays size={13} className="text-teal-600" />
            <span className="text-xs font-semibold text-slate-700 font-mono">June 25, 2026</span>
          </div>

          {/* Admin Avatar */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AD</span>
            </div>
            <div className="leading-none">
              <p className="text-xs font-semibold text-slate-700">Admin</p>
              <p className="text-[10px] text-slate-400">Operations</p>
            </div>
          </div>
        </div>
      </header>

      {/* ══ ZONE 2: ANALYTICS STRIP ═════════════════════════════════════════════ */}
      <div className="px-6 pt-4 pb-3 shrink-0">
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            icon={Activity}
            label="Active In-Field Chemo Sessions"
            value={inSessionCount}
            sub="visits.status = 'InProgress'"
            accentClass="bg-emerald-100 text-emerald-600"
            borderClass="border-emerald-200"
            trend="+1 today"
          />
          <MetricCard
            icon={ClipboardList}
            label="Doctor Sign-off Auth Triage Queue"
            value={triageCount}
            sub="care_requests.status = 'Draft'"
            accentClass="bg-amber-100 text-amber-600"
            borderClass="border-amber-200"
          />
          <MetricCard
            icon={BadgeCheck}
            label="Unassigned Booking Capacity Intake"
            value={readyCount}
            sub="care_requests.status = 'DoctorApproved'"
            accentClass="bg-teal-100 text-teal-600"
            borderClass="border-teal-200"
          />
          <MetricCard
            icon={UserCheck}
            label="Active Standby Clinician Capacity"
            value={14}
            sub="nurses.availability_status = 'Available'"
            accentClass="bg-sky-100 text-sky-600"
            borderClass="border-sky-200"
            trend="3 zones"
          />
        </div>
      </div>

      {/* ══ ZONES 3 & 4: SPLIT WORKSPACE ════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden px-6 pb-4 grid grid-cols-12 gap-4">

        {/* ── ZONE 3: LEFT LEDGER (7/12) ───────────────────────────────────── */}
        <div className="col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Ledger Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <FlaskConical size={15} className="text-teal-600" />
              <span className="text-sm font-bold text-slate-800 tracking-tight">
                Oncology Patient Registry
              </span>
              <span className="ml-1 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full tabular-nums">
                {patientLedger.length} registered
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <Zap size={10} className="text-teal-400" />
              Real-time stream · auto-prepend on commit
            </div>
          </div>

          {/* Ledger Column Headers */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-slate-50 border-b border-slate-100 shrink-0">
            <span className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient / ID</span>
            <span className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnosis Protocol</span>
            <span className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Oncologist</span>
            <span className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk</span>
            <span className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
            <span className="col-span-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail</span>
          </div>

          {/* Ledger Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {patientLedger.map((patient, idx) => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(selectedPatient?.id === patient.id ? null : patient)}
                className={`grid grid-cols-12 gap-2 px-5 py-3 cursor-pointer transition-colors ${
                  selectedPatient?.id === patient.id
                    ? "bg-teal-50 border-l-2 border-teal-500"
                    : idx === 0 && patientLedger.length > INITIAL_PATIENTS.length
                    ? "bg-emerald-50/60 hover:bg-slate-50"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* Patient + ID */}
                <div className="col-span-3 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{patient.name}</p>
                  <p className="text-[10px] font-mono text-teal-600 mt-0.5">{patient.id}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Age {patient.age} · {patient.createdAt}</p>
                </div>

                {/* Diagnosis */}
                <div className="col-span-3 min-w-0 flex items-start">
                  <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{patient.diagnosis}</p>
                </div>

                {/* Doctor */}
                <div className="col-span-2 min-w-0 flex items-center">
                  <div>
                    <p className="text-[11px] text-slate-700 font-medium leading-tight truncate">{patient.doctor}</p>
                    <p className="text-[10px] text-slate-400">{patient.phone}</p>
                  </div>
                </div>

                {/* Risk */}
                <div className="col-span-1 flex items-center">
                  <RiskPill tier={patient.riskTier} />
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center">
                  <StatusPill status={patient.status} />
                </div>

                {/* Expand */}
                <div className="col-span-1 flex items-center justify-center">
                  <ChevronRight
                    size={14}
                    className={`text-slate-300 transition-transform ${selectedPatient?.id === patient.id ? "rotate-90 text-teal-500" : ""}`}
                  />
                </div>

                {/* Expanded Notes Row */}
                {selectedPatient?.id === patient.id && (
                  <div className="col-span-12 mt-1 pt-2 border-t border-teal-100">
                    <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-teal-100">
                      <FileText size={12} className="text-teal-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Clinical Notes</p>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{patient.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Ledger Footer */}
          <div className="px-5 py-2 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">
              Postgres seq: patient_registry · Ordered by created_at DESC
            </span>
            <span className="text-[10px] text-slate-400">
              Triage pending: <strong className="text-amber-600">{triageCount}</strong> · Ready: <strong className="text-teal-600">{readyCount}</strong>
            </span>
          </div>
        </div>

        {/* ── ZONE 4: RIGHT INTAKE FORM (5/12) ─────────────────────────────── */}
        <div className="col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Form Header */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 shrink-0">
            <UserPlus size={15} className="text-teal-600" />
            <div>
              <span className="text-sm font-bold text-slate-800">Central Patient Intake</span>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Manual registry commit · Admin-authorised onboarding</p>
            </div>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form onSubmit={handleCommit} className="flex flex-col gap-4" noValidate>

              {/* Patient Legal Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                  Patient Full Legal Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Rajiv Shankar Pillai"
                  className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder:text-slate-300 transition"
                />
              </div>

              {/* Age + Phone row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                    Age <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleFormChange}
                    placeholder="e.g. 58"
                    min={1}
                    max={120}
                    className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder:text-slate-300 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                    Primary Phone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    placeholder="+91 98XXXXXXXX"
                    className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder:text-slate-300 transition"
                  />
                </div>
              </div>

              {/* Oncology Classification */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                  Oncology Classification / Clinical Notes <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="diagnosis"
                  value={form.diagnosis}
                  onChange={handleFormChange}
                  placeholder="e.g. Stage III Non-Small Cell Lung Carcinoma — Protocol Carboplatin/Pemetrexed"
                  rows={3}
                  className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder:text-slate-300 resize-none transition"
                />
              </div>

              {/* Assigning Doctor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                  Assigning Oncologist <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Stethoscope size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    name="doctor"
                    value={form.doctor}
                    onChange={handleFormChange}
                    className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent appearance-none cursor-pointer transition"
                  >
                    <option value="">— Select treating doctor —</option>
                    {DOCTORS.map((doc) => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Risk Tier */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-2">
                  Risk Tier Classification
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["Low", "Medium", "High", "Critical"].map((tier) => {
                    const cfg = RISK_CONFIG[tier];
                    const isSelected = form.riskTier === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, riskTier: tier }))}
                        className={`py-2 rounded-lg text-[11px] font-bold border transition-all ${
                          isSelected
                            ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm ring-2 ${
                                tier === "Critical"
                                  ? "ring-red-300"
                                  : tier === "High"
                                  ? "ring-orange-300"
                                  : tier === "Medium"
                                  ? "ring-sky-300"
                                  : "ring-slate-300"
                              }`
                            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tier}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                  Operational Notes
                  <span className="ml-2 text-[10px] font-normal text-slate-400 normal-case tracking-normal">Optional</span>
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  placeholder="Port-a-cath status, mobility constraints, caregiver present, preferred time window…"
                  rows={2}
                  className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder:text-slate-300 resize-none transition"
                />
              </div>

              {/* Error Message */}
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">{formError}</p>
                </div>
              )}

              {/* Success Message */}
              {commitSuccess && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    Patient committed to registry. Row prepended to ledger — triage queue updated.
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <PlusCircle size={15} />
                Commit Registry Row
              </button>
            </form>
          </div>

          {/* Form Footer info strip */}
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldAlert size={11} className="text-slate-400" />
              <p className="text-[10px] text-slate-400">
                Registry commits auto-assign{" "}
                <span className="font-mono font-semibold text-amber-600">status = Pending Doc</span>
                {" "}and trigger sign-off triage counter.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}