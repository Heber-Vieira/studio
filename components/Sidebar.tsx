import React from 'react';
import { View, UserRole, SalonSettings } from '../types';
import {
  LayoutGrid,
  CalendarDays,
  UsersRound,
  Wallet,
  Megaphone,
  Menu,
  X,
  Scissors,
  Settings2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Package,
  ArrowUpRight,
  HelpCircle
} from 'lucide-react';
import { COLORS } from '../constants';

interface SidebarProps {
  t: any;
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  toggleOpen: () => void;
  logo?: string;
  userRole: UserRole;
  settings?: SalonSettings;
  onShowHelp: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ t, activeView, onViewChange, isOpen, toggleOpen, logo, userRole, settings, onShowHelp }) => {

  // Icon configuration with consistent styling
  const iconSize = 20;
  const strokeWidth = 1.5;

  const allMenuItems = [
    {
      id: View.DASHBOARD,
      label: t.sidebar.home,
      icon: LayoutGrid,
      roles: ['master_admin', 'company_admin', 'attendant']
    },
    {
      id: View.APPOINTMENTS,
      label: t.sidebar.appointments,
      icon: CalendarDays,
      roles: ['master_admin', 'company_admin', 'attendant']
    },
    {
      id: View.CRM,
      label: t.sidebar.clients,
      icon: UsersRound,
      roles: ['master_admin', 'company_admin', 'attendant'],
      permissionKey: 'viewCRM'
    },
    {
      id: View.STAFF,
      label: t.sidebar.staff,
      icon: Scissors,
      roles: ['master_admin', 'company_admin', 'attendant'],
      permissionKey: 'viewStaff'
    },
    {
      id: View.SERVICES,
      label: t.sidebar.services,
      icon: Sparkles,
      roles: ['master_admin', 'company_admin', 'attendant'],
      permissionKey: 'viewServices'
    },
    {
      id: View.INVENTORY,
      label: 'Estoque',
      icon: Package,
      roles: ['master_admin', 'company_admin', 'attendant'],
      permissionKey: 'viewInventory'
    },
    {
      id: View.FINANCIAL,
      label: t.sidebar.financial,
      icon: Wallet,
      roles: ['master_admin', 'company_admin', 'attendant'],
      permissionKey: 'viewFinancial'
    },
    {
      id: View.MARKETING,
      label: t.sidebar.marketing,
      icon: Megaphone,
      roles: ['master_admin', 'company_admin', 'attendant'],
      permissionKey: 'viewMarketing'
    },
  ];

  const filteredMenuItems = allMenuItems.filter(item => {
    if (!item.roles.includes(userRole)) return false;
    if (userRole === 'attendant' && item.permissionKey && settings?.permissions) {
      // @ts-ignore
      return settings.permissions[item.permissionKey] === true;
    }
    return true;
  });

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={toggleOpen}
        />
      )}

      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg md:hidden border border-gray-100 animate-in fade-in zoom-in top-[calc(1rem+env(safe-area-inset-top))]"
        >
          <Menu size={20} strokeWidth={2} className="text-[#FF69B4]" />
        </button>
      )}

      <aside className={`
        ${isOpen ? 'w-64' : 'w-20'} 
        bg-[#F5F5F5] border-r border-gray-200 flex flex-col transition-all duration-500 ease-in-out
        fixed md:relative z-40 h-full
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        <button
          onClick={toggleOpen}
          className="hidden md:flex absolute -right-3.5 top-20 z-50 w-7 h-7 bg-white border border-gray-200 rounded-full items-center justify-center text-[#FF69B4] shadow-md hover:scale-110 active:scale-95 transition-all group"
          title={isOpen ? "Recolher Menu" : "Expandir Menu"}
        >
          {isOpen ? <ChevronLeft size={16} strokeWidth={2} /> : <ChevronRight size={16} strokeWidth={2} />}
        </button>

        {/* BRAND ZONE */}
        <div className={`
          ${isOpen ? 'p-8 pb-4' : 'py-8 px-4'} 
          flex flex-col items-center transition-all duration-500 ease-in-out
          safe-pt relative
        `}>
          <div className={`
            ${isOpen ? 'w-24 h-24 mb-4' : 'w-12 h-12 mb-0'} 
            bg-white rounded-[2rem] flex-shrink-0 flex items-center justify-center 
            overflow-hidden shadow-[0_20px_40px_-10px_rgba(255,105,180,0.2)] 
            border border-white transition-all duration-500 group cursor-pointer
          `}>
            {logo ? (
              <img src={logo} alt="Studio Logo" className="w-full h-full object-contain p-2 transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#FF69B4] to-[#C71585] flex items-center justify-center text-white font-black text-3xl">B</div>
            )}
          </div>

          {isOpen && (
            <div className="text-center fade-in space-y-0.5">
              <h2 className="font-black text-2xl tracking-tighter text-gray-900">BellaAI</h2>
              <div className="flex items-center justify-center gap-1.5">
                <div className="h-px w-3 bg-gray-200" />
                <span className="text-[9px] font-black text-[#FF69B4] uppercase tracking-[0.3em]">Luxury Studio</span>
                <div className="h-px w-3 bg-gray-200" />
              </div>
            </div>
          )}

          {isOpen && (
            <button onClick={toggleOpen} className="md:hidden absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-[#FF69B4]">
              <X size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {filteredMenuItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                title={!isOpen ? item.label : undefined}
                onClick={() => {
                  onViewChange(item.id as View);
                  if (window.innerWidth < 768) toggleOpen();
                }}
                className={`
                  w-full flex items-center ${isOpen ? 'gap-4 px-4' : 'justify-center'} py-3.5 rounded-[1.2rem] transition-all duration-300 touch-manipulation
                  ${isActive
                    ? 'bg-white text-[#FF69B4] shadow-[0_10px_25px_-5px_rgba(255,105,180,0.15)]'
                    : 'text-gray-500 hover:bg-white/80 hover:text-gray-900'}
                `}
              >
                <item.icon
                  size={iconSize}
                  strokeWidth={strokeWidth}
                  color={isActive ? COLORS.pink : '#9CA3AF'}
                  className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                />
                {isOpen && (
                  <span className={`font-bold text-sm whitespace-nowrap fade-in transition-colors ${isActive ? 'text-gray-900' : ''}`}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}

          <div className="h-px bg-gray-200/50 my-5 mx-4" />

          <button
            onClick={() => onViewChange(View.CLIENT_BOOKING)}
            className={`
               w-full flex items-center ${isOpen ? 'gap-4 px-4' : 'justify-center'} py-3.5 rounded-[1.2rem] transition-all duration-300 touch-manipulation
               bg-gradient-to-r from-[#40E0D0]/5 to-[#FF69B4]/5 text-gray-600 hover:from-[#40E0D0]/10 hover:to-[#FF69B4]/10 hover:scale-[1.02] active:scale-95 group
            `}
          >
            <ExternalLink
              size={iconSize}
              strokeWidth={strokeWidth}
              color={COLORS.turquoise}
              className="flex-shrink-0 transition-transform group-hover:rotate-12"
            />
            {isOpen && (
              <div className="flex flex-col items-start leading-none fade-in">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">Booking Portal</span>
                <span className="text-[8px] font-bold text-gray-400 mt-0.5 uppercase">Acesso Externo</span>
              </div>
            )}
          </button>
        </nav>

        {(userRole === 'master_admin' || userRole === 'company_admin') && (
          <div className="px-4 py-6 border-t border-gray-200/50 space-y-4 safe-pb">
            <button
              onClick={onShowHelp}
              className={`
                w-full flex items-center ${isOpen ? 'gap-4 px-4' : 'justify-center'} py-3.5 rounded-[1.2rem] transition-all duration-300 touch-manipulation
                bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100/50 mb-2 group
               `}
            >
              <HelpCircle
                size={iconSize}
                strokeWidth={strokeWidth}
                className="flex-shrink-0 transition-transform group-hover:rotate-[15deg] group-active:scale-90"
              />
              {isOpen && <span className="font-bold text-sm whitespace-nowrap fade-in">Central de Ajuda</span>}
            </button>

            <button
              onClick={() => { onViewChange(View.SETTINGS); if (window.innerWidth < 768) toggleOpen(); }}
              className={`
                w-full flex items-center ${isOpen ? 'gap-4 px-4' : 'justify-center'} py-3.5 rounded-[1.2rem] transition-all duration-300 touch-manipulation
                ${activeView === View.SETTINGS
                  ? 'bg-white text-[#FF69B4] shadow-sm'
                  : 'text-gray-500 hover:bg-white hover:text-gray-900'}
               `}
            >
              <Settings2
                size={iconSize}
                strokeWidth={strokeWidth}
                color={activeView === View.SETTINGS ? COLORS.pink : '#9CA3AF'}
                className={`flex-shrink-0 transition-all ${activeView === View.SETTINGS ? 'rotate-90' : ''}`}
              />
              {isOpen && <span className="font-bold text-sm whitespace-nowrap fade-in">{t.sidebar.settings}</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;