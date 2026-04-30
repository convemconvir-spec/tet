import { db } from '../../lib/localDb.js';

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, MapPin, FileCheck, DollarSign,
  ClipboardList, Menu, X, ChevronRight, LogOut, Boxes, HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'representante'] },
  { path: '/products', label: 'Produtos', icon: Package, roles: ['admin'] },
  { path: '/resellers', label: 'Revendedoras', icon: Users, roles: ['admin', 'representante'] },
  { path: '/kits', label: 'Kits', icon: Boxes, roles: ['admin', 'representante'] },
  { path: '/map', label: 'Mapa & Rotas', icon: MapPin, roles: ['admin', 'representante'] },
  { path: '/settlements', label: 'Acertos', icon: FileCheck, roles: ['admin', 'representante'] },
  { path: '/finance', label: 'Financeiro', icon: DollarSign, roles: ['admin'] },
  { path: '/backup', label: 'Backup', icon: HardDrive, roles: ['admin'] },
];

export default function Sidebar({ user }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const role = user?.role || 'representante';

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-primary text-primary-foreground shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300",
        "lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">ConsigFlow</h1>
              <span className="text-xs font-medium text-sidebar-primary">PRO</span>
            </div>
            <button onClick={() => setOpen(false)} className="lg:hidden text-sidebar-foreground/70">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-sidebar-primary">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Usuário'}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{role}</p>
            </div>
            <button
              onClick={() => db.auth.logout()}
              className="text-sidebar-foreground/50 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}