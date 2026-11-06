import React, { useState, useMemo } from 'react';
import { useIntelligence } from '../../context/IntelligenceContext';
import {
  FilePlus2,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Link,
  FileUp,
  X,
  ExternalLink,
  AlertCircle,
  Layers,
  FileText,
  Search,
  Check,
  Edit3,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import { STRATEGIC_COMPONENTS } from '../../constants/strategicComponents';
import { COUNTRIES, getCountriesByContinent, normalizeCountryName } from '../../constants/countries';
import { Continent, StrategicComponent, IntelligenceRecord, Country } from '../../types';
import { parseTokohList, normalizeMultipleTokoh } from '../../utils/tokohUtils';
import * as XLSX from 'xlsx';

export interface RowValidationError {
  rowNumber: number;
  columnsWithErrors: string[];
  errorMessages: string[];
  rawRow: any;
  draft: {
    tanggal: string;
    benua: Continent;
    negara: string;
    negaraCode: string;
    bidang: StrategicComponent;
    kegiatan: string;
    bentukKegiatan: string;
    isuUtama: string;
    tokoh?: string;
    sumberUrl?: string;
  };
}

export interface RowDuplicateInfo {
  rowNumber: number;
  data: any;
  reason: string;
}

export const InputDataView: React.FC = () => {
  const { addRecord, bulkAddRecords, records, setActiveMenu, apiOnline, backupInfo, masterConfig } = useIntelligence();

  // Tab State: 'manual' or 'excel'
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual');

  // Manual Form State
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [benua, setBenua] = useState<Continent>(masterConfig?.continents[0] || 'Amerika');
  const [negara, setNegara] = useState<string>('');
  const [bidang, setBidang] = useState<StrategicComponent>(masterConfig?.components[0] || 'Politik');
  const [kegiatan, setKegiatan] = useState<string>('');
  const [bentukKegiatan, setBentukKegiatan] = useState<string>('');
  const [isuUtama, setIsuUtama] = useState<string>('');
  const [tokoh, setTokoh] = useState<string>('');
  const [sumberUrl, setSumberUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Bulk Excel State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  
  // Validation Report State
  const [validationReport, setValidationReport] = useState<{
    valid: any[];
    invalid: RowValidationError[];
    duplicates: RowDuplicateInfo[];
    totalRowsScanned: number;
  } | null>(null);

  // Active Tab in Preview: 'invalid' | 'valid' | 'duplicates' | 'all'
  const [previewFilterTab, setPreviewFilterTab] = useState<'invalid' | 'valid' | 'duplicates' | 'all'>('invalid');

  // Inline Row Editor Modal State
  const [editingRow, setEditingRow] = useState<RowValidationError | null>(null);

  const availableCountries = getCountriesByContinent(benua, masterConfig?.countries);

  // Autocomplete Suggestions merging master config templates and existing records
  const existingKegiatan = Array.from(
    new Set([
      ...(masterConfig?.kegiatanTemplates || []),
      ...records.map((r) => r.kegiatan).filter(Boolean),
    ])
  );
  const existingBentuk = Array.from(
    new Set([
      ...(masterConfig?.bentukKegiatanTemplates || []),
      ...records.map((r) => r.bentukKegiatan).filter(Boolean),
    ])
  );
  const existingTokoh = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.tokoh) {
        parseTokohList(r.tokoh).forEach((t) => set.add(t));
      }
    });
    return Array.from(set).sort();
  }, [records]);

  // Show Toast
  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Reset Form
  const handleReset = () => {
    setTanggal(new Date().toISOString().split('T')[0]);
    setBenua('Amerika');
    setNegara('');
    setBidang('Politik');
    setKegiatan('');
    setBentukKegiatan('');
    setIsuUtama('');
    setTokoh('');
    setSumberUrl('');
    setSelectedFile(null);
  };

  // Submit Manual Form
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!tanggal || !benua || !negara || !bidang || !kegiatan || !bentukKegiatan || !isuUtama) {
      showToast('error', 'Harap lengkapi semua bidang wajib bertanda bintang (*)');
      return;
    }

    setIsSubmitting(true);

    try {
      const countryPool = masterConfig?.countries && masterConfig.countries.length > 0
        ? masterConfig.countries
        : COUNTRIES;
      const countryObj = normalizeCountryName(negara, countryPool);
      const negaraCode = countryObj ? countryObj.code : negara.slice(0, 2).toUpperCase();

      let attachments: any[] = [];

      if (selectedFile) {
        if (apiOnline) {
          try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            const uploadJson = await uploadRes.json();
            if (uploadJson.success && uploadJson.data) {
              attachments.push(uploadJson.data);
            }
          } catch (e) {
            console.error('File upload to API failed, using client reference', e);
          }
        }

        if (attachments.length === 0) {
          attachments.push({
            id: `att-${Date.now()}`,
            name: selectedFile.name,
            size: selectedFile.size,
            mimeType: selectedFile.type,
            uploadedAt: new Date().toISOString(),
          });
        }
      }

      const statusSumber =
        sumberUrl.trim() || attachments.length > 0 ? 'lengkap' : 'sumber_belum_dilengkapi';

      await addRecord({
        tanggal,
        benua,
        negara,
        negaraCode,
        bidang,
        kegiatan: kegiatan.trim(),
        bentukKegiatan: bentukKegiatan.trim(),
        isuUtama: isuUtama.trim(),
        tokoh: normalizeMultipleTokoh(tokoh) || undefined,
        sumberUrl: sumberUrl.trim() || undefined,
        attachments,
        statusSumber,
        isDemo: false,
      });

      showToast('success', 'Rekaman intelijen berhasil divalidasi dan disimpan!');
      handleReset();
    } catch (err) {
      showToast('error', 'Gagal menyimpan rekaman. Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Excel Template
  const handleDownloadTemplate = () => {
    const headers = [
      ['TANGGAL', 'BENUA', 'NEGARA', 'BIDANG', 'KEGIATAN', 'BENTUK KEGIATAN', 'ISU UTAMA', 'TOKOH', 'SUMBER'],
      [
        '15/06/2026',
        'Amerika',
        'Amerika Serikat',
        'Angkatan Bersenjata',
        'Bantuan Militer',
        'Pengumuman Kebijakan',
        'Pemerintah AS mengumumkan paket bantuan alutsista baru untuk memperkuat pertahanan udara.',
        'Joe Biden, Antony Blinken',
        'https://example.org/news-us',
      ],
      [
        '18/06/2026',
        'Eropa',
        'Inggris',
        'Politik',
        'Kunjungan Diplomatik',
        'Pertemuan Bilateral',
        'Pemerintah Inggris dan Prancis meratifikasi traktat kerja sama pertahanan maritim.',
        'Keir Starmer; Emmanuel Macron',
        'https://example.org/news-uk',
      ],
      [
        '20/06/2026',
        'Eropa',
        'Rusia',
        'Politik',
        'Pernyataan Resmi',
        'Konferensi Pers',
        'Kementerian Luar Negeri Rusia memberikan tanggapan atas sanksi sepihak Uni Eropa.',
        'Vladimir Putin, Sergei Lavrov; Dmitry Peskov',
        'https://example.org/news-ru',
      ],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);

    ws['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 50 },
      { wch: 20 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'TEMPLATE_ISMS');
    XLSX.writeFile(wb, 'ISMS_Template_Import_Amerop.xlsx');
  };

  // Parse Excel Date Code
  const parseExcelDate = (val: any): { isoDate: string; isValid: boolean; rawDisplay: string } => {
    if (val === undefined || val === null || String(val).trim() === '') {
      return { isoDate: '', isValid: false, rawDisplay: '(Kosong)' };
    }

    if (typeof val === 'number') {
      const d = XLSX.SSF.parse_date_code(val);
      if (d && d.y > 1900 && d.y < 2100) {
        const iso = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        return { isoDate: iso, isValid: true, rawDisplay: iso };
      }
      return { isoDate: '', isValid: false, rawDisplay: String(val) };
    }

    if (typeof val === 'string') {
      const clean = val.trim();
      const parts = clean.split(/[-/.]/);
      if (parts.length === 3) {
        // YYYY-MM-DD
        if (parts[0].length === 4) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const d = parseInt(parts[2], 10);
          if (y >= 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
            return {
              isoDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
              isValid: true,
              rawDisplay: clean,
            };
          }
        }
        // DD-MM-YYYY
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (y >= 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          return {
            isoDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
            isValid: true,
            rawDisplay: clean,
          };
        }
      }
      return { isoDate: '', isValid: false, rawDisplay: clean };
    }

    return { isoDate: '', isValid: false, rawDisplay: String(val) };
  };

  // Map Bidang variations
  const mapBidang = (b: any): { component: StrategicComponent; isValid: boolean } => {
    if (!b || String(b).trim() === '') {
      return { component: 'Politik', isValid: false };
    }

    const clean = String(b).trim().toUpperCase();
    if (clean.includes('ILPENGTEK') || clean.includes('IPTEK') || clean.includes('TEKNOLOGI')) {
      return { component: 'Ilmu Pengetahuan dan Teknologi', isValid: true };
    }
    if (clean.includes('ANGKATAN') || clean.includes('BERSENJATA') || clean.includes('MILITER') || clean.includes('HANKAM')) {
      return { component: 'Angkatan Bersenjata', isValid: true };
    }
    if (clean.includes('EKONOMI') || clean.includes('PERDAGANGAN') || clean.includes('KEUANGAN')) {
      return { component: 'Ekonomi', isValid: true };
    }
    if (clean.includes('SOSIAL') || clean.includes('MASYARAKAT')) {
      return { component: 'Sosial', isValid: true };
    }
    if (clean.includes('GEOGRAFI') || clean.includes('WILAYAH') || clean.includes('PERBATASAN')) {
      return { component: 'Geografi', isValid: true };
    }
    if (clean.includes('BIOGRAFI') || clean.includes('TOKOH')) {
      return { component: 'Biografi', isValid: true };
    }
    if (clean.includes('SEJARAH') || clean.includes('HISTORIS')) {
      return { component: 'Sejarah', isValid: true };
    }
    if (clean.includes('TRANSPORTASI') || clean.includes('TRANSTEL') || clean.includes('TELEKOMUNIKASI') || clean.includes('LOGISTIK')) {
      return { component: 'Transportasi dan Telekomunikasi', isValid: true };
    }
    if (clean.includes('POLITIK') || clean.includes('DIPLOMASI') || clean.includes('PEMERINTAHAN')) {
      return { component: 'Politik', isValid: true };
    }

    // Exact direct match with one of the 9 official components
    const direct = STRATEGIC_COMPONENTS.find((c) => c.name.toLowerCase() === String(b).trim().toLowerCase());
    if (direct) {
      return { component: direct.name, isValid: true };
    }

    return { component: 'Politik', isValid: false };
  };

  // Infer Continent from country name
  const inferContinent = (country: string): Continent => {
    const c = country.toUpperCase();
    const amerikaKeywords = [
      'AMERIKA', 'USA', 'US', 'KANADA', 'MEKSIKO', 'BRASIL', 'VENEZUELA',
      'GUYANA', 'ARGENTINA', 'KOLOMBIA', 'CHILI', 'PERU', 'KUBA', 'PANAMA',
      'SURINAME', 'EKUADOR', 'BOLIVIA', 'PARAGUAY', 'URUGUAY'
    ];
    for (const k of amerikaKeywords) {
      if (c.includes(k)) return 'Amerika';
    }
    return 'Eropa';
  };

  // Deep Validation for a Single Row
  const validateSingleRow = (
    row: any,
    rowNum: number,
    colIndex: Record<string, number>,
    existingBatchRecords: any[]
  ): { isValid: boolean; parsedRecord?: any; errorInfo?: RowValidationError; duplicateInfo?: RowDuplicateInfo } => {
    const errors: string[] = [];
    const columnsWithErrors: string[] = [];

    const rawTanggal = colIndex.tanggal !== -1 ? row[colIndex.tanggal] : undefined;
    const rawBenua = colIndex.benua !== -1 ? String(row[colIndex.benua] || '').trim() : '';
    const rawNegara = colIndex.negara !== -1 ? String(row[colIndex.negara] || '').trim() : '';
    const rawBidang = colIndex.bidang !== -1 ? String(row[colIndex.bidang] || '').trim() : '';
    const rawKegiatan = colIndex.kegiatan !== -1 ? String(row[colIndex.kegiatan] || '').trim() : '';
    const rawBentukKegiatan = colIndex.bentukKegiatan !== -1 ? String(row[colIndex.bentukKegiatan] || '').trim() : '';
    const rawIsuUtama = colIndex.isuUtama !== -1 ? String(row[colIndex.isuUtama] || '').trim() : '';
    const rawTokoh = colIndex.tokoh !== -1 ? String(row[colIndex.tokoh] || '').trim() : '';
    const cleanTokoh = normalizeMultipleTokoh(rawTokoh);
    const rawSumber = colIndex.sumber !== -1 ? String(row[colIndex.sumber] || '').trim() : '';

    // 1. TANGGAL VALIDATION
    const dateResult = parseExcelDate(rawTanggal);
    if (!dateResult.isValid) {
      errors.push(`Kolom TANGGAL: Tanggal tidak valid (${dateResult.rawDisplay}). Gunakan format DD/MM/YYYY atau YYYY-MM-DD.`);
      columnsWithErrors.push('TANGGAL');
    }

    // 2. NEGARA VALIDATION
    if (!rawNegara) {
      errors.push('Kolom NEGARA: Wajib diisi.');
      columnsWithErrors.push('NEGARA');
    }

    const countryPool = masterConfig?.countries && masterConfig.countries.length > 0
      ? masterConfig.countries
      : COUNTRIES;
    let countryObj = normalizeCountryName(rawNegara, countryPool);

    if (!countryObj && rawNegara) {
      const clean = rawNegara.trim().toLowerCase();
      const direct = countryPool.find(
        (c: Country) => c.name.toLowerCase() === clean || c.code.toLowerCase() === clean
      );
      if (direct) {
        countryObj = direct;
      } else if (clean.length >= 2) {
        countryObj = {
          code: clean.slice(0, 2).toUpperCase(),
          name: rawNegara.trim(),
          continent: (rawBenua ? rawBenua : inferContinent(rawNegara)) as Continent,
        };
      } else {
        errors.push(`Kolom NEGARA: Nama negara "${rawNegara}" tidak valid.`);
        columnsWithErrors.push('NEGARA');
      }
    }

    // 3. BENUA VALIDATION
    const allowedContinents = masterConfig?.continents || ['Amerika', 'Eropa', 'Asia', 'Afrika', 'Australia & Pasifik', 'Timur Tengah', 'Global / Multilateral'];
    let determinedBenua: Continent = 'Amerika';
    if (rawBenua) {
      const match = allowedContinents.find((c) => c.toLowerCase() === rawBenua.toLowerCase());
      if (match) {
        determinedBenua = match;
      } else if (rawBenua.trim().length >= 2) {
        determinedBenua = rawBenua.trim();
      } else {
        errors.push(`Kolom BENUA: Nilai "${rawBenua}" tidak valid.`);
        columnsWithErrors.push('BENUA');
      }
    } else {
      // Inferred automatically from country
      determinedBenua = countryObj ? countryObj.continent : inferContinent(rawNegara);
    }

    // 4. BIDANG VALIDATION
    const allowedComponents = masterConfig?.components || STRATEGIC_COMPONENTS.map((c) => c.name);
    const bidangResult = mapBidang(rawBidang);
    let determinedBidang: StrategicComponent = 'Politik';
    if (!rawBidang) {
      errors.push('Kolom BIDANG: Wajib diisi.');
      columnsWithErrors.push('BIDANG');
    } else {
      const compMatch = allowedComponents.find((c) => c.toLowerCase() === rawBidang.toLowerCase());
      if (compMatch) {
        determinedBidang = compMatch;
      } else if (bidangResult.isValid) {
        determinedBidang = bidangResult.component;
      } else if (rawBidang.trim().length >= 2) {
        determinedBidang = rawBidang.trim();
      } else {
        errors.push(`Kolom BIDANG: Nilai "${rawBidang}" tidak cocok.`);
        columnsWithErrors.push('BIDANG');
      }
    }

    // 5. KEGIATAN VALIDATION
    if (!rawKegiatan || !rawKegiatan.trim()) {
      errors.push('Kolom KEGIATAN: Wajib diisi.');
      columnsWithErrors.push('KEGIATAN');
    }

    // 6. BENTUK KEGIATAN VALIDATION
    if (!rawBentukKegiatan || !rawBentukKegiatan.trim()) {
      errors.push('Kolom BENTUK KEGIATAN: Wajib diisi.');
      columnsWithErrors.push('BENTUK KEGIATAN');
    }

    // 7. ISU UTAMA VALIDATION
    if (!rawIsuUtama || !rawIsuUtama.trim()) {
      errors.push('Kolom ISU UTAMA: Wajib diisi.');
      columnsWithErrors.push('ISU UTAMA');
    }

    // 8. SUMBER VALIDATION (Optional, but if filled, validate format)
    if (rawSumber && rawSumber.trim() !== '') {
      const isHttp = rawSumber.startsWith('http://') || rawSumber.startsWith('https://');
      if (!isHttp && !rawSumber.includes('.')) {
        errors.push(`Kolom SUMBER: Format tautan URL tidak valid ("${rawSumber}"). Gunakan format http:// atau https://`);
        columnsWithErrors.push('SUMBER');
      }
    }

    const draftRecord = {
      tanggal: dateResult.isoDate || new Date().toISOString().split('T')[0],
      benua: determinedBenua,
      negara: countryObj ? countryObj.name : rawNegara,
      negaraCode: countryObj ? countryObj.code : (rawNegara.slice(0, 2).toUpperCase() || 'XX'),
      bidang: determinedBidang,
      kegiatan: rawKegiatan.trim(),
      bentukKegiatan: rawBentukKegiatan.trim(),
      isuUtama: rawIsuUtama || '',
      tokoh: cleanTokoh || undefined,
      sumberUrl: rawSumber || undefined,
      statusSumber: (rawSumber ? 'lengkap' : 'sumber_belum_dilengkapi') as 'lengkap' | 'sumber_belum_dilengkapi',
      isDemo: false,
    };

    // If there are validation errors, return error info
    if (errors.length > 0) {
      return {
        isValid: false,
        errorInfo: {
          rowNumber: rowNum,
          columnsWithErrors,
          errorMessages: errors,
          rawRow: row,
          draft: draftRecord,
        },
      };
    }

    // 9. DUPLICATE CHECK against existing database and current batch
    const isDupInDb = records.some(
      (r) =>
        r.tanggal === draftRecord.tanggal &&
        r.negara.toLowerCase() === draftRecord.negara.toLowerCase() &&
        r.bidang === draftRecord.bidang &&
        r.isuUtama.toLowerCase() === draftRecord.isuUtama.toLowerCase()
    );

    const isDupInBatch = existingBatchRecords.some(
      (r) =>
        r.tanggal === draftRecord.tanggal &&
        r.negara.toLowerCase() === draftRecord.negara.toLowerCase() &&
        r.bidang === draftRecord.bidang &&
        r.isuUtama.toLowerCase() === draftRecord.isuUtama.toLowerCase()
    );

    if (isDupInDb || isDupInBatch) {
      const reason = isDupInDb
        ? 'Data identik (Tanggal, Negara, Bidang, dan Isu Utama) sudah tersimpan di database sistem.'
        : 'Data identik terulang dalam lembar Excel yang sama.';

      return {
        isValid: true, // It is well-formed, but flagged as duplicate
        parsedRecord: draftRecord,
        duplicateInfo: {
          rowNumber: rowNum,
          data: draftRecord,
          reason,
        },
      };
    }

    return {
      isValid: true,
      parsedRecord: draftRecord,
    };
  };

  // Process uploaded Excel File
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: false });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);

        // Auto select best sheet
        const defaultSheet =
          wb.SheetNames.find((s) => s.toUpperCase() === 'JANUARI-SEPTEMBER') ||
          wb.SheetNames.find((s) => s.toUpperCase() === 'DATA') ||
          wb.SheetNames[0];

        setSelectedSheet(defaultSheet);
        parseAndValidateSheet(wb, defaultSheet);
      } catch (err) {
        showToast('error', 'Gagal membaca berkas Excel. Pastikan format spreadsheet valid.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Comprehensive Parse & Validate
  const parseAndValidateSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (data.length < 2) {
      showToast('error', `Sheet "${sheetName}" kosong atau tidak memiliki baris data.`);
      setValidationReport(null);
      return;
    }

    const rawHeaders = (data[0] || []).map((h) => String(h || '').trim().toUpperCase());

    const colIndex = {
      tanggal: rawHeaders.findIndex((h) => h.includes('TANGGAL')),
      benua: rawHeaders.findIndex((h) => h === 'BENUA'),
      negara: rawHeaders.findIndex((h) => h === 'NEGARA'),
      bidang: rawHeaders.findIndex((h) => h === 'BIDANG'),
      kegiatan: rawHeaders.findIndex((h) => h === 'KEGIATAN'),
      bentukKegiatan: rawHeaders.findIndex((h) => h.includes('BENTUK')),
      isuUtama: rawHeaders.findIndex((h) => h.includes('ISU')),
      tokoh: rawHeaders.findIndex((h) => h.includes('TOKOH')),
      sumber: rawHeaders.findIndex((h) => h.includes('SUMBER')),
    };

    const rows = data.slice(1);
    const validList: any[] = [];
    const invalidList: RowValidationError[] = [];
    const duplicateList: RowDuplicateInfo[] = [];

    let totalScanned = 0;

    rows.forEach((row, index) => {
      // Skip totally blank rows
      if (!row || row.length === 0 || row.every((c) => c === undefined || c === null || String(c).trim() === '')) {
        return;
      }

      totalScanned++;
      const rowNum = index + 2;

      const result = validateSingleRow(row, rowNum, colIndex, validList);

      if (!result.isValid && result.errorInfo) {
        invalidList.push(result.errorInfo);
      } else if (result.isValid && result.parsedRecord) {
        validList.push(result.parsedRecord);
        if (result.duplicateInfo) {
          duplicateList.push(result.duplicateInfo);
        }
      }
    });

    setValidationReport({
      valid: validList,
      invalid: invalidList,
      duplicates: duplicateList,
      totalRowsScanned: totalScanned,
    });

    // Auto set preview tab to invalid if there are errors, so analyst immediately sees where errors are!
    if (invalidList.length > 0) {
      setPreviewFilterTab('invalid');
      showToast(
        'warning',
        `Peringatan: Ditemukan ${invalidList.length} baris bermasalah pada sheet "${sheetName}". Periksa rincian di bawah.`
      );
    } else {
      setPreviewFilterTab('valid');
      showToast(
        'success',
        `Validasi Sempurna: Seluruh ${validList.length} baris valid dan siap diimpor ke sistem!`
      );
    }
  };

  // Change active sheet
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      parseAndValidateSheet(workbook, sheetName);
    }
  };

  // Save Inline Row Fix
  const handleSaveRowCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow || !validationReport) return;

    const draft = editingRow.draft;

    // Quick validation of the corrected draft
    const countryPool = masterConfig?.countries && masterConfig.countries.length > 0
      ? masterConfig.countries
      : COUNTRIES;
    const countryObj = normalizeCountryName(draft.negara, countryPool) || {
      code: draft.negara.slice(0, 2).toUpperCase() || 'XX',
      name: draft.negara.trim(),
      continent: draft.benua || 'Eropa',
    };
    const errors: string[] = [];

    if (!draft.tanggal) errors.push('Tanggal wajib diisi.');
    if (!draft.negara || !draft.negara.trim()) errors.push('Nama negara wajib diisi.');
    if (!draft.bidang) errors.push('Bidang wajib diisi.');
    if (!draft.kegiatan || !draft.kegiatan.trim()) errors.push('Kegiatan wajib diisi.');
    if (!draft.bentukKegiatan || !draft.bentukKegiatan.trim()) errors.push('Bentuk Kegiatan wajib diisi.');
    if (!draft.isuUtama || !draft.isuUtama.trim()) errors.push('Isu Utama wajib diisi.');

    if (errors.length > 0) {
      showToast('error', `Koreksi belum lengkap: ${errors[0]}`);
      return;
    }

    const correctedRecord = {
      ...draft,
      tokoh: normalizeMultipleTokoh(draft.tokoh) || undefined,
      negara: countryObj ? countryObj.name : draft.negara,
      negaraCode: countryObj ? countryObj.code : 'XX',
      benua: countryObj ? countryObj.continent : draft.benua,
      statusSumber: draft.sumberUrl ? 'lengkap' : 'sumber_belum_dilengkapi',
      isDemo: false,
    };

    // Remove from invalid list
    const updatedInvalid = validationReport.invalid.filter((inv) => inv.rowNumber !== editingRow.rowNumber);
    // Add to valid list
    const updatedValid = [...validationReport.valid, correctedRecord];

    setValidationReport({
      ...validationReport,
      valid: updatedValid,
      invalid: updatedInvalid,
    });

    setEditingRow(null);
    showToast('success', `Baris ${editingRow.rowNumber} berhasil diperbaiki dan dipindahkan ke daftar Valid!`);
  };

  // Execute Bulk Import
  const handleExecuteImport = async () => {
    if (!validationReport || validationReport.valid.length === 0) {
      showToast('error', 'Tidak ada baris valid yang siap diimpor.');
      return;
    }

    const res = await bulkAddRecords(validationReport.valid);
    showToast(
      'success',
      `Berhasil mengimpor ${res.inserted} rekaman ke database sistem! (Jika terdapat kesalahan data, Anda dapat mengembalikannya melalui tombol 'Pulihkan dari Backup' di bilah navigasi samping).`
    );
    setExcelFile(null);
    setValidationReport(null);
    setWorkbook(null);

    setTimeout(() => {
      setActiveMenu('data');
    }, 1200);
  };

  // Download Comprehensive Error Report
  const handleDownloadErrorReport = () => {
    if (!validationReport || validationReport.invalid.length === 0) return;

    const errorRows = [
      [
        'NOMOR BARIS EXCEL',
        'KOLOM BERMASALAH',
        'RINCIAN KESALAHAN / KEKURANGAN',
        'PANDUAN PERBAIKAN',
        'DATA TANGGAL',
        'DATA BENUA',
        'DATA NEGARA',
        'DATA BIDANG',
        'DATA KEGIATAN',
        'DATA BENTUK KEGIATAN',
        'DATA ISU UTAMA',
        'DATA TOKOH',
        'DATA SUMBER',
      ],
      ...validationReport.invalid.map((item) => {
        const raw = Array.isArray(item.rawRow) ? item.rawRow : [];
        return [
          `Baris ${item.rowNumber}`,
          item.columnsWithErrors.join(', '),
          item.errorMessages.join(' | '),
          'Perbaiki kolom bertanda merah sesuai panduan ISMS (Format tanggal DD/MM/YYYY, negara khusus kawasan Amerika & Eropa, 9 bidang strategis resmi).',
          String(raw[0] || ''),
          String(raw[1] || ''),
          String(raw[2] || ''),
          String(raw[3] || ''),
          String(raw[4] || ''),
          String(raw[5] || ''),
          String(raw[6] || ''),
          String(raw[7] || ''),
          String(raw[8] || ''),
        ];
      }),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(errorRows);

    ws['!cols'] = [
      { wch: 18 },
      { wch: 22 },
      { wch: 55 },
      { wch: 45 },
      { wch: 14 },
      { wch: 12 },
      { wch: 20 },
      { wch: 22 },
      { wch: 25 },
      { wch: 25 },
      { wch: 40 },
      { wch: 20 },
      { wch: 25 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'LAPORAN_GALAT_ISMS');
    XLSX.writeFile(wb, `Laporan_Kesalahan_Impor_ISMS_Baris_${validationReport.invalid.length}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 text-sm animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500 text-white'
              : toastMessage.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500 text-white'
              : 'bg-red-950/95 border-red-500 text-white'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
          <span className="font-medium">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Mode Selector */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-blue-600" />
            Entri & Impor Informasi Intelijen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mendukung entri manual terstruktur dan validasi ketat impor massal spreadsheet
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FilePlus2 className="w-4 h-4" />
            Input Manual
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'excel'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Bulk Import Excel
          </button>
        </div>
      </div>

      {/* TAB 1: INPUT MANUAL */}
      {activeTab === 'manual' && (
        <form onSubmit={handleSubmitManual} className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Bagian I: Parameter Informasi Pokok
            </h3>
            <span className="text-xs text-slate-400">Tanda (*) wajib diisi</span>
          </div>

          {/* Grid 1: Tanggal, Benua, Negara, Bidang */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                1. Tanggal Kejadian / Terbit *
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                2. Benua (Kawasan) *
              </label>
              <select
                value={benua}
                onChange={(e) => {
                  const b = e.target.value as Continent;
                  setBenua(b);
                  setNegara('');
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {(masterConfig?.continents || ['Amerika', 'Eropa']).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                3. Negara Terpantau *
              </label>
              <select
                required
                value={negara}
                onChange={(e) => setNegara(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Pilih Negara ({benua}) --</option>
                {availableCountries.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                4. Bidang / Komponen Strategis *
              </label>
              <select
                value={bidang}
                onChange={(e) => setBidang(e.target.value as StrategicComponent)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {(masterConfig?.components || STRATEGIC_COMPONENTS.map((c) => c.name)).map((compName) => (
                  <option key={compName} value={compName}>
                    {compName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid 2: Kegiatan & Bentuk Kegiatan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                5. Kegiatan Pokok *
              </label>
              <input
                type="text"
                required
                list="kegiatan-suggestions"
                placeholder="Misal: Latihan Militer, Kunjungan Diplomatik, Perjanjian Dagang"
                value={kegiatan}
                onChange={(e) => setKegiatan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <datalist id="kegiatan-suggestions">
                {existingKegiatan.map((item, idx) => (
                  <option key={idx} value={item} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                6. Bentuk Kegiatan *
              </label>
              <input
                type="text"
                required
                list="bentuk-suggestions"
                placeholder="Misal: Pertemuan Bilateral, Latihan Gabungan, Deklarasi Bersama"
                value={bentukKegiatan}
                onChange={(e) => setBentukKegiatan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <datalist id="bentuk-suggestions">
                {existingBentuk.map((item, idx) => (
                  <option key={idx} value={item} />
                ))}
              </datalist>
            </div>
          </div>

          {/* 7. Isu Utama */}
          <div className="text-xs">
            <label className="block text-slate-700 font-semibold mb-1.5">
              7. Isu Utama (Deskripsi & Ringkasan Peristiwa) *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Jelaskan secara komprehensif substansi peristiwa, keputusan strategis, atau perkembangan intelijen yang terpantau..."
              value={isuUtama}
              onChange={(e) => setIsuUtama(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          {/* 8. Tokoh */}
          <div className="text-xs">
            <label className="block text-slate-700 font-semibold mb-1.5 flex flex-wrap items-center justify-between gap-1">
              <span>8. Tokoh / Pejabat / Institusi Terkait (Opsional)</span>
              <span className="text-[11px] font-normal text-slate-500">
                Bisa lebih dari 1 tokoh (pisahkan dengan koma <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">,</code> atau titik koma <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">;</code>)
              </span>
            </label>
            <input
              type="text"
              list="tokoh-suggestions"
              placeholder="Contoh: Donald Trump, Vladimir Putin; Emmanuel Macron"
              value={tokoh}
              onChange={(e) => setTokoh(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <datalist id="tokoh-suggestions">
              {existingTokoh.map((item, idx) => (
                <option key={idx} value={item} />
              ))}
            </datalist>

            {/* Live Identified Figures Preview */}
            {parseTokohList(tokoh).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2 bg-blue-50/70 p-2.5 rounded-lg border border-blue-200">
                <span className="text-[11px] text-blue-800 font-semibold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Teridentifikasi ({parseTokohList(tokoh).length} Tokoh):
                </span>
                {parseTokohList(tokoh).map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-blue-800 border border-blue-200 shadow-2xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 9. Sumber Informasi (URL & File) */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Bagian II: Sumber Dokumen & Verifikasi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Link className="w-4 h-4 text-blue-600" />
                  Pilihan A: Tautan URL Sumber (Berita / Rilis Resmi)
                </label>
                <input
                  type="url"
                  placeholder="https://kemhan.go.id/news/..."
                  value={sumberUrl}
                  onChange={(e) => setSumberUrl(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Tautan berita, situs resmi kemhan, atau portal intelijen terbuka.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
                  <FileUp className="w-4 h-4 text-emerald-600" />
                  Pilihan B: Unggah Dokumen Produk Intelijen
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx,.pptx,.jpg,.png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Mendukung PDF, DOCX, XLSX, PPTX, dan gambar. Disimpan pada repositori privat.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Formulir
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Data Intelijen'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: BULK IMPORT EXCEL (WITH STRICT VALIDATION & DETAILED ERROR INSPECTOR) */}
      {activeTab === 'excel' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  Validasi Ketat Format Spreadsheet ISMS
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Sistem memeriksa integritas setiap baris data (format tanggal, kepatuhan batas kawasan Amerika & Eropa, 9 bidang baku, dan kelengkapan teks) sebelum disimpan ke database.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Download Template Excel
            </button>
          </div>

          {/* Backup Safety Note */}
          <div className="bg-blue-50/70 border border-blue-200/90 rounded-xl p-3.5 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-blue-600/10 text-blue-700 rounded-lg shrink-0 font-bold text-[11px]">
                🛡️ Proteksi Cadangan
              </span>
              <span className="text-[11px] leading-relaxed">
                Titik cadangan database saat ini:{' '}
                <strong className="font-mono font-bold text-blue-800">
                  {backupInfo.count} rekaman
                </strong>
                . Jika setelah mengimpor bulk ternyata data salah atau keliru, Anda dapat mengembalikannya
                dengan mudah melalui tombol <strong>"Pulihkan dari Backup"</strong> pada bilah navigasi samping.
              </span>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50/60 transition-colors">
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800 mb-1">
              Pilih Berkas Spreadsheet untuk Diperiksa & Diimpor
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Mendukung berkas multi-sheet (.xlsx, .xls, .csv) hingga ribuan baris data
            </p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
              <span>Pilih Berkas Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </label>
            {excelFile && (
              <p className="text-xs font-mono text-blue-700 mt-3 font-semibold">
                Berkas: {excelFile.name} ({(excelFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Multi-Sheet Selector Dropdown (if more than 1 sheet) */}
          {sheetNames.length > 1 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800">Pilih Lembar Kerja (Sheet):</span>
                <span className="text-slate-500">Terdeteksi {sheetNames.length} sheet</span>
              </div>
              <select
                value={selectedSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 font-mono"
              >
                {sheetNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* VALIDATION & DETAILED ERROR INSPECTOR PANEL */}
          {validationReport && (
            <div className="space-y-5 pt-4 border-t border-slate-200">
              {/* Header Status & Action Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Hasil Audit Pra-Impor:</span>
                    <span className="text-blue-700 font-mono">[{selectedSheet}]</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dipindai total {validationReport.totalRowsScanned} baris data
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  {validationReport.invalid.length > 0 && (
                    <button
                      onClick={handleDownloadErrorReport}
                      className="px-3.5 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Laporan Galat ({validationReport.invalid.length})
                    </button>
                  )}
                  <button
                    onClick={handleExecuteImport}
                    disabled={validationReport.valid.length === 0}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simpan {validationReport.valid.length} Baris Valid
                  </button>
                </div>
              </div>

              {/* Status Metric Filter Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {/* 1. Baris Bermasalah (Galat) */}
                <div
                  onClick={() => setPreviewFilterTab('invalid')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilterTab === 'invalid'
                      ? 'bg-red-50 border-red-500 shadow-xs ring-1 ring-red-400'
                      : 'bg-red-50/40 border-red-200 hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-red-800 font-semibold mb-1">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      Baris Bermasalah
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-200 text-red-900 font-bold">
                      Perlu Perbaikan
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-red-700">
                    {validationReport.invalid.length}
                  </div>
                  <p className="text-[11px] text-red-600/80 mt-0.5">
                    {validationReport.invalid.length === 0 ? 'Tidak ada galat' : 'Klik untuk telaah letak kesalahan'}
                  </p>
                </div>

                {/* 2. Baris Valid */}
                <div
                  onClick={() => setPreviewFilterTab('valid')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilterTab === 'valid'
                      ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-400'
                      : 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-emerald-800 font-semibold mb-1">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Baris Valid & Siap
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-200 text-emerald-900 font-bold">
                      Lolos Audit
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700">
                    {validationReport.valid.length}
                  </div>
                  <p className="text-[11px] text-emerald-600/80 mt-0.5">
                    Memenuhi standar ISMS
                  </p>
                </div>

                {/* 3. Duplikat */}
                <div
                  onClick={() => setPreviewFilterTab('duplicates')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilterTab === 'duplicates'
                      ? 'bg-amber-50 border-amber-500 shadow-xs ring-1 ring-amber-400'
                      : 'bg-amber-50/40 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-amber-800 font-semibold mb-1">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Terindikasi Duplikat
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-200 text-amber-900 font-bold">
                      Perhatian
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-700">
                    {validationReport.duplicates.length}
                  </div>
                  <p className="text-[11px] text-amber-600/80 mt-0.5">
                    Data berulang terdeteksi
                  </p>
                </div>

                {/* 4. Total Baris */}
                <div
                  onClick={() => setPreviewFilterTab('all')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilterTab === 'all'
                      ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-400'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-800 font-semibold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      Semua Baris
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-800">
                    {validationReport.totalRowsScanned}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Total baris yang dipindai
                  </p>
                </div>
              </div>

              {/* SECTION A: DETAILED ERROR INSPECTOR (BARIS BERMASALAH) */}
              {previewFilterTab === 'invalid' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      Daftar Rincian Letak Kesalahan Data ({validationReport.invalid.length} baris)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Klik "Koreksi Baris" untuk memperbaiki langsung pada sistem
                    </span>
                  </div>

                  {validationReport.invalid.length > 0 ? (
                    <div className="space-y-3">
                      {validationReport.invalid.map((item) => (
                        <div
                          key={item.rowNumber}
                          className="bg-white rounded-xl border-2 border-red-300 shadow-xs p-4 text-xs space-y-3 hover:border-red-400 transition-colors"
                        >
                          {/* Row Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-red-100">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-md bg-red-600 text-white font-mono font-bold text-xs shadow-xs">
                                Baris Excel #{item.rowNumber}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600 font-semibold">
                                Kolom Bermasalah:
                              </span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {item.columnsWithErrors.map((col, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono font-bold text-[10px] border border-red-200"
                                  >
                                    [{col}]
                                  </span>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => setEditingRow(item)}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Koreksi Baris Ini
                            </button>
                          </div>

                          {/* Bullet points of specific reasons */}
                          <div className="bg-red-50/60 p-3 rounded-lg border border-red-100 space-y-1.5">
                            <span className="font-semibold text-red-900 block text-[11px]">
                              Penyebab Galat & Kekurangan:
                            </span>
                            {item.errorMessages.map((msg, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-red-800 text-xs">
                                <span className="text-red-500 font-bold shrink-0">✕</span>
                                <span className="leading-relaxed">{msg}</span>
                              </div>
                            ))}
                          </div>

                          {/* Raw Data Preview of that Row */}
                          <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 overflow-x-auto">
                            <span className="font-sans font-semibold text-slate-700 block mb-1">
                              Isi Data Baris Excel Asli:
                            </span>
                            <div className="whitespace-pre-wrap break-all text-slate-600">
                              {JSON.stringify(item.rawRow)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center text-emerald-800">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                      <h4 className="font-bold text-sm">Tidak Ditemukan Kesalahan Data!</h4>
                      <p className="text-xs text-emerald-700 mt-1">
                        Semua baris memenuhi parameter validasi baku ISMS.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION B: VALID ROWS PREVIEW */}
              {previewFilterTab === 'valid' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Daftar Baris Valid ({validationReport.valid.length} baris siap diimpor)
                    </h4>
                  </div>

                  {validationReport.valid.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5 font-mono">No</th>
                            <th className="p-2.5">Tanggal</th>
                            <th className="p-2.5">Benua</th>
                            <th className="p-2.5">Negara</th>
                            <th className="p-2.5">Bidang</th>
                            <th className="p-2.5">Kegiatan</th>
                            <th className="p-2.5">Bentuk Kegiatan</th>
                            <th className="p-2.5">Tokoh</th>
                            <th className="p-2.5">Isu Utama</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {validationReport.valid.slice(0, 10).map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono text-slate-400">{i + 1}</td>
                              <td className="p-2.5 font-mono">{row.tanggal}</td>
                              <td className="p-2.5 font-medium">{row.benua}</td>
                              <td className="p-2.5 font-semibold text-slate-900">{row.negara}</td>
                              <td className="p-2.5">{row.bidang}</td>
                              <td className="p-2.5">{row.kegiatan}</td>
                              <td className="p-2.5">{row.bentukKegiatan}</td>
                              <td className="p-2.5">
                                {row.tokoh ? (
                                  <div className="flex flex-wrap gap-1 max-w-[170px]">
                                    {parseTokohList(row.tokoh).map((t: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">-</span>
                                )}
                              </td>
                              <td className="p-2.5 truncate max-w-xs">{row.isuUtama}</td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                                  Valid
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {validationReport.valid.length > 10 && (
                        <div className="p-2.5 bg-slate-50 text-center text-slate-500 text-[11px] font-mono border-t border-slate-200">
                          + Menampilkan 10 dari {validationReport.valid.length} baris valid yang siap disimpan
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
                      Belum ada baris valid yang terkonfirmasi.
                    </div>
                  )}
                </div>
              )}

              {/* SECTION C: DUPLICATES PREVIEW */}
              {previewFilterTab === 'duplicates' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Baris Terindikasi Duplikat ({validationReport.duplicates.length} rekaman)
                  </h4>

                  {validationReport.duplicates.length > 0 ? (
                    <div className="space-y-2.5">
                      {validationReport.duplicates.map((dup, idx) => (
                        <div
                          key={idx}
                          className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold text-amber-900">
                            <span>Baris Excel #{dup.rowNumber}</span>
                            <span className="text-[11px] text-amber-700 italic">{dup.reason}</span>
                          </div>
                          <p className="text-slate-700">
                            <strong>{dup.data.negara}</strong> ({dup.data.tanggal}) - {dup.data.bidang}
                          </p>
                          <p className="text-slate-600 italic truncate">{dup.data.isuUtama}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
                      Tidak terdeteksi adanya duplikasi data.
                    </div>
                  )}
                </div>
              )}

              {/* SECTION D: ALL ROWS PREVIEW */}
              {previewFilterTab === 'all' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Ringkasan Seluruh Baris ({validationReport.totalRowsScanned} baris)
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <p className="text-slate-700">
                      Total baris terbaca: <strong>{validationReport.totalRowsScanned}</strong>
                    </p>
                    <p className="text-emerald-700">
                      Baris berstatus valid: <strong>{validationReport.valid.length}</strong>
                    </p>
                    <p className="text-red-700">
                      Baris berstatus galat: <strong>{validationReport.invalid.length}</strong>
                    </p>
                    <p className="text-amber-700">
                      Baris terindikasi duplikat: <strong>{validationReport.duplicates.length}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: INLINE ROW CORRECTION */}
      {editingRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRowCorrection}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in duration-200"
          >
            {/* Modal Header */}
            <div className="bg-navy-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    Koreksi Data Baris #{editingRow.rowNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Lengkapi atau perbaiki data yang belum sesuai sebelum diimpor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Highlights Banner inside Modal */}
            <div className="bg-red-50 p-4 border-b border-red-100 text-xs text-red-900 space-y-1">
              <span className="font-bold block">Penyebab Kesalahan Sebelumnya:</span>
              {editingRow.errorMessages.map((msg, i) => (
                <div key={i} className="flex items-start gap-1.5 text-red-800">
                  <span className="text-red-600 font-bold">•</span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>

            {/* Form Fields for Quick Fix */}
            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tanggal (YYYY-MM-DD) *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingRow.draft.tanggal}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        draft: { ...editingRow.draft, tanggal: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Benua *</label>
                  <select
                    value={editingRow.draft.benua}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        draft: { ...editingRow.draft, benua: e.target.value as Continent },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="Amerika">Amerika</option>
                    <option value="Eropa">Eropa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Negara *</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Amerika Serikat, Rusia, dll"
                    value={editingRow.draft.negara}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        draft: { ...editingRow.draft, negara: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bidang *</label>
                <select
                  value={editingRow.draft.bidang}
                  onChange={(e) =>
                    setEditingRow({
                      ...editingRow,
                      draft: { ...editingRow.draft, bidang: e.target.value as StrategicComponent },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {STRATEGIC_COMPONENTS.map((comp) => (
                    <option key={comp.id} value={comp.name}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kegiatan *</label>
                  <input
                    type="text"
                    required
                    value={editingRow.draft.kegiatan}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        draft: { ...editingRow.draft, kegiatan: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bentuk Kegiatan *</label>
                  <input
                    type="text"
                    required
                    value={editingRow.draft.bentukKegiatan}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        draft: { ...editingRow.draft, bentukKegiatan: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Isu Utama *</label>
                <textarea
                  required
                  rows={4}
                  value={editingRow.draft.isuUtama}
                  onChange={(e) =>
                    setEditingRow({
                      ...editingRow,
                      draft: { ...editingRow.draft, isuUtama: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 leading-relaxed"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex flex-wrap items-center justify-between gap-1">
                    <span>Tokoh (Opsional)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Pemisah: koma (,) atau titik koma (;)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Donald Trump, Vladimir Putin; Emmanuel Macron"
                    value={editingRow.draft.tokoh || ''}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        draft: { ...editingRow.draft, tokoh: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                  {editingRow.draft.tokoh && parseTokohList(editingRow.draft.tokoh).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {parseTokohList(editingRow.draft.tokoh).map((t: string, idx: number) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sumber URL (Opsional)</label>
                  <input
                    type="url"
                    value={editingRow.draft.sumberUrl || ''}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        draft: { ...editingRow.draft, sumberUrl: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Simpan Koreksi & Validasi Ulang
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
