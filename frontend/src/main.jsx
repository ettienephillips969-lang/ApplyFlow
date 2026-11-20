import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const configuredApiBaseUrl = document.querySelector('meta[name="applyflow-api-base-url"]')?.content.trim();
const apiBaseUrl = configuredApiBaseUrl || `${window.location.protocol}//${window.location.hostname}:3000`;
const APPLICATIONS_URL = new URL("/api/job_applications", apiBaseUrl).toString();
const APPLICATION_DRAG_TYPE = "application/x-applyflow-job-application";

const statusStyles = {
  saved: "bg-status-saved text-status-saved-text ring-status-saved-border",
  applied: "bg-status-applied text-status-applied-text ring-status-applied-border",
  interview: "bg-status-interview text-status-interview-text ring-status-interview-border",
  completed: "bg-status-completed text-status-completed-text ring-status-completed-border",
};

const statusFilters = [
  { value: "all", label: "All" },
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "completed", label: "Completed" },
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ status }) {
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        statusStyles[status] ?? "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      <span className="mr-1.5 size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function SummaryCard({ label, value, detail, accent }) {
  return (
    <article className="rounded-2xl border border-border-ui bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className={`mt-1 size-2.5 rounded-full ${accent}`} aria-hidden="true" />
      </div>
      <p className="mt-4 text-xs text-slate-400">{detail}</p>
    </article>
  );
}

function ApplicationAnalytics({ counts, total }) {
  return (
    <section className="rounded-2xl border border-border-ui bg-surface p-5 shadow-sm sm:p-6" aria-labelledby="analytics-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="analytics-heading" className="font-semibold text-slate-900">Application breakdown</h2>
          <p className="mt-1 text-sm text-slate-500">Your pipeline by current status</p>
        </div>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-text">{total} total</span>
      </div>
      {total === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-border-ui bg-surface-subtle px-4 py-8 text-center text-sm text-slate-500">
          Add an application to see your status breakdown.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {statusFilters.slice(1).map((status) => {
            const count = counts[status.value];
            const percentage = (count / total) * 100;
            return (
              <div key={status.value}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status.value} />
                  </div>
                  <span className="font-medium text-slate-700">{count} <span className="text-slate-400">({Math.round(percentage)}%)</span></span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-surface-muted"
                  role="progressbar"
                  aria-label={`${status.label} applications`}
                  aria-valuemin="0"
                  aria-valuemax={total}
                  aria-valuenow={count}
                >
                  <div
                    className={`h-full rounded-full ${
                      status.value === "saved" ? "bg-status-saved-text" :
                        status.value === "applied" ? "bg-brand" :
                          status.value === "interview" ? "bg-accent-amber" : "bg-accent-teal"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecentApplications({ applications }) {
  const recentApplications = useMemo(() => [...applications]
    .sort((first, second) => {
      const firstCreated = Date.parse(first.created_at ?? first.applied_at ?? "") || 0;
      const secondCreated = Date.parse(second.created_at ?? second.applied_at ?? "") || 0;
      return secondCreated - firstCreated;
    })
    .slice(0, 5), [applications]);

  return (
    <section className="rounded-2xl border border-border-ui bg-surface p-5 shadow-sm sm:p-6" aria-labelledby="recent-heading">
      <div>
        <h2 id="recent-heading" className="font-semibold text-slate-900">Recent applications</h2>
        <p className="mt-1 text-sm text-slate-500">The latest opportunities in your tracker</p>
      </div>
      {recentApplications.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border-ui bg-surface-subtle px-4 py-8 text-center text-sm text-slate-500">
          Your recent applications will appear here when you add one.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {recentApplications.map((application) => (
            <li key={application.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{application.company_name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{application.job_title}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge status={application.status} />
                <span className="text-xs text-slate-400">
                  {application.applied_at ? formatDate(application.applied_at) : "Date not provided"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading applications">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-2xl bg-skeleton" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-skeleton" />
      <span className="sr-only">Loading your applications…</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="mt-5 text-base font-semibold text-slate-900">Your next opportunity starts here</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Applications you track will appear here. Add your first opportunity to start building momentum.
      </p>
    </div>
  );
}

function ApplicationActions({ application, onEdit, onDelete, deleting }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onEdit(application)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
      <button type="button" onClick={() => onDelete(application)} disabled={deleting} className="text-sm font-medium text-rose-600 hover:text-rose-800 disabled:opacity-50">
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}

function ApplicationsList({ applications, onEdit, onDelete, deletingId }) {
  return (
    <>
      <div className="divide-y divide-slate-100 md:hidden">
        {applications.map((application) => (
          <article key={application.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-900">{application.company_name}</h3>
                <p className="mt-1 truncate text-sm text-slate-500">{application.job_title}</p>
              </div>
              <StatusBadge status={application.status} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">Applied {formatDate(application.applied_at)}</p>
              <ApplicationActions application={application} onEdit={onEdit} onDelete={onDelete} deleting={deletingId === application.id} />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="border-y border-slate-100 bg-slate-50/70">
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3.5">Company</th>
              <th className="px-6 py-3.5">Job title</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Application date</th>
              <th className="px-6 py-3.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((application) => (
              <tr key={application.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-6 py-4 font-medium text-slate-800">{application.company_name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{application.job_title}</td>
                <td className="px-6 py-4"><StatusBadge status={application.status} /></td>
                <td className="px-6 py-4 text-sm text-slate-500">{formatDate(application.applied_at)}</td>
                <td className="px-6 py-4"><ApplicationActions application={application} onEdit={onEdit} onDelete={onDelete} deleting={deletingId === application.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function KanbanBoard({ applications, onEdit, onDelete, onStatusChange, deletingId, movingId }) {
  const [dragOverStatus, setDragOverStatus] = useState(null);

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
      <p id="kanban-move-help" className="sr-only">
        Drag an application card to another status column to move it. You can also use the Move to selector on each card.
      </p>
      {statusFilters.slice(1).map((column) => {
        const columnApplications = applications.filter((application) => application.status === column.value);

        return (
          <section
            key={column.value}
            data-status={column.value}
            aria-labelledby={`kanban-${column.value}`}
            onDragOver={(event) => {
              if (movingId !== null || !event.dataTransfer.types.includes(APPLICATION_DRAG_TYPE)) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDragOverStatus(column.value);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setDragOverStatus(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragOverStatus(null);
              if (movingId !== null) return;

              const applicationId = event.dataTransfer.getData(APPLICATION_DRAG_TYPE);
              const destinationStatus = event.currentTarget.dataset.status;
              const application = applications.find((item) => String(item.id) === applicationId);
              if (application && destinationStatus) onStatusChange(application, destinationStatus);
            }}
            className={`min-w-0 rounded-2xl p-3 transition-colors sm:p-4 ${
              dragOverStatus === column.value
                ? "bg-indigo-50 ring-2 ring-inset ring-indigo-300"
                : "bg-slate-50"
            }`}
          >
            <header className="mb-3 flex items-center justify-between gap-2">
              <h3 id={`kanban-${column.value}`} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className={`size-2 rounded-full ${
                  column.value === "saved" ? "bg-status-saved-text" :
                    column.value === "applied" ? "bg-brand" :
                      column.value === "interview" ? "bg-accent-amber" : "bg-accent-teal"
                }`} aria-hidden="true" />
                {column.label}
              </h3>
              <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                {columnApplications.length}
              </span>
            </header>

            <div className="space-y-3">
              {columnApplications.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-surface/60 px-3 py-5 text-center text-xs text-slate-400">
                  No applications here
                </p>
              ) : columnApplications.map((application) => (
                <article
                  key={application.id}
                  draggable={movingId === null}
                  aria-describedby="kanban-move-help"
                  onDragStart={(event) => {
                    if (movingId !== null) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData(APPLICATION_DRAG_TYPE, String(application.id));
                  }}
                  onDragEnd={() => setDragOverStatus(null)}
                  className={`rounded-xl border border-slate-200/80 bg-surface p-4 shadow-sm shadow-slate-200/40 ${
                    movingId === null ? "cursor-grab active:cursor-grabbing" : "opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-slate-900">{application.company_name}</h4>
                      <p className="mt-1 break-words text-sm text-slate-600">{application.job_title}</p>
                    </div>
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="mt-3 text-xs text-slate-400">Applied {formatDate(application.applied_at)}</p>

                  <label className="mt-4 block text-xs font-medium text-slate-500">
                    Move to
                    <select
                      value={application.status}
                      onChange={(event) => onStatusChange(application, event.target.value)}
                      disabled={movingId !== null}
                      aria-label={`Move ${application.company_name} application to another status`}
                      aria-describedby="kanban-move-help"
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-surface px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-wait disabled:opacity-60"
                    >
                      {statusFilters.slice(1).map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                    {movingId === application.id && <span className="mt-1 block text-indigo-600">Saving status...</span>}
                  </label>

                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <ApplicationActions
                      application={application}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      deleting={deletingId === application.id}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ViewSwitcher({ view, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1" aria-label="Application view">
      {[{ value: "list", label: "List" }, { value: "kanban", label: "Kanban" }].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={view === option.value}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            view === option.value ? "bg-surface text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ApplicationFilters({ search, onSearchChange, status, onStatusChange, sort, onSortChange, counts }) {
  return (
    <div className="border-t border-slate-100 px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-sm">
          <span className="sr-only">Search by company or job title</span>
          <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.7" />
            <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search company or job title"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-surface focus:ring-4 focus:ring-indigo-100"
          />
        </label>

        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 lg:pb-0" aria-label="Filter by status">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onStatusChange(filter.value)}
              aria-pressed={status === filter.value}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                status === filter.value
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {filter.label}
              <span className={`rounded-md px-1.5 py-0.5 text-xs ${status === filter.value ? "bg-surface text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                {counts[filter.value]}
              </span>
            </button>
          ))}
        </div>

        <label className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
          <span className="whitespace-nowrap">Sort by</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label="Sort applications"
            className="rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="company-asc">Company name A-Z</option>
            <option value="company-desc">Company name Z-A</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function NoSearchResults() {
  return (
    <div className="px-6 py-14 text-center">
      <h3 className="font-semibold text-slate-900">No applications match your search</h3>
      <p className="mt-2 text-sm text-slate-500">Try a different company or job title, or choose another status filter.</p>
    </div>
  );
}

const blankApplication = {
  company_name: "",
  job_title: "",
  job_url: "",
  status: "saved",
  notes: "",
  applied_at: "",
};

function ApplicationForm({ application, onClose, onSaved }) {
  const [values, setValues] = useState(() => ({
    ...blankApplication,
    ...(application
      ? {
          company_name: application.company_name ?? "",
          job_title: application.job_title ?? "",
          job_url: application.job_url ?? "",
          status: application.status ?? "saved",
          notes: application.notes ?? "",
          applied_at: application.applied_at ?? "",
        }
      : {}),
  }));
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [saving, setSaving] = useState(false);
  const editing = Boolean(application);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function errorFor(field) {
    const messages = errors[field];
    if (!messages) return "";
    return Array.isArray(messages) ? messages.join(", ") : messages;
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setRequestError("");

    try {
      const response = await fetch(
        editing ? `${APPLICATIONS_URL}/${application.id}` : APPLICATIONS_URL,
        {
          method: editing ? "PATCH" : "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ job_application: values }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 422 && payload.errors) {
          setErrors(payload.errors);
        } else {
          setRequestError(payload.error || "We couldn’t save this application. Please try again.");
        }
        return;
      }

      onSaved(editing ? "Application updated." : "Application added.");
    } catch {
      setRequestError("Couldn’t reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function inputClass(field) {
    return `mt-1.5 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 ${errorFor(field) ? "border-rose-300" : "border-slate-200"}`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="application-form-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-2xl sm:max-w-xl sm:rounded-3xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <h2 id="application-form-title" className="text-lg font-semibold text-slate-900">
              {editing ? "Edit application" : "Add application"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Keep the details of this opportunity in one place.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
          {requestError && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{requestError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Company name <span className="text-rose-500">*</span>
              <input name="company_name" value={values.company_name} onChange={updateField} required autoFocus className={inputClass("company_name")} aria-invalid={Boolean(errorFor("company_name"))} />
              {errorFor("company_name") && <span className="mt-1 block text-xs text-rose-600">{errorFor("company_name")}</span>}
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Job title <span className="text-rose-500">*</span>
              <input name="job_title" value={values.job_title} onChange={updateField} required className={inputClass("job_title")} aria-invalid={Boolean(errorFor("job_title"))} />
              {errorFor("job_title") && <span className="mt-1 block text-xs text-rose-600">{errorFor("job_title")}</span>}
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Job URL
            <input name="job_url" type="url" value={values.job_url} onChange={updateField} placeholder="https://example.com/careers/role" className={inputClass("job_url")} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Status
              <select name="status" value={values.status} onChange={updateField} className={inputClass("status")}>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="completed">Completed</option>
              </select>
              {errorFor("status") && <span className="mt-1 block text-xs text-rose-600">{errorFor("status")}</span>}
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Application date
              <input name="applied_at" type="date" value={values.applied_at} onChange={updateField} className={inputClass("applied_at")} />
              {errorFor("applied_at") && <span className="mt-1 block text-xs text-rose-600">{errorFor("applied_at")}</span>}
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea name="notes" rows="3" value={values.notes} onChange={updateField} placeholder="Add a few details to remember..." className={`${inputClass("notes")} resize-y`} />
            {errorFor("notes") && <span className="mt-1 block text-xs text-rose-600">{errorFor("notes")}</span>}
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-wait disabled:opacity-60">
              {saving ? "Saving..." : editing ? "Save changes" : "Add application"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [activeApplication, setActiveApplication] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [movingId, setMovingId] = useState(null);
  const moveRequestLock = useRef(false);
  const [feedback, setFeedback] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("list");
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");

  useEffect(() => {
    const controller = new AbortController();

    async function loadApplications() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(APPLICATIONS_URL, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`The server returned an error (${response.status}).`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("The applications response was not in the expected format.");
        }

        setApplications(data);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "We couldn’t load your applications. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadApplications();
    return () => controller.abort();
  }, [reload]);

  function openAddForm() {
    setActiveApplication(null);
    setShowForm(true);
  }

  function openEditForm(application) {
    setActiveApplication(application);
    setShowForm(true);
  }

  function handleSaved(message) {
    setShowForm(false);
    setActiveApplication(null);
    setFeedback({ type: "success", message });
    setReload((value) => value + 1);
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      nextTheme === "dark" ? "#14131c" : "#f7f6fb"
    );

    try {
      localStorage.setItem("applyflow-theme", nextTheme);
    } catch (_) {
      // The current theme remains active for this page even if storage is unavailable.
    }
  }

  async function deleteApplication(application) {
    const confirmed = window.confirm(`Delete the application for ${application.job_title} at ${application.company_name}?`);
    if (!confirmed) return;

    setDeletingId(application.id);
    setFeedback(null);

    try {
      const response = await fetch(`${APPLICATIONS_URL}/${application.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || `The server returned an error (${response.status}).`);
      }

      setFeedback({ type: "success", message: "Application deleted." });
      setReload((value) => value + 1);
    } catch (requestError) {
      setFeedback({
        type: "error",
        message: requestError.message || "Couldn’t delete this application. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function moveApplication(application, status) {
    if (status === application.status || moveRequestLock.current) return;

    moveRequestLock.current = true;
    setMovingId(application.id);
    setFeedback(null);

    try {
      const response = await fetch(`${APPLICATIONS_URL}/${application.id}`, {
        method: "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ job_application: { status } }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const validationMessage = Object.values(payload.errors ?? {}).flat().join(" ");
        throw new Error(payload.error || validationMessage || `The server returned an error (${response.status}).`);
      }

      const statusLabel = statusFilters.find((filter) => filter.value === status)?.label ?? status;
      setFeedback({ type: "success", message: `Moved ${application.company_name} to ${statusLabel}.` });
      setAnnouncement(`${application.company_name} moved to ${statusLabel}.`);
      setReload((value) => value + 1);
    } catch (requestError) {
      setAnnouncement(`${application.company_name} was not moved. ${requestError.message || "The status update failed."}`);
      setFeedback({
        type: "error",
        message: requestError.message || "Couldn’t update the application status. Please try again.",
      });
    } finally {
      moveRequestLock.current = false;
      setMovingId(null);
    }
  }

  const statusCounts = useMemo(() => {
    const counts = { all: applications.length, saved: 0, applied: 0, interview: 0, completed: 0 };
    applications.forEach((application) => {
      if (Object.hasOwn(counts, application.status)) counts[application.status] += 1;
    });
    return counts;
  }, [applications]);

  const visibleApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchingApplications = applications.filter((application) => {
      const matchesStatus = selectedStatus === "all" || application.status === selectedStatus;
      const company = (application.company_name ?? "").toLowerCase();
      const title = (application.job_title ?? "").toLowerCase();
      const matchesSearch = !normalizedSearch || company.includes(normalizedSearch) || title.includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });

    matchingApplications.sort((first, second) => {
      if (sort === "company-asc" || sort === "company-desc") {
        const comparison = (first.company_name ?? "").localeCompare(second.company_name ?? "", undefined, { sensitivity: "base" });
        return sort === "company-asc" ? comparison : -comparison;
      }

      const firstDate = first.applied_at ? Date.parse(first.applied_at) : Number.NaN;
      const secondDate = second.applied_at ? Date.parse(second.applied_at) : Number.NaN;
      if (Number.isNaN(firstDate)) return Number.isNaN(secondDate) ? 0 : 1;
      if (Number.isNaN(secondDate)) return -1;
      return sort === "newest" ? secondDate - firstDate : firstDate - secondDate;
    });

    return matchingApplications;
  }, [applications, search, selectedStatus, sort]);

  const savedCount = statusCounts.saved;
  const appliedCount = statusCounts.applied;
  const interviewCount = statusCounts.interview;
  const completedCount = statusCounts.completed;

  return (
    <main className="min-h-screen bg-page px-4 py-5 text-slate-900 sm:px-7 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
        <header className="flex items-center justify-between border-b border-slate-200/80 pb-5">
          <a href="#dashboard" className="flex items-center gap-3" aria-label="ApplyFlow home">
            <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm shadow-indigo-200">A</span>
            <span className="text-lg font-semibold tracking-tight">ApplyFlow</span>
          </a>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Dark theme"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              aria-pressed={theme === "dark"}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-surface text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                  <path d="M20.4 15.3A8.5 8.5 0 0 1 8.7 3.6 8.5 8.5 0 1 0 20.4 15.3Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-surface px-3 py-1.5 text-xs font-medium text-slate-500 lg:flex">
              <span className="size-2 rounded-full bg-accent-teal" />
              Job search workspace
            </div>
          </div>
        </header>

        {feedback && (
          <div className={`mt-5 flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm ${feedback.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`} role={feedback.type === "error" ? "alert" : "status"}>
            <span>{feedback.message}</span>
            <button type="button" onClick={() => setFeedback(null)} className="font-semibold underline underline-offset-2">Dismiss</button>
          </div>
        )}

        <section id="dashboard" className="pb-7 pt-8 sm:pb-8 sm:pt-9">
          <p className="text-sm font-semibold text-brand-text">Your workspace</p>
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Application overview</h1>
              <p className="mt-2 text-sm text-slate-500 sm:text-base">A clear view of every opportunity and your next step.</p>
            </div>
            <div className="flex items-center gap-4">
              {!loading && !error && <p className="text-sm text-slate-400">
                {applications.length} {applications.length === 1 ? "application" : "applications"} tracked
              </p>}
              <button
                type="button"
                onClick={openAddForm}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page"
              >
                <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Add Application
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <section className="rounded-2xl border border-rose-200 bg-surface p-8 text-center shadow-sm" role="alert">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden="true">
                <path d="M12 8v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="mt-4 font-semibold text-slate-900">Couldn’t load applications</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => setReload((value) => value + 1)}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            >
              Try again
            </button>
          </section>
        ) : (
          <>
            <section aria-label="Application summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
              <SummaryCard label="Total applications" value={applications.length} detail="Opportunities in your pipeline" accent="bg-indigo-500" />
              <SummaryCard label="Saved" value={savedCount} detail="Roles to explore" accent="bg-status-saved-text" />
              <SummaryCard label="Applied" value={appliedCount} detail="Applications sent" accent="bg-brand" />
              <SummaryCard label="Interviews" value={interviewCount} detail="Conversations in progress" accent="bg-accent-amber" />
              <SummaryCard label="Completed" value={completedCount} detail="Closed applications" accent="bg-accent-teal" />
            </section>

            <section className="mt-5 grid gap-4 lg:grid-cols-2" aria-label="Application insights">
              <ApplicationAnalytics counts={statusCounts} total={applications.length} />
              <RecentApplications applications={applications} />
            </section>

            <section className="mt-5 overflow-hidden rounded-2xl border border-border-ui bg-surface shadow-sm sm:mt-6" aria-labelledby="applications-heading">
              <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
                <div>
                  <h2 id="applications-heading" className="font-semibold text-slate-900">Your applications</h2>
                  <p className="mt-1 text-sm text-slate-500">A quick look at the roles you’re pursuing.</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {visibleApplications.length}
                  </span>
                  <ViewSwitcher view={view} onChange={setView} />
                </div>
              </div>
              <ApplicationFilters
                search={search}
                onSearchChange={setSearch}
                status={selectedStatus}
                onStatusChange={setSelectedStatus}
                sort={sort}
                onSortChange={setSort}
                counts={statusCounts}
              />
              {applications.length === 0 ? (
                <EmptyState />
              ) : visibleApplications.length === 0 ? (
                <NoSearchResults />
              ) : view === "list" ? (
                <ApplicationsList
                  applications={visibleApplications}
                  onEdit={openEditForm}
                  onDelete={deleteApplication}
                  deletingId={deletingId}
                />
              ) : (
                <KanbanBoard
                  applications={visibleApplications}
                  onEdit={openEditForm}
                  onDelete={deleteApplication}
                  onStatusChange={moveApplication}
                  deletingId={deletingId}
                  movingId={movingId}
                />
              )}
            </section>
          </>
        )}

        <footer className="py-8 text-center text-xs text-slate-400">ApplyFlow · Your job search, in flow.</footer>
      </div>
      {showForm && (
        <ApplicationForm
          key={activeApplication?.id ?? "new"}
          application={activeApplication}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
