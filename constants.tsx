
import { Category, Professional, WorkSchedule, InventoryItem } from './types';

// Usamos variáveis CSS para permitir o tema dinâmico, com fallback para as cores originais
export const COLORS = {
  pink: 'var(--color-primary, #FF69B4)', // Vibrant Pink (Primary)
  turquoise: 'var(--color-secondary, #40E0D0)', // Energizing Turquoise (Success)
  purple: '#C71585', // Lavender Purple (Loyalty)
  yellow: '#FFD700', // Sun Yellow (Upsell/Alert)
  mint: '#98FB98', // Mint Green (Financial Pos)
  white: '#FFFFFF',
  cardBg: '#F5F5F5',
};

// Helper para gerar datas dinâmicas (YYYY-MM-DD)
const getRelativeDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TODAY = getRelativeDate(0);
const TOMORROW = getRelativeDate(1);

export const MOCK_CATEGORIES: Category[] = [
  { id: 'Cabelo', label: 'Cabelo', iconName: 'Scissors' },
  { id: 'Unhas', label: 'Unhas', iconName: 'Droplet' },
  { id: 'Estética', label: 'Estética', iconName: 'Wand2' },
  { id: 'Tratamentos', label: 'Tratamentos', iconName: 'Sparkles' },
];

export const MOCK_INVENTORY_CATEGORIES: Category[] = [
  { id: 'Cabelo', label: 'Cabelo', iconName: 'Scissors' },
  { id: 'Estética', label: 'Estética', iconName: 'Sparkles' },
  { id: 'Produtos', label: 'Produtos', iconName: 'ShoppingBag' },
  { id: 'Descartáveis', label: 'Descartáveis', iconName: 'Package' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { 
    id: 'inv1', 
    name: 'Shampoo Lavatório 5L', 
    type: 'consumable', 
    category: 'Cabelo', 
    quantity: 2, 
    unit: 'un', 
    minLevel: 1, 
    costPrice: 120.00, 
    supplier: 'L\'Oréal Pro' 
  },
  { 
    id: 'inv2', 
    name: 'Kit Home Care Pós-Química', 
    type: 'resale', 
    category: 'Produtos', 
    quantity: 8, 
    unit: 'kit', 
    minLevel: 5, 
    costPrice: 45.00, 
    salePrice: 120.00, 
    supplier: 'Truss' 
  },
  { 
    id: 'inv3', 
    name: 'Cera Depilatória Roll-on', 
    type: 'consumable', 
    category: 'Estética', 
    quantity: 12, 
    unit: 'refil', 
    minLevel: 10, 
    costPrice: 8.50, 
    supplier: 'DepilBella' 
  },
  { 
    id: 'inv4', 
    name: 'Óleo Reparador de Pontas', 
    type: 'resale', 
    category: 'Produtos', 
    quantity: 3, 
    unit: 'un', 
    minLevel: 6, 
    costPrice: 25.00, 
    salePrice: 65.00, 
    supplier: 'Wella' 
  }
];

export const MOCK_CLIENTS = [
  { id: '1', name: 'Maria Silva', phone: '31988887777', lastVisit: '2025-01-20', totalSpent: 1250, loyaltyPoints: 120, tags: ['Fiel', 'Mechas'] },
  { id: '2', name: 'Ana Souza', phone: '31977776666', lastVisit: '2025-02-01', totalSpent: 450, loyaltyPoints: 45, tags: ['Progressiva'] },
  { id: '3', name: 'Carla Oliveira', phone: '31966665555', lastVisit: '2024-12-15', totalSpent: 890, loyaltyPoints: 89, tags: ['Corte', 'Hidratação'] },
  { id: '4', name: 'Fernanda Lima', phone: '31955554444', lastVisit: '2025-01-10', totalSpent: 200, loyaltyPoints: 20, tags: ['Novo'] },
];

export const MOCK_APPOINTMENTS = [
  { id: '101', clientId: '1', clientName: 'Maria Silva', service: 'Mechas + Reconstrução', date: TODAY, time: '14:00', status: 'confirmed', price: 350, professionalId: 'p1' },
  { id: '102', clientId: '2', clientName: 'Ana Souza', service: 'Manicure', date: TODAY, time: '16:30', status: 'confirmed', price: 60, professionalId: 'p3' },
  { id: '103', clientId: '3', clientName: 'Carla Oliveira', service: 'Corte Bordado', date: TOMORROW, time: '10:00', status: 'pending', price: 120, professionalId: 'p1' },
  { id: '104', clientId: '4', clientName: 'Fernanda Lima', service: 'Limpeza de Pele', date: TOMORROW, time: '14:00', status: 'confirmed', price: 150, professionalId: 'p2' },
];

// Helper para criar agenda padrão (Seg-Sáb 09-19, Dom Off)
const createDefaultSchedule = (): WorkSchedule => {
  const schedule: WorkSchedule = {};
  for (let i = 0; i < 7; i++) {
    const isWeekend = i === 0; // Domingo
    schedule[i] = {
      isOff: isWeekend,
      workStart: '09:00',
      workEnd: '19:00',
      lunchStart: '12:00',
      lunchEnd: '13:00',
      breakStart: '16:00',
      breakEnd: '16:15'
    };
  }
  return schedule;
};

export const MOCK_PROFESSIONALS: Professional[] = [
  { 
    id: 'p1', 
    name: 'Lívia Nicolly', 
    role: 'Master Stylist', 
    specialties: ['Mechas Criativas', 'Visagismo', 'Corte'],
    services: ['s1', 's2', 's5'], // Mechas, Corte, Hidratação
    commissionRate: 100, 
    avatar: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=150&h=150&fit=crop',
    rating: 5.0,
    revenueGenerated: 8500,
    appointmentsCount: 142,
    schedule: createDefaultSchedule()
  },
  { 
    id: 'p2', 
    name: 'Rafael Mendes', 
    role: 'Colorista Senior', 
    specialties: ['Colorimetria', 'Tratamentos', 'Estética Facial'], 
    services: ['s1', 's4', 's5', 's6'], // Mechas, Limpeza de Pele, Hidratação, Designer Sobrancelhas
    commissionRate: 40, 
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop',
    rating: 4.9,
    revenueGenerated: 4200,
    appointmentsCount: 88,
    schedule: createDefaultSchedule()
  },
  { 
    id: 'p3', 
    name: 'Beatriz Luz', 
    role: 'Manicure & Nail Art', 
    specialties: ['Gel', 'Blindagem', 'Decoração'], 
    services: ['s3'], // Manicure
    commissionRate: 50, 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    rating: 4.8,
    revenueGenerated: 2100,
    appointmentsCount: 156,
    schedule: createDefaultSchedule()
  }
];

export const MOCK_SERVICES = [
  { id: 's1', name: 'Mechas Criativas', category: 'Cabelo', duration: '3h 30min', price: 450, description: 'Técnica personalizada de iluminação com proteção dos fios.', color: COLORS.pink },
  { id: 's2', name: 'Corte Visagista', category: 'Cabelo', duration: '1h 00min', price: 120, description: 'Corte focado no formato do rosto e personalidade.', color: COLORS.pink },
  { id: 's3', name: 'Manicure Gel', category: 'Unhas', duration: '1h 30min', price: 85, description: 'Esmaltação em gel com durabilidade de até 20 dias.', color: COLORS.turquoise },
  { id: 's4', name: 'Limpeza de Pele', category: 'Estética', duration: '1h 15min', price: 150, description: 'Remoção de impurezas e hidratação profunda.', color: COLORS.purple },
  { id: 's5', name: 'Hidratação Intensiva', category: 'Tratamentos', duration: '45min', price: 90, description: 'Tratamento nutritivo para brilho e maciez extrema.', color: COLORS.mint },
  { id: 's6', name: 'Designer de Sobrancelhas', category: 'Estética', duration: '45min', price: 55, description: 'Design personalizado realçando o olhar com pinça e acabamento.', color: COLORS.purple },
];