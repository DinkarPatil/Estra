'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, FileText, Upload, Search, Download,
  Trash2, Eye, Clock, Shield, Filter, Grid3X3,
  List, ChevronRight, File, Image, Plus,
  Building2, Lock, Star,
} from 'lucide-react';

/* ─── Types ─── */

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'img' | 'misc';
  size: string;
  uploadedAt: string;
  category: string;
  property?: string;
  starred: boolean;
  verified: boolean;
}

interface Folder {
  id: string;
  name: string;
  count: number;
  icon: typeof FolderOpen;
  color: string;
}

/* ─── Mock Data ─── */

const FOLDERS: Folder[] = [
  { id: 'contracts', name: 'Contracts', count: 12, icon: FileText, color: '#8B7355' },
  { id: 'titles', name: 'Title Deeds', count: 9, icon: Shield, color: '#22C55E' },
  { id: 'financial', name: 'Financial Reports', count: 24, icon: File, color: '#F59E0B' },
  { id: 'inspections', name: 'Inspections', count: 6, icon: Eye, color: '#8B7355' },
  { id: 'insurance', name: 'Insurance', count: 8, icon: Lock, color: '#EF4444' },
  { id: 'photos', name: 'Property Photos', count: 45, icon: Image, color: '#8B7355' },
];

const DOCUMENTS: Document[] = [
  { id: '1', name: 'Purchase Agreement — Marina Bay.pdf', type: 'pdf', size: '2.4 MB', uploadedAt: 'Apr 15, 2026', category: 'Contracts', property: 'Marina Bay Penthouse', starred: true, verified: true },
  { id: '2', name: 'Title Deed — Palm Jumeirah.pdf', type: 'pdf', size: '1.8 MB', uploadedAt: 'Mar 28, 2026', category: 'Title Deeds', property: 'Palm Jumeirah Villa', starred: true, verified: true },
  { id: '3', name: 'Q1 2026 Portfolio Report.pdf', type: 'pdf', size: '5.1 MB', uploadedAt: 'Apr 1, 2026', category: 'Financial Reports', starred: false, verified: true },
  { id: '4', name: 'Insurance Policy — All Properties.pdf', type: 'pdf', size: '3.2 MB', uploadedAt: 'Jan 15, 2026', category: 'Insurance', starred: false, verified: true },
  { id: '5', name: 'Building Inspection — Singapore.pdf', type: 'pdf', size: '8.7 MB', uploadedAt: 'Feb 20, 2026', category: 'Inspections', property: 'Singapore Condo', starred: false, verified: false },
  { id: '6', name: 'Rental Agreement — London Flat.docx', type: 'doc', size: '420 KB', uploadedAt: 'Mar 10, 2026', category: 'Contracts', property: 'London Flat', starred: false, verified: true },
  { id: '7', name: 'Tax Assessment 2025.pdf', type: 'pdf', size: '1.5 MB', uploadedAt: 'Feb 28, 2026', category: 'Financial Reports', starred: false, verified: true },
  { id: '8', name: 'Marina Bay — Interior Photos.zip', type: 'img', size: '45.2 MB', uploadedAt: 'Apr 8, 2026', category: 'Property Photos', property: 'Marina Bay Penthouse', starred: false, verified: false },
  { id: '9', name: 'Valuation Report — Portfolio.pdf', type: 'pdf', size: '4.3 MB', uploadedAt: 'Apr 12, 2026', category: 'Financial Reports', starred: true, verified: true },
  { id: '10', name: 'Maintenance Schedule 2026.xlsx', type: 'misc', size: '280 KB', uploadedAt: 'Jan 5, 2026', category: 'Inspections', starred: false, verified: false },
];

const TYPE_ICONS = {
  pdf: { class: 'vault-icon-pdf', icon: FileText },
  doc: { class: 'vault-icon-doc', icon: File },
  img: { class: 'vault-icon-img', icon: Image },
  misc: { class: 'vault-icon-misc', icon: File },
};

export default function DocumentVaultPage() {
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [starredOnly, setStarredOnly] = useState(false);
  const [docs, setDocs] = useState(DOCUMENTS);
  const [dragOver, setDragOver] = useState(false);

  const filtered = docs.filter((doc) => {
    if (activeFolder && doc.category !== FOLDERS.find((f) => f.id === activeFolder)?.name) return false;
    if (starredOnly && !doc.starred) return false;
    if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleStar = (id: string) => {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, starred: !d.starred } : d));
  };

  const totalSize = '72.8 MB';
  const totalDocs = docs.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="ai-deal-hero">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#8B7355] to-[#8B7355] flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--fg)]">Document Vault</h1>
              <p className="text-xs text-[var(--fg-muted)]">{totalDocs} documents · {totalSize} total</p>
            </div>
          </div>
          <button className="ai-deal-cta">
            <Upload className="h-4 w-4" /> Upload Documents
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgba(139,115,85,0.12)] bg-transparent text-sm text-[var(--fg)] outline-none focus:border-[rgba(139,115,85,0.30)] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStarredOnly(!starredOnly)}
            className={`ex-pill ${starredOnly ? 'active' : ''}`}
          >
            <Star className="h-3 w-3" /> Starred
          </button>
          <div className="flex rounded-lg border border-[rgba(139,115,85,0.12)] overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-[rgba(139,115,85,0.10)] text-[#8B7355]' : 'text-[var(--fg-muted)]'}`}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-[rgba(139,115,85,0.10)] text-[#8B7355]' : 'text-[var(--fg-muted)]'}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folder sidebar */}
        <div className="space-y-2">
          <button
            onClick={() => setActiveFolder(null)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeFolder === null
                ? 'bg-[rgba(139,115,85,0.10)] text-[#8B7355]'
                : 'text-[var(--fg-secondary)] hover:bg-[rgba(139,115,85,0.04)]'
            }`}
          >
            All Documents ({totalDocs})
          </button>
          {FOLDERS.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(activeFolder === folder.id ? null : folder.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeFolder === folder.id
                  ? 'bg-[rgba(139,115,85,0.10)] text-[#8B7355] font-medium'
                  : 'text-[var(--fg-secondary)] hover:bg-[rgba(139,115,85,0.04)]'
              }`}
            >
              <folder.icon className="h-4 w-4" style={{ color: folder.color }} />
              <span className="flex-1 text-left">{folder.name}</span>
              <span className="text-[10px] text-[var(--fg-muted)]">{folder.count}</span>
            </button>
          ))}

          {/* Upload zone */}
          <div
            className={`vault-upload-zone mt-4 ${dragOver ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
          >
            <Upload className="h-6 w-6 text-[#8B7355] mx-auto mb-2" />
            <p className="text-xs font-medium text-[var(--fg)]">Drop files here</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1">or click to browse</p>
          </div>
        </div>

        {/* Document list */}
        <div className="lg:col-span-3">
          {/* Breadcrumb */}
          {activeFolder && (
            <div className="vault-breadcrumb mb-4">
              <button onClick={() => setActiveFolder(null)} className="vault-breadcrumb-item">All Documents</button>
              <ChevronRight className="h-3 w-3 text-[var(--fg-muted)]" />
              <span className="text-[var(--fg)] font-medium">{FOLDERS.find((f) => f.id === activeFolder)?.name}</span>
            </div>
          )}

          {viewMode === 'list' ? (
            /* List view */
            <div className="ex-glass overflow-hidden p-0">
              <div className="divide-y divide-[rgba(139,115,85,0.06)]">
                {filtered.map((doc, i) => {
                  const typeConfig = TYPE_ICONS[doc.type];
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(139,115,85,0.03)] cursor-pointer transition-colors"
                    >
                      <div className={`vault-icon ${typeConfig.class}`} style={{ width: 36, height: 36 }}>
                        <typeConfig.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--fg)] truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {doc.property && (
                            <span className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1">
                              <Building2 className="h-2.5 w-2.5" /> {doc.property}
                            </span>
                          )}
                          <span className="text-[10px] text-[var(--fg-muted)]">{doc.size}</span>
                          <span className="text-[10px] text-[var(--fg-muted)]">{doc.uploadedAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.verified && (
                          <span className="flex items-center gap-1 text-[10px] text-[#22C55E] font-medium">
                            <Shield className="h-3 w-3" /> Verified
                          </span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); toggleStar(doc.id); }} className={`p-1.5 rounded-md transition-colors ${doc.starred ? 'text-[#F59E0B]' : 'text-[var(--fg-muted)] hover:text-[#F59E0B]'}`}>
                          <Star className="h-3.5 w-3.5" fill={doc.starred ? 'currentColor' : 'none'} />
                        </button>
                        <button className="p-1.5 rounded-md text-[var(--fg-muted)] hover:text-[#8B7355] transition-colors">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1.5 rounded-md text-[var(--fg-muted)] hover:text-[#EF4444] transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Grid view */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((doc, i) => {
                const typeConfig = TYPE_ICONS[doc.type];
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="vault-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`vault-icon ${typeConfig.class}`}>
                        <typeConfig.icon className="h-5 w-5" />
                      </div>
                      <button onClick={() => toggleStar(doc.id)} className={doc.starred ? 'text-[#F59E0B]' : 'text-[var(--fg-muted)]'}>
                        <Star className="h-3.5 w-3.5" fill={doc.starred ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <p className="text-xs font-medium text-[var(--fg)] truncate leading-tight">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-[var(--fg-muted)]">{doc.size}</span>
                      <span className="text-[10px] text-[var(--fg-muted)]">·</span>
                      <span className="text-[10px] text-[var(--fg-muted)]">{doc.uploadedAt}</span>
                    </div>
                    {doc.verified && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-[#22C55E] font-medium">
                        <Shield className="h-3 w-3" /> Verified
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <FileText className="h-10 w-10 text-[var(--fg-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--fg-muted)]">No documents found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
