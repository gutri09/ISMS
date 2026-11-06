import React, { useState } from 'react';
import { useIntelligence } from '../../context/IntelligenceContext';
import {
  Settings,
  Globe2,
  Flag,
  Layers,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';
import { Country } from '../../types';

export const MasterConfigView: React.FC = () => {
  const {
    masterConfig,
    records,
    addContinent,
    deleteContinent,
    addCountry,
    deleteCountry,
    addComponent,
    deleteComponent,
    addTemplate,
    deleteTemplate,
  } = useIntelligence();

  const [activeTab, setActiveTab] = useState<'continents' | 'countries' | 'components' | 'templates'>('continents');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Continent Tab State
  const [newContinentName, setNewContinentName] = useState('');

  // Country Tab State
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryContinent, setNewCountryContinent] = useState(masterConfig.continents[0] || 'Amerika');
  const [newCountrySubRegion, setNewCountrySubRegion] = useState('');
  const [countryContinentFilter, setCountryContinentFilter] = useState('Semua');
  const [countrySearch, setCountrySearch] = useState('');

  // Component Tab State
  const [newComponentName, setNewComponentName] = useState('');

  // Templates Tab State
  const [templateType, setTemplateType] = useState<'kegiatan' | 'bentuk'>('kegiatan');
  const [newTemplateValue, setNewTemplateValue] = useState('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Handlers: Continents
  const handleAddContinent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContinentName.trim()) return;
    try {
      await addContinent(newContinentName.trim());
      setNewContinentName('');
      showNotification('success', `Benua "${newContinentName.trim()}" berhasil ditambahkan.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menambahkan benua.');
    }
  };

  const handleDeleteContinent = async (name: string) => {
    const recordCount = records.filter((r) => r.benua.toLowerCase() === name.toLowerCase()).length;
    if (recordCount > 0) {
      const confirm = window.confirm(
        `Perhatian: Terdapat ${recordCount} data intelijen yang terdaftar pada benua "${name}". Apakah Anda tetap ingin menghapusnya dari daftar pilihan?`
      );
      if (!confirm) return;
    }
    try {
      await deleteContinent(name);
      showNotification('success', `Benua "${name}" berhasil dihapus.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menghapus benua.');
    }
  };

  // Handlers: Countries
  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryName.trim() || !newCountryCode.trim()) return;
    try {
      await addCountry({
        name: newCountryName.trim(),
        code: newCountryCode.trim().toUpperCase(),
        continent: newCountryContinent,
        subRegion: newCountrySubRegion.trim() || undefined,
      });
      setNewCountryName('');
      setNewCountryCode('');
      setNewCountrySubRegion('');
      showNotification('success', `Negara "${newCountryName.trim()}" berhasil didaftarkan.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal mendaftarkan negara.');
    }
  };

  const handleDeleteCountry = async (code: string, name: string) => {
    if (!window.confirm(`Hapus negara "${name}" (${code}) dari master data?`)) return;
    try {
      await deleteCountry(code);
      showNotification('success', `Negara "${name}" berhasil dihapus.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menghapus negara.');
    }
  };

  // Handlers: Components
  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComponentName.trim()) return;
    try {
      await addComponent(newComponentName.trim());
      setNewComponentName('');
      showNotification('success', `Komponen strategis "${newComponentName.trim()}" berhasil ditambahkan.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menambahkan komponen.');
    }
  };

  const handleDeleteComponent = async (name: string) => {
    if (!window.confirm(`Hapus komponen strategis / bidang "${name}"?`)) return;
    try {
      await deleteComponent(name);
      showNotification('success', `Komponen strategis "${name}" berhasil dihapus.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menghapus komponen.');
    }
  };

  // Handlers: Templates
  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateValue.trim()) return;
    try {
      await addTemplate(templateType, newTemplateValue.trim());
      setNewTemplateValue('');
      showNotification('success', `Template ${templateType} berhasil ditambahkan.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menambahkan template.');
    }
  };

  const handleDeleteTemplate = async (type: 'kegiatan' | 'bentuk', value: string) => {
    try {
      await deleteTemplate(type, value);
      showNotification('success', `Template berhasil dihapus.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menghapus template.');
    }
  };

  // Filtered Countries list
  const filteredCountries = masterConfig.countries.filter((c) => {
    if (countryContinentFilter !== 'Semua' && c.continent.toLowerCase() !== countryContinentFilter.toLowerCase()) {
      return false;
    }
    if (countrySearch.trim()) {
      const q = countrySearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.subRegion && c.subRegion.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Konfigurasi Master Data Intelijen</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Atur kebutuhan parameter input data sistem: penambahan benua baru, daftar negara, bidang strategis, dan template kegiatan.
            </p>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('continents')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'continents'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>Kelola Benua / Kawasan ({masterConfig.continents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('countries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'countries'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Kelola Daftar Negara ({masterConfig.countries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('components')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'components'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Bidang / Komponen Strategis ({masterConfig.components.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Template Kegiatan & Bentuk</span>
        </button>
      </div>

      {/* TAB 1: CONTINENTS */}
      {activeTab === 'continents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Continent Form */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tambah Benua / Kawasan Baru</h3>
                <p className="text-xs text-slate-400">
                  Perluas cakupan pemantauan dengan menambahkan benua/kawasan baru ke dalam dropdown input data.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddContinent} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Benua / Kawasan
                </label>
                <input
                  type="text"
                  value={newContinentName}
                  onChange={(e) => setNewContinentName(e.target.value)}
                  placeholder="Contoh: Asia, Afrika, Timur Tengah, Pasifik"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Benua yang ditambahkan akan langsung tersedia di formulir Input Data manual, impor massal Excel, serta filter Dashboard & Lihat Data.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Benua Baru</span>
              </button>
            </form>
          </div>

          {/* Continents List */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Daftar Benua & Kawasan Aktif</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {masterConfig.continents.map((cont) => {
                const count = records.filter((r) => r.benua.toLowerCase() === cont.toLowerCase()).length;
                return (
                  <div
                    key={cont}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-purple-400" />
                        <span>{cont}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {count} data intelijen tercatat
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteContinent(cont)}
                      title="Hapus Benua"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COUNTRIES */}
      {activeTab === 'countries' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Country Form */}
          <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tambah Negara Baru</h3>
                <p className="text-xs text-slate-400">Daftarkan negara baru ke master data.</p>
              </div>
            </div>

            <form onSubmit={handleAddCountry} className="space-y-3.5 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Negara
                </label>
                <input
                  type="text"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  placeholder="Contoh: Jepang, Tiongkok, Mesir"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Kode ISO (2 Huruf)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={newCountryCode}
                  onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                  placeholder="JP / CN / EG"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Benua Induk
                </label>
                <select
                  value={newCountryContinent}
                  onChange={(e) => setNewCountryContinent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-purple-500 focus:outline-none"
                >
                  {masterConfig.continents.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Sub-Wilayah (Opsional)
                </label>
                <input
                  type="text"
                  value={newCountrySubRegion}
                  onChange={(e) => setNewCountrySubRegion(e.target.value)}
                  placeholder="Contoh: Asia Timur, Timur Tengah"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Negara</span>
              </button>
            </form>
          </div>

          {/* Countries Table & Filters */}
          <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Cari negara atau kode ISO..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={countryContinentFilter}
                onChange={(e) => setCountryContinentFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="Semua">Semua Benua ({masterConfig.countries.length})</option>
                {masterConfig.continents.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-96 overflow-y-auto border border-slate-800/80 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">Nama Negara</th>
                    <th className="py-2.5 px-3">Benua</th>
                    <th className="py-2.5 px-3">Sub-Wilayah</th>
                    <th className="py-2.5 px-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredCountries.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-mono font-bold text-purple-400">{c.code}</td>
                      <td className="py-2 px-3 text-white font-medium">{c.name}</td>
                      <td className="py-2 px-3 text-slate-300">{c.continent}</td>
                      <td className="py-2 px-3 text-slate-400">{c.subRegion || '—'}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleDeleteCountry(c.code, c.name)}
                          className="p-1 rounded text-slate-400 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPONENTS / BIDANG */}
      {activeTab === 'components' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tambah Komponen Strategis</h3>
                <p className="text-xs text-slate-400">
                  Tambahkan bidang kajian atau dimensi analisis baru dalam input data.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddComponent} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Komponen / Bidang
                </label>
                <input
                  type="text"
                  value={newComponentName}
                  onChange={(e) => setNewComponentName(e.target.value)}
                  placeholder="Contoh: Ketahanan Pangan, Energi Nuklir, Intelijen Siber"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Komponen Strategis</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Daftar Komponen Strategis / Bidang</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {masterConfig.components.map((comp) => {
                const count = records.filter((r) => r.bidang.toLowerCase() === comp.toLowerCase()).length;
                return (
                  <div
                    key={comp}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span>{comp}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {count} data intelijen
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteComponent(comp)}
                      title="Hapus Komponen"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tambah Template Rekomendasi</h3>
                <p className="text-xs text-slate-400">
                  Sediakan opsi cepat autocomplete untuk analis saat input data kegiatan.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddTemplate} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Kategori Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateType('kegiatan')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      templateType === 'kegiatan'
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Nama Kegiatan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateType('bentuk')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      templateType === 'bentuk'
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Bentuk Kegiatan
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Teks Template Baru
                </label>
                <input
                  type="text"
                  value={newTemplateValue}
                  onChange={(e) => setNewTemplateValue(e.target.value)}
                  placeholder="Contoh: Kunjungan Kenegaraan Tingkat Tinggi"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Template</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {/* Kegiatan Templates */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Template Rekomendasi Kegiatan ({masterConfig.kegiatanTemplates.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {masterConfig.kegiatanTemplates.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs hover:border-slate-700 transition-colors"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => handleDeleteTemplate('kegiatan', item)}
                      className="text-slate-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Bentuk Kegiatan Templates */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Template Rekomendasi Bentuk Kegiatan ({masterConfig.bentukKegiatanTemplates.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {masterConfig.bentukKegiatanTemplates.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs hover:border-slate-700 transition-colors"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => handleDeleteTemplate('bentuk', item)}
                      className="text-slate-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
