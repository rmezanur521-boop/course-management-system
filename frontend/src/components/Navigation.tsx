/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, ShieldCheck, Database, Wifi, GitFork, Server, Globe, User } from 'lucide-react';
import { ApiConfig } from '../types';

interface NavigationProps {
  currentView: 'catalog' | 'student' | 'admin';
  onChangeView: (view: 'catalog' | 'student' | 'admin') => void;
  apiConfig: ApiConfig;
  onOpenConfig: () => void;
  isConnected: boolean | null;
}

export default function Navigation({
  currentView,
  onChangeView,
  apiConfig,
  onOpenConfig,
  isConnected,
}: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0f172a]/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-white/10">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Nexus Academy
            </span>
            <span className="block text-[10px] font-mono tracking-wider text-indigo-400 uppercase font-semibold">
              Course Management Hub
            </span>
          </div>
        </div>

        {/* View Switches */}
        <nav className="flex items-center gap-2">
          <button
            id="nav-catalog-btn"
            onClick={() => onChangeView('catalog')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 border cursor-pointer ${
              currentView === 'catalog'
                ? 'bg-white/10 text-white border-white/15 shadow-inner'
                : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Public Catalog</span>
          </button>

          <button
            id="nav-student-btn"
            onClick={() => onChangeView('student')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 border cursor-pointer ${
              currentView === 'student'
                ? 'bg-white/10 text-white border-white/15 shadow-inner'
                : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Student Dashboard</span>
          </button>

          <button
            id="nav-admin-btn"
            onClick={() => onChangeView('admin')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 border cursor-pointer ${
              currentView === 'admin'
                ? 'bg-indigo-500/20 text-indigo-250 font-semibold border-indigo-500/30 shadow-inner'
                : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Admin Control</span>
          </button>
        </nav>

        {/* API Status Switcher Button */}
        <div className="flex items-center gap-2">
          <button
            id="nav-api-badge"
            onClick={onOpenConfig}
            className={`group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-mono transition-all duration-200 border cursor-pointer ${
              apiConfig.isLive
                ? isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-450 hover:bg-indigo-500/20'
            }`}
            title="Configure connection to your live FastAPI backend"
          >
            {apiConfig.isLive ? (
              <>
                <Wifi className={`h-3 w-3 ${isConnected ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
                <span className="font-semibold block max-w-[120px] truncate">
                  {isConnected ? 'FastAPI: Online' : 'FastAPI: Offline'}
                </span>
              </>
            ) : (
              <>
                <Database className="h-3 w-3 text-indigo-400 group-hover:rotate-12 transition-transform" />
                <span className="font-semibold">Local Sandbox</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
