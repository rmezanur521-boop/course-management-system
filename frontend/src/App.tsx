/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, AlertCircle, Database } from 'lucide-react';
import Navigation from './components/Navigation';
import PublicCatalog from './components/PublicCatalog';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Category, Course, Student, Enrollment, Payment, ApiConfig } from './types';
import * as api from './lib/api';

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<'catalog' | 'student' | 'admin'>('catalog');
  
  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // System Configuration State
  const [apiConfig, setApiConfig] = useState<ApiConfig>({ baseUrl: 'http://localhost:8000', isLive: false });
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorHeader, setErrorHeader] = useState('');

  // Config modal popup helper for clicking connection badge
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [draftBaseUrl, setDraftBaseUrl] = useState('');

  /**
   * Combined service orchestrator to fetch all FastAPI schemas / Storage tables
   * Wrapped in useCallback to prevent unnecessary re-renders (Performance Optimization)
   */
  const fetchGlobalData = useCallback(async (config: ApiConfig) => {
    setIsLoading(true);
    setErrorHeader('');
    try {
      // If live mode is on, perform rapid ping verification
      if (config.isLive) {
        const online = await api.checkApiHealth(config.baseUrl);
        setIsConnected(online);
        if (!online) {
          throw new Error(`Your FastAPI server at "${config.baseUrl}" appears to be offline or CORS security is not configured.`);
        }
      } else {
        setIsConnected(null);
      }

      // Fetch categories & other records sequentially
      const catsList = await api.getCategories();
      const coursesList = await api.getCourses();
      const studentsList = await api.getStudents();
      const enrollmentsList = await api.getEnrollments();
      const paymentsList = await api.getPayments();

      setCategories(catsList);
      setCourses(coursesList);
      setStudents(studentsList);
      setEnrollments(enrollmentsList);
      setPayments(paymentsList);

    } catch (err: any) {
      console.warn('Sync warning:', err.message);
      setErrorHeader(err.message || 'Error occurred during backend connection sync.');
      
      if (config.isLive) {
        setErrorHeader(`FastAPI server unreachable: Falling back temporarily to Local Storage Sandbox so dashboard remains functional! Check your endpoint settings.`);
      }
      
      // Intelligent fallback logic: State successfully updated with local values on live fail
      try {
        const catsList = await api.getCategories();
        const coursesList = await api.getCourses();
        const studentsList = await api.getStudents();
        const enrollmentsList = await api.getEnrollments();
        const paymentsList = await api.getPayments();

        setCategories(catsList);
        setCourses(coursesList);
        setStudents(studentsList);
        setEnrollments(enrollmentsList);
        setPayments(paymentsList);
      } catch (fallbackErr) {
        console.error('Critical storage read failure:', fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize and load records on application startup
   */
  useEffect(() => {
    // 1. Initialise standard localStorage sandbox tables
    api.initializeStorage();
    
    // 2. Read configurations
    const config = api.getApiConfig();
    setApiConfig(config);
    setDraftBaseUrl(config.baseUrl);

    // 3. Complete database load
    fetchGlobalData(config);
  }, [fetchGlobalData]);

  /**
   * Action: Save Connection details from configuration panel
   */
  const handleUpdateApiConfig = async (newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    api.saveApiConfig(newConfig);
    await fetchGlobalData(newConfig);
  };

  /**
   * Action: Independent trigger to run physical test connection ping on baseUrl
   */
  const handleTestConnection = async () => {
    setErrorHeader('');
    const online = await api.checkApiHealth(draftBaseUrl);
    setIsConnected(online);
    if (!online) {
      setErrorHeader(`Test failed. Could not communicate with FastAPI server at "${draftBaseUrl}". Verify FastAPI status and CORS setup.`);
    }
  };

  /**
   * Dialog form action: Save configurations within quick overlay modal
   */
  const handleModalSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      baseUrl: draftBaseUrl,
      isLive: true, // Modal is specifically for trying live connection
    };
    setApiConfig(updated);
    api.saveApiConfig(updated);
    setIsConfigModalOpen(false);
    await fetchGlobalData(updated);
  };

  return (
    <div id="app-root-frame" className="font-sans antialiased text-slate-100 bg-[#0f172a] min-h-screen flex flex-col relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* Dynamic Background Blurs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/25 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/15 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-600/15 blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* 1. Header Navigation System */}
        <Navigation
          currentView={currentView}
          onChangeView={setCurrentView}
          apiConfig={apiConfig}
          onOpenConfig={() => {
            setDraftBaseUrl(apiConfig.baseUrl);
            setIsConfigModalOpen(true);
          }}
          isConnected={isConnected}
        />

        {/* 2. Error header banner if FastAPI connects unsuccessfully but falls back */}
        {errorHeader && apiConfig.isLive && (
          <div className="bg-amber-500/90 backdrop-blur-md border-b border-amber-500/20 text-white px-4 py-3 text-xs font-mono font-medium flex items-center justify-center gap-2 relative z-50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorHeader}</span>
            <button
              id="error-header-switch-sandbox"
              onClick={async () => {
                const fallback = { baseUrl: apiConfig.baseUrl, isLive: false };
                setApiConfig(fallback);
                api.saveApiConfig(fallback);
                await fetchGlobalData(fallback);
              }}
              className="underline underline-offset-2 ml-2 hover:text-slate-100 font-bold cursor-pointer"
            >
              Switch to Sandbox Local Mode
            </button>
          </div>
        )}

        {/* 3. Core dynamic page loading skeletons or main screens */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl m-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-4 animate-spin">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">Initializing Database Tables...</p>
            <p className="text-xs text-slate-400 mt-1 font-mono">Resolving Categories or Live FastAPI routes</p>
          </div>
        ) : (
          <div className="flex-1 relative z-10">
            {currentView === 'catalog' ? (
              <PublicCatalog
                courses={courses}
                categories={categories}
                onRefreshAll={() => fetchGlobalData(apiConfig)}
              />
            ) : currentView === 'student' ? (
              <StudentDashboard
                courses={courses}
                categories={categories}
                students={students}
                enrollments={enrollments}
                payments={payments}
                onRefreshAll={() => fetchGlobalData(apiConfig)}
                onRequestSwitchView={setCurrentView}
              />
            ) : (
              <AdminDashboard
                categories={categories}
                courses={courses}
                students={students}
                enrollments={enrollments}
                payments={payments}
                apiConfig={apiConfig}
                onUpdateApiConfig={handleUpdateApiConfig}
                onRefreshAll={() => fetchGlobalData(apiConfig)}
                isConnected={isConnected}
                onTestConnection={handleTestConnection}
              />
            )}
          </div>
        )}

        {/* Footer Branding Design */}
        <footer className="bg-white/5 backdrop-blur-md border-t border-white/10 mt-auto relative z-10">
          <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-400 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Nexus Academy, Inc. All rights reserved.</p>
            <div className="flex items-center gap-4 text-slate-400 font-semibold font-mono text-[10px]">
              <span>ENGINE STATUS: OK</span>
              <span>|</span>
              <button
                id="footer-api-settings-link"
                onClick={() => {
                  setDraftBaseUrl(apiConfig.baseUrl);
                  setIsConfigModalOpen(true);
                }}
                className="text-indigo-400 hover:underline hover:text-indigo-300 cursor-pointer font-bold"
              >
                API SETTINGS
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* 4. Connection Details Popup Overlay */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-[#111827]/90 backdrop-blur-xl overflow-hidden border border-white/10 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-400 animate-pulse" />
                  FastAPI Connection Sync Desk
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Connect and sync students, courses, enrollments and payments tables in real-time.</p>
              </div>
              <button
                id="close-config-modal-btn"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSaveConfig} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">FastAPI Backend base URL</label>
                <input
                  id="modal-baseUrl-field"
                  type="url"
                  required
                  placeholder="e.g. http://localhost:8000"
                  value={draftBaseUrl}
                  onChange={(e) => setDraftBaseUrl(e.target.value)}
                  className="w-full font-mono rounded-lg border border-white/10 bg-white/5 text-white py-2 px-3 text-sm placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Status information pane */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Connection Linkage:</span>
                  <span className={`font-mono font-bold ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isConnected ? 'ONLINE / CONNECTED' : 'OFFLINE'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Toggle on live sync to redirect categories, courses, and placement tables queries directly to your FastAPI backend port.
                </p>
              </div>

              {/* Action Operations */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  id="modal-test-btn"
                  type="button"
                  onClick={handleTestConnection}
                  className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 cursor-pointer"
                >
                  Quick Link Test
                </button>
                <button
                  id="modal-save-btn"
                  type="submit"
                  className="rounded-lg bg-indigo-500 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-600 transition cursor-pointer shadow-lg shadow-indigo-500/25"
                >
                  Activate Live Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}