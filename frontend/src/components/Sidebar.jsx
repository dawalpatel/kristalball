import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  ArrowLeftRight, 
  UserCheck, 
  Flame, 
  Users, 
  FileText, 
  ShieldAlert,
  Building2,
  Wrench
} from 'lucide-react';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
    { label: 'Inventory', path: '/inventory', icon: Package, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
    { label: 'Purchases', path: '/purchases', icon: ShoppingBag, roles: ['ADMIN', 'LOGISTICS_OFFICER'] },
    { label: 'Transfers', path: '/transfers', icon: ArrowLeftRight, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
    { label: 'Assignments', path: '/assignments', icon: UserCheck, roles: ['ADMIN', 'BASE_COMMANDER'] },
    { label: 'Expenditures', path: '/expenditures', icon: Flame, roles: ['ADMIN', 'BASE_COMMANDER'] },
    { label: 'User Administration', path: '/users', icon: Users, roles: ['ADMIN'] },
    { label: 'Audit Logs', path: '/audit-logs', icon: FileText, roles: ['ADMIN'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 lg:hidden"
        />
      )}

      <aside className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header Branding */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 bg-slate-950/60">
          <ShieldAlert className="w-7 h-7 text-emerald-500 shrink-0" />
          <div>
            <h1 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">Military Logistics</h1>
            <p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">Asset Management</p>
          </div>
        </div>

        {/* User Info Badge */}
        <div className="p-4 mx-3 my-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
          <p className="text-xs font-bold text-slate-200 truncate">{user.name}</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              {role.replace('_', ' ')}
            </span>
          </div>
          {user.base && (
            <p className="text-[11px] text-slate-400 font-medium pt-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-500" />
              {user.base.name}
            </p>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-900/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center font-mono">
          System v1.0.0 &bull; Restricted Access
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
