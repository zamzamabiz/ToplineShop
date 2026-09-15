"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Upload, AlertTriangle, CheckCircle2, Clock, Server,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Static mock data — no real sources, credentials, or ingestion
// ---------------------------------------------------------------------------

const MOCK_SOURCES = [
  { id: "s-001", name: "Global Trade Registry",    type: "JSON Feed",   status: "ACTIVE" },
  { id: "s-002", name: "Asia-Pacific Customs API", type: "REST API",    status: "ACTIVE" },
  { id: "s-003", name: "EU Trade Data Feed",       type: "CSV Import",  status: "ATTENTION" },
  { id: "s-004", name: "Americas Logistics Index", type: "SFTP Drop",   status: "PAUSED" },
];

const IMPORT_TYPES   = ["File Import", "API Pull", "SFTP Sync", "Manual Upload"];
const FILE_FORMATS   = ["CSV", "XLSX", "JSON", "XML", "NDJSON"];
const MAPPING_PROFILES = [
  "Standard Trade v2",
  "APAC Custom v1",
  "EU Harmonised v3",
  "Americas HS-10 v1",
];
const VALIDATION_PROFILES = [
  "Strict (0 % error tolerance)",
  "Standard (5 % error tolerance)",
  "Lenient (10 % error tolerance)",
];
const EXPECTED_COUNTS = [
  "< 10,000 records",
  "10,000 – 50,000 records",
  "50,000 – 200,000 records",
  "> 200,000 records",
];

const SERVER_STEPS = [
  { label: "File / API receive & deduplication",      note: "Requires backend storage service" },
  { label: "Schema detection & type inference",        note: "Requires refinery engine" },
  { label: "Field mapping & column alignment",         note: "Requires mapping profile service" },
  { label: "Record validation & quarantine assignment", note: "Requires validation service + queue" },
  { label: "Quarantine review workflow",               note: "Requires review API + Auth/RBAC" },
  { label: "Publish to governed data store",           note: "Requires G2: Auth/RBAC + database access" },
];

const DISABLED_ACTIONS = [
  { label: "Start Import",           note: "Requires backend ingestion engine" },
  { label: "Upload File",            note: "Requires backend file receiver" },
  { label: "Validate Records",       note: "Requires validation service" },
  { label: "Submit for Processing",  note: "Requires queue + worker" },
  { label: "Schedule Import",        note: "Requires cron / scheduler backend" },
  { label: "Cancel & Reset",         note: "Requires session + state management" },
];

const STEPS = [
  { id: 1, label: "Select Source" },
  { id: 2, label: "Configure Import" },
  { id: 3, label: "Review" },
  { id: 4, label: "Server Processing" },
];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  ACTIVE:    { color: "#16a34a", bg: "#dcfce7" },
  ATTENTION: { color: "#b45309", bg: "#fef3c7" },
  PAUSED:    { color: "var(--text-muted)", bg: "var(--surface-muted)" },
};

// ---------------------------------------------------------------------------
// Sub-components for each step
// ---------------------------------------------------------------------------

function MockSelect({
  label, value, options, onChange, id,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; id: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
        <span
          className="ml-2 rounded px-1.5 py-0.5 text-[10px]"
          style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
        >
          mock selection
        </span>
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2"
        style={{
          backgroundColor: "var(--surface-secondary)",
          borderColor: "var(--border-default)",
          color: "var(--text-primary)",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

interface Source { id: string; name: string; type: string; status: string }

function Step1SelectSource({
  sources, selectedId, onSelect,
}: { sources: Source[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-1">Select a trade data source</h3>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Choose which configured source this import will draw from. In production this list is
          dynamically loaded from the sources database.
        </p>
      </div>
      <div className="space-y-2" role="radiogroup" aria-label="Select source">
        {sources.map((src) => {
          const style = STATUS_STYLE[src.status] ?? STATUS_STYLE.PAUSED;
          const selected = src.id === selectedId;
          return (
            <button
              key={src.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(src.id)}
              className="w-full flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                borderColor: selected ? "var(--brand-primary)" : "var(--border-default)",
                backgroundColor: selected ? "var(--surface-secondary)" : "var(--surface-primary)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                  style={{
                    borderColor: selected ? "var(--brand-primary)" : "var(--border-default)",
                  }}
                >
                  {selected && (
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: "var(--brand-primary)" }}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{src.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{src.type}</div>
                </div>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
                style={{ backgroundColor: style.bg, color: style.color }}
              >
                {src.status}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Source status reflects the last known state from mock data. Real statuses require a live
        backend connection.
      </p>
    </div>
  );
}

interface Step2Props {
  source: Source;
  importType: string; onImportType: (v: string) => void;
  fileFormat: string; onFileFormat: (v: string) => void;
  mappingProfile: string; onMappingProfile: (v: string) => void;
  validationProfile: string; onValidationProfile: (v: string) => void;
  expectedCount: string; onExpectedCount: (v: string) => void;
}

function Step2Configure({
  source,
  importType, onImportType,
  fileFormat, onFileFormat,
  mappingProfile, onMappingProfile,
  validationProfile, onValidationProfile,
  expectedCount, onExpectedCount,
}: Step2Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-1">Configure import parameters</h3>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Source: <strong>{source.name}</strong>. All fields below are planning inputs — no file is
          uploaded and no API call is made.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MockSelect
          id="import-type" label="Import Type"
          value={importType} options={IMPORT_TYPES} onChange={onImportType}
        />
        <MockSelect
          id="file-format" label="File / API Format"
          value={fileFormat} options={FILE_FORMATS} onChange={onFileFormat}
        />
        <MockSelect
          id="mapping-profile" label="Mapping Profile"
          value={mappingProfile} options={MAPPING_PROFILES} onChange={onMappingProfile}
        />
        <MockSelect
          id="validation-profile" label="Validation Profile"
          value={validationProfile} options={VALIDATION_PROFILES} onChange={onValidationProfile}
        />
        <div className="sm:col-span-2">
          <MockSelect
            id="expected-count" label="Expected Record Count"
            value={expectedCount} options={EXPECTED_COUNTS} onChange={onExpectedCount}
          />
        </div>
      </div>
      <div
        className="rounded-lg border px-4 py-3"
        style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border-default)" }}
        role="note"
      >
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          In production, import type and file format drive the refinery parser. Mapping and validation
          profiles are stored in the platform database and applied server-side. These fields are
          read-only planning inputs in this frontend preview.
        </p>
      </div>
    </div>
  );
}

interface Step3Props {
  source: Source;
  importType: string; fileFormat: string;
  mappingProfile: string; validationProfile: string; expectedCount: string;
}

function Step3Review({ source, importType, fileFormat, mappingProfile, validationProfile, expectedCount }: Step3Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-1">Review import configuration</h3>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Confirm the configuration below before viewing the planned server processing steps. In
          production, this summary would be sent to the backend ingestion API.
        </p>
      </div>
      <div
        className="rounded-xl border divide-y"
        style={{ borderColor: "var(--border-default)", "--tw-divide-opacity": "1" } as React.CSSProperties}
      >
        {[
          { label: "Source",              value: source.name },
          { label: "Source Type",         value: source.type },
          { label: "Source Status",       value: source.status },
          { label: "Import Type",         value: importType },
          { label: "File / API Format",   value: fileFormat },
          { label: "Mapping Profile",     value: mappingProfile },
          { label: "Validation Profile",  value: validationProfile },
          { label: "Expected Record Count", value: expectedCount },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
            <span className="text-xs font-medium text-right" style={{ color: "var(--text-primary)" }}>{value}</span>
          </div>
        ))}
      </div>
      <div
        className="rounded-lg border px-4 py-3 flex items-start gap-2"
        style={{ backgroundColor: "#fffbeb", borderColor: "#fcd34d" }}
        role="note"
      >
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#b45309" }} aria-hidden="true" />
        <p className="text-xs" style={{ color: "#92400e" }}>
          This is a read-only review summary. No data has been submitted. Proceeding to the next step
          shows the planned server workflow — no action is triggered.
        </p>
      </div>
    </div>
  );
}

function Step4ServerProcessing({ source }: { source: Source }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold mb-1">Planned server processing</h3>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Below is the processing pipeline that will execute server-side once backend implementation,
          database access, and Auth/RBAC are approved. Source: <strong>{source.name}</strong>.
        </p>
      </div>

      {/* Processing pipeline */}
      <div className="space-y-2">
        {SERVER_STEPS.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center shrink-0 mt-0.5">
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-muted)" }}
              >
                {i + 1}
              </div>
              {i < SERVER_STEPS.length - 1 && (
                <div className="w-0.5 h-4" style={{ backgroundColor: "var(--border-default)" }} />
              )}
            </div>
            <div className="pb-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{s.label}</span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-muted)" }}
                >
                  <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                  Planned
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Backend requirement note */}
      <div
        className="rounded-lg border px-4 py-3 flex items-start gap-2"
        style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border-default)" }}
        role="note"
      >
        <Server className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Production import requires server-side implementation of all six pipeline stages, database
          write access, Auth/RBAC tenant enforcement, audit logging, and quarantine workflow services.
          No pipeline stage has been implemented in this frontend preview.
        </p>
      </div>

      {/* Disabled future actions */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
          Import Actions — Backend / Auth required
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DISABLED_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled
              aria-disabled="true"
              title={action.note}
              className="flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-medium opacity-40 cursor-not-allowed"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--surface-secondary)",
                color: "var(--text-muted)",
              }}
            >
              <span>{action.label}</span>
              <span className="text-[10px] font-normal text-center leading-tight">{action.note}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function TdrImportWorkflowPanel({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedSourceId, setSelectedSourceId] = useState("s-001");
  const [importType, setImportType] = useState(IMPORT_TYPES[0]);
  const [fileFormat, setFileFormat] = useState(FILE_FORMATS[0]);
  const [mappingProfile, setMappingProfile] = useState(MAPPING_PROFILES[0]);
  const [validationProfile, setValidationProfile] = useState(VALIDATION_PROFILES[1]);
  const [expectedCount, setExpectedCount] = useState(EXPECTED_COUNTS[0]);
  const closeRef = useRef<HTMLButtonElement>(null);

  const selectedSource = MOCK_SOURCES.find((s) => s.id === selectedSourceId) ?? MOCK_SOURCES[0];

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const nextLabel =
    step === 3 ? "View Server Processing" :
    step === 4 ? "Start Import — Backend Required" :
    "Next";

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tdr-import-wf-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-10 flex flex-col rounded-2xl border shadow-2xl w-full max-w-2xl"
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-default)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 shrink-0" style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
            <h2 id="tdr-import-wf-title" className="text-base font-semibold">
              Import Workflow Preview
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close import workflow preview"
            className="rounded-md p-1.5 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Amber safety banner */}
        <div
          className="mx-6 mt-4 rounded-lg border px-4 py-3 flex items-start gap-3 shrink-0"
          style={{ backgroundColor: "#fffbeb", borderColor: "#fcd34d" }}
          role="note"
          aria-label="Preview-only warning"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#b45309" }} aria-hidden="true" />
          <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
            <strong>Frontend preview only.</strong> No files are uploaded, no ingestion is started,
            and no backend or database is connected. Production import requires server-side
            implementation, Auth/RBAC, validation services, and audit controls gated behind #FDD G1
            and G2.
          </p>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5 pb-3 shrink-0">
          <div className="flex items-start">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-start" style={{ flex: i < STEPS.length - 1 ? "1 1 0%" : undefined }}>
                <div className="flex flex-col items-center">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors"
                    style={{
                      backgroundColor: step >= s.id ? "var(--brand-primary)" : "var(--surface-secondary)",
                      color: step >= s.id ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {step > s.id ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : s.id}
                  </div>
                  <span
                    className="mt-1 text-center whitespace-nowrap"
                    style={{
                      fontSize: "10px",
                      color: step >= s.id ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="h-0.5 flex-1 mt-3.5 mx-2"
                    style={{
                      backgroundColor: step > s.id ? "var(--brand-primary)" : "var(--border-default)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-2">
          {step === 1 && (
            <Step1SelectSource
              sources={MOCK_SOURCES}
              selectedId={selectedSourceId}
              onSelect={setSelectedSourceId}
            />
          )}
          {step === 2 && (
            <Step2Configure
              source={selectedSource}
              importType={importType}       onImportType={setImportType}
              fileFormat={fileFormat}       onFileFormat={setFileFormat}
              mappingProfile={mappingProfile}     onMappingProfile={setMappingProfile}
              validationProfile={validationProfile} onValidationProfile={setValidationProfile}
              expectedCount={expectedCount}       onExpectedCount={setExpectedCount}
            />
          )}
          {step === 3 && (
            <Step3Review
              source={selectedSource}
              importType={importType}
              fileFormat={fileFormat}
              mappingProfile={mappingProfile}
              validationProfile={validationProfile}
              expectedCount={expectedCount}
            />
          )}
          {step === 4 && <Step4ServerProcessing source={selectedSource} />}
        </div>

        {/* Footer nav */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between shrink-0"
          style={{ borderColor: "var(--border-default)" }}
        >
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-4 py-2 text-sm rounded-lg border font-medium transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
            }}
          >
            Previous
          </button>

          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Step {step} of {STEPS.length}
          </span>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              className="px-4 py-2 text-sm rounded-lg font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
              style={{ backgroundColor: "var(--brand-primary)", color: "#fff" }}
            >
              {nextLabel}
            </button>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Start Import requires backend implementation, database access, and Auth/RBAC"
              className="px-4 py-2 text-sm rounded-lg font-medium opacity-40 cursor-not-allowed"
              style={{
                backgroundColor: "var(--surface-secondary)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-default)",
              }}
            >
              Start Import — Backend Required
            </button>
          )}
        </div>

        {/* Footer note */}
        <div
          className="px-6 pb-4 shrink-0"
        >
          <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
            Preview only — no import is configured, no file is uploaded, no ingestion is started.
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
