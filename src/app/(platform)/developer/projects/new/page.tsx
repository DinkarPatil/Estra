'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { Sparkles, Save, Send, ArrowRight } from 'lucide-react';

/* ─── Shared input styles (spec) ─── */
const inputClass =
  'w-full rounded-lg border border-[#CBD5F5] bg-[#F9F7F4] px-3.5 py-2.5 text-[13.5px] text-stone-900 placeholder:text-stone-400 ' +
  'transition-all duration-150 ease-out ' +
  'hover:border-[#C4B19A] ' +
  'focus:outline-none focus:border-stone-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,115,85,0.15)]';

const labelClass = 'block text-[12px] font-medium text-stone-700 mb-1.5';

/* ─── Section wrapper ─── */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_10px_30px_rgba(31,24,20,0.04)]">
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold text-stone-900 tracking-[-0.01em]">{title}</h2>
        {description && <p className="mt-0.5 text-[12px] text-stone-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function NewProjectPage() {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    country: 'UAE',
    totalUnits: '',
    estimatedValue: '',
    currency: 'AED',
    completionDate: '',
    description: '',
    projectManager: '',
    leadArchitect: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        title="New Project"
        description="Create a development project"
        actions={
          <Link
            href="/developer/projects"
            className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-[12.5px] font-medium text-stone-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-50"
          >
            Cancel
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ─── LEFT: Form sections ─── */}
        <div className="space-y-8 lg:col-span-2">
          {/* Project Info */}
          <Section title="Project Information" description="Basic details about the development">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Project Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Skyline Residences Phase 2"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Project Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select type…</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Mixed">Mixed Use</option>
                  <option value="Villa">Villa Complex</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="UAE"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Location / Area</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Dubai Marina, UAE"
                  className={inputClass}
                />
              </div>
            </div>
          </Section>

          {/* Project Details */}
          <Section title="Project Details" description="Scale, value, and timeline">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Total Units</label>
                <input
                  name="totalUnits"
                  type="number"
                  value={formData.totalUnits}
                  onChange={handleChange}
                  placeholder="e.g. 120"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Estimated Value</label>
                <input
                  name="estimatedValue"
                  type="number"
                  value={formData.estimatedValue}
                  onChange={handleChange}
                  placeholder="e.g. 850000000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Completion Date</label>
                <input
                  name="completionDate"
                  type="date"
                  value={formData.completionDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </Section>

          {/* Description */}
          <Section title="Description" description="Unique selling points, amenities, target buyers">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Describe the project, its unique selling points, amenities, and target buyers…"
              className={`${inputClass} resize-none`}
            />
          </Section>

          {/* Team */}
          <Section title="Team" description="Key people on this project">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Project Manager</label>
                <input
                  name="projectManager"
                  value={formData.projectManager}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Mehta"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Lead Architect</label>
                <input
                  name="leadArchitect"
                  value={formData.leadArchitect}
                  onChange={handleChange}
                  placeholder="e.g. Ayaan Khan"
                  className={inputClass}
                />
              </div>
            </div>
          </Section>
        </div>

        {/* ─── RIGHT: Sticky sidebar ─── */}
        <div className="space-y-8 lg:sticky lg:top-4 lg:self-start">
          {/* AI Assistance */}
          <div className="relative overflow-hidden rounded-2xl border border-[#D6C7AE] bg-gradient-to-br from-[#EDE7DF] via-[#E0EDFF] to-[#EDE7DF] p-6 shadow-[0_10px_30px_rgba(111,92,70,0.08)]">
            {/* Subtle top accent */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, rgba(168,148,120,0) 0%, rgba(139,115,85,0.55) 50%, rgba(168,148,120,0) 100%)' }}
            />
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-stone-600 shadow-[0_1px_2px_rgba(31,24,20,0.05)]">
                <Sparkles className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-[13.5px] font-semibold text-stone-900 tracking-[-0.01em]">AI Assistance</h3>
                <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-stone-500">Powered by Glimmora</p>
              </div>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-stone-900/80">
              AI will analyze market demand and suggest optimal pricing and unit mix based on your project type, location, and completion timeline.
            </p>
            <button
              type="button"
              className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-600 px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(111,92,70,0.25)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-stone-700 hover:shadow-[0_4px_14px_rgba(111,92,70,0.30)]"
            >
              <Sparkles className="h-4 w-4" />
              Get AI Recommendations
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_10px_30px_rgba(31,24,20,0.04)]">
            <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              Actions
            </h3>
            <div className="space-y-3">
              <button
                type="button"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-600 px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(111,92,70,0.20)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-stone-700 hover:shadow-[0_4px_14px_rgba(111,92,70,0.25)]"
              >
                <Send className="h-4 w-4" />
                Create Project
              </button>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-[12.5px] font-medium text-stone-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-stone-100"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
