/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Award,
  Video,
  FileText,
  MessageSquare,
  Lock,
  Compass,
  ArrowRight,
  TrendingUp,
  CheckSquare,
  Square
} from 'lucide-react';
import { Course, Category, Student, Enrollment, Payment } from '../types';
import * as api from '../lib/api';

interface StudentDashboardProps {
  courses: Course[];
  categories: Category[];
  students: Student[];
  enrollments: Enrollment[];
  payments: Payment[];
  onRefreshAll: () => void;
  onRequestSwitchView: (view: 'catalog' | 'admin') => void;
}

// Initial mock chapters for every course to make it feel rich and real
interface Chapter {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'document' | 'quiz' | 'project';
  url: string;
  resourceName: string;
}

const CONSTANT_CHAPTERS: Chapter[] = [
  { id: '1', title: '01. Executive Cohort Introduction & Environment Setup', duration: '25 min', type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', resourceName: 'Setting up IDE, Node ecosystem & CLI targets' },
  { id: '2', title: '02. Theoretical Foundations & Architectural Design', duration: '40 min', type: 'document', url: 'https://react.dev', resourceName: 'Architectural Blueprint PDF Guidelines' },
  { id: '3', title: '03. Operational Deep-Dives & Sandbox Deployment', duration: '55 min', type: 'project', url: 'https://github.com', resourceName: 'Hands-on Repository Practice template' },
  { id: '4', title: '04. Final Certification Exam & Sandbox Assessment', duration: '30 min', type: 'quiz', url: 'https://google.com', resourceName: 'Comprehensive Core Skills Quizzing Platform' },
];

export default function StudentDashboard({
  courses,
  categories,
  students,
  enrollments,
  payments,
  onRefreshAll,
  onRequestSwitchView
}: StudentDashboardProps) {
  // Login State
  const [emailInput, setEmailInput] = useState('');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loginError, setLoginError] = useState('');
  
  // Progress states: stored as object with key `${studentEmail}_${courseId}` -> string[] of completed chapter IDs
  const [completedChapters, setCompletedChapters] = useState<Record<string, string[]>>({});
  
  // UI States
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'learning' | 'financials'>('learning');

  // Load progress and checked student from local storage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProgress = localStorage.getItem('student_chapters_progress');
      if (savedProgress) {
        try {
          setCompletedChapters(JSON.parse(savedProgress));
        } catch {
          // ignore
        }
      }
      
      const savedStudentEmail = localStorage.getItem('cms_logged_student_email');
      if (savedStudentEmail && students.length > 0) {
        const student = students.find(s => s.email.toLowerCase() === savedStudentEmail.toLowerCase());
        if (student) {
          setCurrentStudent(student);
        }
      }
    }
  }, [students]);

  // Handle Lookup Log In
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setLoginError('Please enter a valid registration email address.');
      return;
    }

    const matched = students.find(
      s => s.email.trim().toLowerCase() === emailInput.trim().toLowerCase()
    );

    if (matched) {
      setCurrentStudent(matched);
      setLoginError('');
      if (typeof window !== 'undefined') {
        localStorage.setItem('cms_logged_student_email', matched.email);
      }
    } else {
      setLoginError('No enrollment record found matching this email. Sign up in the Course Catalog page first!');
    }
  };

  // Perform Log Out
  const handleLogout = () => {
    setCurrentStudent(null);
    setEmailInput('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cms_logged_student_email');
    }
  };

  // Quick Login for sandbox testing demo (just click a preseeded user to log in)
  const handleQuickLogin = (student: Student) => {
    setCurrentStudent(student);
    setEmailInput(student.email);
    setLoginError('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('cms_logged_student_email', student.email);
    }
  };

  // Toggle chapter progress checkbox
  const toggleChapterCompletion = (courseId: number, chapterId: string) => {
    if (!currentStudent) return;
    const key = `${currentStudent.email.toLowerCase()}_${courseId}`;
    
    const existingList = completedChapters[key] || [];
    let updated: string[];
    
    if (existingList.includes(chapterId)) {
      updated = existingList.filter(id => id !== chapterId);
    } else {
      updated = [...existingList, chapterId];
    }

    const newProg = {
      ...completedChapters,
      [key]: updated
    };

    setCompletedChapters(newProg);
    if (typeof window !== 'undefined') {
      localStorage.setItem('student_chapters_progress', JSON.stringify(newProg));
    }
  };

  // Helper: calculate course progress percentage based on completed chapters
  const getProgressPercentage = (courseId: number): number => {
    if (!currentStudent) return 0;
    const key = `${currentStudent.email.toLowerCase()}_${courseId}`;
    const done = completedChapters[key] || [];
    const totalChapters = CONSTANT_CHAPTERS.length;
    return Math.round((done.length / totalChapters) * 100);
  };

  // Filter current student's enrollments and matching courses
  const studentEnrollments = currentStudent 
    ? enrollments.filter(enr => enr.student_id === currentStudent.id) 
    : [];

  const enrolledCourses = studentEnrollments
    .map(enr => {
      const matchCourse = courses.find(c => c.id === enr.course_id);
      return matchCourse ? { course: matchCourse, enrollment: enr } : null;
    })
    .filter((item): item is { course: Course; enrollment: Enrollment } => item !== null);

  // Filter student payments
  const studentPayments = currentStudent
    ? payments.filter(p => {
        const enrIds = studentEnrollments.map(e => e.id);
        return enrIds.includes(p.enrollment_id);
      })
    : [];

  const totalPaid = studentPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingInvoices = studentPayments.filter(p => p.status === 'pending');

  return (
    <div className="bg-[#0f172a]/40 text-slate-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Grid Overlay Banner */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none -z-10" />

      <main className="mx-auto max-w-6xl">
        {!currentStudent ? (
          /* ==========================================
             VIEW: LOGIN / STUDENT LOOKUP DESK
             ========================================== */
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20">
                <Compass className="h-3.5 w-3.5" />
                Live Student Learning Portal
              </div>
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">
                Enter Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">Classroom Room</span>
              </h1>
              <p className="text-sm text-slate-350 max-w-md mx-auto leading-relaxed">
                Log in using your registered registration email lookup to stream modules, track progress indicators, and access course handbooks.
              </p>
            </div>

            {/* Main authentication sandbox card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 flex items-start gap-2.5 text-xs text-rose-300">
                    <CheckCircle className="h-4 w-4 shrink-0 text-rose-450 rotate-180" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Official Student Register Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="student-lookup-email"
                      type="email"
                      required
                      placeholder="e.g. alice.watson@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition focus:bg-white/10"
                    />
                  </div>
                </div>

                <button
                  id="student-lookup-submit"
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-500 border border-white/10 py-3 text-xs font-bold text-white transition hover:bg-indigo-650 cursor-pointer shadow-lg shadow-indigo-500/25"
                >
                  Enter Student Space
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Quick Login Sandbox Assistance (Very handy for evaluation!) */}
              <div className="border-t border-white/10 pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                    Active Catalog Profiles (Sandbox Logs)
                  </span>
                  <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5">
                    Click to Log In Instantly
                  </span>
                </div>
                
                {students.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {students.map((st) => {
                      const stCourses = enrollments.filter(e => e.student_id === st.id);
                      return (
                        <button
                          key={st.id}
                          id={`quick-log-${st.id}`}
                          onClick={() => handleQuickLogin(st)}
                          className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-3 text-left transition hover:bg-white/10 hover:border-slate-500 group cursor-pointer"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{st.name}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{st.email}</p>
                            <p className="text-[10px] text-indigo-300 font-medium font-mono mt-1">
                              {stCourses.length} {stCourses.length === 1 ? 'course' : 'courses'} enrolled
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs text-center">
                    <p>No student accounts pre-seeded or registered.</p>
                    <button
                      onClick={() => onRequestSwitchView('catalog')}
                      className="mt-2 text-indigo-400 underline font-semibold text-xs"
                    >
                      Browse courses & buy to create your student file!
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ==========================================
             VIEW: ACTIVE LOGGED-IN DASHBOARD
             ========================================== */
          <div className="space-y-8">
            {/* Dashboard Student Greeting Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 border border-white/10">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white sm:text-3xl tracking-tight">
                    Welcome Back, {currentStudent.name}!
                  </h1>
                  <p className="text-xs text-slate-350 font-medium font-mono flex items-center gap-1.5 mt-1">
                    <Mail className="h-3.5 w-3.5 text-indigo-400" />
                    {currentStudent.email}
                    {currentStudent.phone && (
                      <>
                        <span>•</span>
                        <span>{currentStudent.phone}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="student-dashboard-action-catalog"
                  onClick={() => onRequestSwitchView('catalog')}
                  className="rounded-xl border border-white/10 bg-white/5 py-2 px-4 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  Browse Catalog
                </button>
                <button
                  id="student-dashboard-action-logout"
                  onClick={handleLogout}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 py-2 px-4 text-xs font-bold text-rose-350 hover:bg-rose-500/20 transition cursor-pointer"
                >
                  Sign Out Space
                </button>
              </div>
            </div>

            {/* Quick Metrics Indicators Panel */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {/* Enrolled Card */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between backdrop-blur-md">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Total Enrolled</span>
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="mt-2.5">
                  <h3 className="text-2xl font-black text-white">{enrolledCourses.length}</h3>
                  <p className="text-[10px] text-slate-350 font-medium mt-0.5">Active curriculum modules</p>
                </div>
              </div>

              {/* Progress Card */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between backdrop-blur-md">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Mean Progress</span>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="mt-2.5">
                  <h3 className="text-2xl font-black text-white">
                    {enrolledCourses.length > 0 
                      ? Math.round(enrolledCourses.reduce((sum, item) => sum + getProgressPercentage(item.course.id), 0) / enrolledCourses.length)
                      : 0}%
                  </h3>
                  <p className="text-[10px] text-slate-350 font-medium mt-0.5">Overall checked syllabus</p>
                </div>
              </div>

              {/* Tuition Ledger */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between backdrop-blur-md">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Tuition Settled</span>
                  <Award className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="mt-2.5">
                  <h3 className="text-2xl font-black text-emerald-400">${totalPaid}</h3>
                  <p className="text-[10px] text-slate-350 font-medium mt-0.5">Bookkeeping matches</p>
                </div>
              </div>

              {/* Pending Bill Alerts */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between backdrop-blur-md">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">Open Invoices</span>
                  <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
                </div>
                <div className="mt-2.5">
                  <h3 className={`text-2xl font-black ${pendingInvoices.length > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {pendingInvoices.length}
                  </h3>
                  <p className="text-[10px] text-slate-350 font-medium mt-0.5">Requires payment</p>
                </div>
              </div>
            </div>

            {/* Notification if Student has unpaid invoices (outstanding bills) */}
            {pendingInvoices.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-2 text-xs">
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                  ⚠️ Outstanding Bill Ledger Link Alert
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  You have <strong className="text-white">{pendingInvoices.length} pending registration invoices</strong> in the bookkeeping logs. Please coordinate with Administration or complete the payments tab to secure certification clearance.
                </p>
              </div>
            )}

            {/* Tabs Selector */}
            <div className="flex border-b border-white/10 gap-4">
              <button
                onClick={() => setActiveTab('learning')}
                className={`py-2 px-1 text-sm font-bold tracking-tight outline-none border-b-2 transition cursor-pointer ${
                  activeTab === 'learning'
                    ? 'border-indigo-500 text-white font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                Syllabus & Core Progress ({enrolledCourses.length})
              </button>
              <button
                onClick={() => setActiveTab('financials')}
                className={`py-2 px-1 text-sm font-bold tracking-tight outline-none border-b-2 transition cursor-pointer ${
                  activeTab === 'financials'
                    ? 'border-indigo-500 text-white font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                Tuition Bookkeeping Bills
              </button>
            </div>

            {/* TAB CONTENT: LEARNING DIRECTORY */}
            {activeTab === 'learning' && (
              <div className="space-y-6">
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.map(({ course, enrollment }) => {
                    const pct = getProgressPercentage(course.id);
                    const categoryObj = categories.find(c => c.id === course.category_id);
                    const isExpanded = expandedCourseId === course.id;

                    return (
                      <div
                        key={course.id}
                        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-lg"
                      >
                        {/* Course Summary Panel */}
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-white/2 to-transparent border-b border-white/5">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 text-[10px] font-mono tracking-wider px-2 py-0.5 uppercase font-bold">
                                {categoryObj ? categoryObj.name : 'Curriculum Class'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium font-mono">
                                Enrollment: #E-00{enrollment.id}
                              </span>
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                              {course.title}
                            </h2>
                            <p className="text-xs text-slate-350 line-clamp-2 max-w-2xl leading-normal">
                              {course.description || 'Flexible syllabus and exercise labs configured for interactive certification.'}
                            </p>
                          </div>

                          {/* Dynamic Progress indicator bar */}
                          <div className="w-full md:w-64 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 font-semibold font-mono">CURRICULUM ATTAINED:</span>
                              <span className="font-bold font-mono text-indigo-300">{pct}%</span>
                            </div>
                            <div className="relative h-2 w-full rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 to-fuchsia-400 transition-all duration-300 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                              <span>0%</span>
                              <span>MIDTERM</span>
                              <span>CERTIFIED</span>
                            </div>
                          </div>

                          {/* Expand Trigger to Access Study Room */}
                          <button
                            id={`study-room-toggle-${course.id}`}
                            onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                            className="flex h-10 px-4 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs text-indigo-300 font-bold transition hover:bg-white/10 cursor-pointer w-full md:w-auto"
                          >
                            {isExpanded ? 'Collapse Study Room' : 'Enter Study Room'}
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>

                        {/* STUDY ROOM SYLLABIC ASSIGNMENTS LIST (EXPANDABLE) */}
                        {isExpanded && (
                          <div className="p-6 bg-slate-950/20 space-y-6">
                            <div className="border-b border-indigo-500/20 pb-3">
                              <h3 className="font-bold text-sm text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Interactive Courseware Study Room
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Read handbooks, view lessons, and complete tasks below. Your progress bar updates automatically.
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              {/* Left column: Syllabus list */}
                              <div className="space-y-3">
                                {CONSTANT_CHAPTERS.map((ch) => {
                                  const progressKey = `${currentStudent.email.toLowerCase()}_${course.id}`;
                                  const isChecked = (completedChapters[progressKey] || []).includes(ch.id);

                                  return (
                                    <div
                                      key={ch.id}
                                      className={`rounded-xl border p-4 transition flex gap-3 items-start justify-between ${
                                        isChecked
                                          ? 'bg-emerald-500/5 border-emerald-500/20'
                                          : 'bg-white/2 border-white/10 hover:bg-white/5'
                                      }`}
                                    >
                                      <div className="flex gap-2.5 items-start">
                                        <button
                                          id={`check-ch-${course.id}-${ch.id}`}
                                          onClick={() => toggleChapterCompletion(course.id, ch.id)}
                                          className="text-indigo-400 hover:text-white cursor-pointer mt-0.5 flex-shrink-0"
                                          title={isChecked ? 'Mark Incomplete' : 'Complete Lesson'}
                                        >
                                          {isChecked ? (
                                            <CheckCircle className="h-5 w-5 text-emerald-400 animate-pulse" />
                                          ) : (
                                            <div className="h-5 w-5 rounded border border-white/20 hover:border-indigo-400 shrink-0" />
                                          )}
                                        </button>

                                        <div className="min-w-0">
                                          <p className={`text-xs font-bold leading-tight ${isChecked ? 'text-slate-400 line-through' : 'text-white'}`}>
                                            {ch.title}
                                          </p>
                                          <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1.5 uppercase">
                                            <span className="font-semibold text-indigo-300 font-mono">{ch.type}</span>
                                            <span>•</span>
                                            <span>{ch.duration}</span>
                                          </p>
                                          <p className="text-[10px] text-slate-400 truncate mt-1">
                                            {ch.resourceName}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Resource Link Trigger */}
                                      <a
                                        href={ch.url}
                                        target="_blank"
                                        rel="noopener noreferrer referrer"
                                        referrerPolicy="no-referrer"
                                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                                        title="Open Course Link Resource"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Right column: Resources/Study handbook guidance */}
                              <div className="rounded-xl border border-white/5 bg-white/2 p-5 space-y-4">
                                <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                                  <FileText className="h-4 w-4 text-indigo-400" />
                                  Courseware Materials Directory
                                </h4>

                                <div className="space-y-3 text-xs leading-normal">
                                  <div className="p-3 bg-[#0d131f] rounded-lg border border-white/5 flex gap-2.5">
                                    <Video className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="block font-bold text-white font-mono">Stream Live Lessons</span>
                                      <p className="text-[11px] text-slate-400 mt-0.5">Stream and follow screen demos with industry specialists in sandbox files.</p>
                                      <a
                                        href="https://www.youtube.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-indigo-450 hover:underline inline-flex items-center gap-1 mt-1 font-bold"
                                      >
                                        Stream Classroom Hub <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    </div>
                                  </div>

                                  <div className="p-3 bg-[#0d131f] rounded-lg border border-white/5 flex gap-2.5">
                                    <FileText className="h-4 w-4 text-fuchsia-400 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="block font-bold text-white font-mono">Downloadable Handbook</span>
                                      <p className="text-[11px] text-slate-400 mt-0.5">Detailed notes, guidelines, parameters and code snippets for study prep.</p>
                                      <a
                                        href="https://react.dev"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-indigo-450 hover:underline inline-flex items-center gap-1 mt-1 font-bold"
                                      >
                                        Read Syllabus PDF <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    </div>
                                  </div>

                                  <div className="p-3 bg-[#0d131f] rounded-lg border border-white/5 flex gap-2.5">
                                    <MessageSquare className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="block font-bold text-white font-mono">Office Hours Chat Slack</span>
                                      <p className="text-[11px] text-slate-400 mt-0.5">Post questions to mentors or chat with class cohorts instantly.</p>
                                      <span className="text-[10px] text-slate-500 block font-mono mt-0.5 font-bold">SLACK CODE: #CMS-COHORT-2026</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 backdrop-blur-md py-16 px-4 text-center">
                    <Compass className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-4 text-base font-bold text-white">Enrollment Database Ledger Empty</h3>
                    <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
                      You are registered on our local database, but haven't enrolled or paid for any courses. Take a look at our courses to get certified!
                    </p>
                    <button
                      id="empty-dashboard-browse-catalog-btn"
                      onClick={() => onRequestSwitchView('catalog')}
                      className="mt-6 rounded-lg bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-650 transition cursor-pointer border border-white/10"
                    >
                      Browse Available Courses
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: FINANCIAL LEDGERS */}
            {activeTab === 'financials' && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-lg space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Student Billing Ledger Statements</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    View list of completed payments, upcoming pending invoices, and voided tuition items from the Administration catalog bookkeeper.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="min-w-full divide-y divide-white/5 text-sm text-slate-300">
                    <thead className="bg-white/5 text-xs font-bold font-mono text-slate-400 uppercase tracking-wider text-left">
                      <tr>
                        <th className="px-5 py-3">Receipt Ref</th>
                        <th className="px-5 py-3">Associated Course</th>
                        <th className="px-5 py-3">Payment Type</th>
                        <th className="px-5 py-3">Bookkeeping Balance</th>
                        <th className="px-5 py-3">Audit Date</th>
                        <th className="px-5 py-3 text-right">Settled Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-[#090e18]/25">
                      {studentPayments.length > 0 ? (
                        studentPayments.map((p) => {
                          const matchingEnrollment = enrollments.find(e => e.id === p.enrollment_id);
                          const matchingCourse = matchingEnrollment
                            ? courses.find(c => c.id === matchingEnrollment.course_id)
                            : null;

                          return (
                            <tr key={p.id} className="hover:bg-white/2 transition">
                              <td className="px-5 py-4 font-mono font-bold text-white text-xs">
                                #PA-0{p.id}
                              </td>
                              <td className="px-5 py-4 font-semibold text-xs text-slate-300">
                                {matchingCourse ? matchingCourse.title : `Enrollment #${p.enrollment_id}`}
                              </td>
                              <td className="px-5 py-4 text-xs font-mono text-slate-400 uppercase font-semibold">
                                TUITION FLATRATE
                              </td>
                              <td className="px-5 py-4 font-mono font-bold text-white text-xs">
                                ${p.amount}
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                                {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                  p.status === 'completed'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                    : p.status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-305 border border-amber-500/20 animate-pulse'
                                    : 'bg-rose-500/10 text-rose-350 border border-rose-500/20'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-8 text-center text-slate-500 text-xs">
                            No billing history logged in statements.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
                  <p>Aggregate Account Ledger Balance: <strong className="text-emerald-400">${totalPaid} PAID</strong></p>
                  <p className="flex items-center gap-1 leading-none font-mono text-[10px]">
                    <Lock className="h-3 w-3 text-emerald-400" />
                    Ledger matches digital bank processing standards securely.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
