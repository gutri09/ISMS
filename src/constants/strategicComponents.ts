import { StrategicComponent } from '../types';

export interface ComponentMeta {
  id: number;
  name: StrategicComponent;
  code: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  description: string;
}

export const STRATEGIC_COMPONENTS: ComponentMeta[] = [
  {
    id: 1,
    name: 'Ekonomi',
    code: 'EKO',
    color: '#059669', // Emerald
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    iconName: 'TrendingUp',
    description: 'Aktivitas perdagangan, moneter, pasar modal, industri, dan kerja sama ekonomi makro/mikro.',
  },
  {
    id: 2,
    name: 'Angkatan Bersenjata',
    code: 'AB',
    color: '#DC2626', // Red
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    iconName: 'Shield',
    description: 'Postur militer, alutsista, latihan perang, pergerakan pasukan, dan kerja sama pertahanan.',
  },
  {
    id: 3,
    name: 'Ilmu Pengetahuan dan Teknologi',
    code: 'IPTEK',
    color: '#7C3AED', // Violet
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    iconName: 'Cpu',
    description: 'Inovasi teknologi, siber, kedirgantaraan, energi nuklir/terbarukan, dan riset strategis.',
  },
  {
    id: 4,
    name: 'Sosial',
    code: 'SOS',
    color: '#EA580C', // Orange
    bgColor: '#FFF7ED',
    borderColor: '#FFEDD5',
    iconName: 'Users',
    description: 'Dinamika masyarakat, migrasi, unjuk rasa, demografi, krisis kemanusiaan, dan opini publik.',
  },
  {
    id: 5,
    name: 'Biografi',
    code: 'BIO',
    color: '#4F46E5', // Indigo
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    iconName: 'UserCheck',
    description: 'Profil, rekam jejak, pernyataan, dan jejaring relasi tokoh kunci politik, militer, dan bisnis.',
  },
  {
    id: 6,
    name: 'Sejarah',
    code: 'SEJ',
    color: '#D97706', // Amber
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    iconName: 'Clock',
    description: 'Latar historis, sengketa wilayah masa lampau, perjanjian lama, dan preseden geopolitik.',
  },
  {
    id: 7,
    name: 'Geografi',
    code: 'GEO',
    color: '#0D9488', // Teal
    bgColor: '#F0FDFA',
    borderColor: '#99F6E4',
    iconName: 'MapPin',
    description: 'Karakteristik medan, perbatasan negara, jalur pelayaran strategis, dan sumber daya alam.',
  },
  {
    id: 8,
    name: 'Politik',
    code: 'POL',
    color: '#2563EB', // Blue
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    iconName: 'Landmark',
    description: 'Pemilu, suksesi kekuasaan, diplomasi bilateral/multilateral, traktat, dan kebijakan luar negeri.',
  },
  {
    id: 9,
    name: 'Transportasi dan Telekomunikasi',
    code: 'TRANSTEL',
    color: '#0284C7', // Sky
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    iconName: 'Radio',
    description: 'Infrastruktur logistik, pelabuhan, bandara, jaringan kabel bawah laut, dan telekomunikasi satelit.',
  },
];

export const getComponentMeta = (name: string): ComponentMeta => {
  return (
    STRATEGIC_COMPONENTS.find((c) => c.name.toLowerCase() === name.toLowerCase()) || {
      id: 0,
      name: 'Politik',
      code: 'POL',
      color: '#64748B',
      bgColor: '#F8FAFC',
      borderColor: '#E2E8F0',
      iconName: 'FileText',
      description: 'Komponen Strategis Umum',
    }
  );
};
