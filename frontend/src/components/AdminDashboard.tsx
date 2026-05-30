/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FolderOpen,
  BookOpen,
  Users,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  RefreshCw,
  FolderPlus,
  Wifi,
  Database,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Terminal,
  Activity,
  UserCheck
} from 'lucide-react';
import {
  Category,
  Course,
  Student,
  Enrollment,
  Payment,
  ApiConfig,
  CategoryCreate,
  CourseCreate,
  StudentCreate,
  EnrollmentCreate,
  PaymentCreate
} from '../types';
import * as api from '../lib/api';

// Recharts imports for visual telemetry graphs
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AdminDashboardProps {
  categories: Category[];
  courses: Course[];
  students: Student[];
  enrollments: Enrollment[];
  payments: Payment[];
  apiConfig: ApiConfig;
  onUpdateApiConfig: (config: ApiConfig) => void;
  onRefreshAll: () => void;
  isConnected: boolean | null;
  onTestConnection: () => Promise<void>;
}

type TabType = 'overview' | 'courses' | 'categories' | 'students' | 'enrollments' | 'payments' | 'api-sync';

export default function AdminDashboard({
  categories,
  courses,
  students,
  enrollments,
  payments,
  apiConfig,
  onUpdateApiConfig,
  onRefreshAll,
  isConnected,
  onTestConnection,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Dynamic CRUD form modal states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorText, setErrorText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Category Create/Update
  const [categoryForm, setCategoryForm] = useState<CategoryCreate>({ name: '', description: '' });
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // States for Course Create/Update
  const [courseForm, setCourseForm] = useState<CourseCreate>({
    title: '',
    description: '',
    price: 0,
    category_id: categories[0]?.id || 0,
  });
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  // States for Student Create/Update
  const [studentForm, setStudentForm] = useState<StudentCreate>({ name: '', email: '', phone: '' });
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // States for Manual Enrollment creation
  const [enrollmentForm, setEnrollmentForm] = useState<EnrollmentCreate>({
    student_id: students[0]?.id || 0,
    course_id: courses[0]?.id || 0,
    status: 'active',
  });
  const [isAddingEnrollment, setIsAddingEnrollment] = useState(false);

  // States for Manual Payment creation
  const [paymentForm, setPaymentForm] = useState<PaymentCreate>({
    enrollment_id: enrollments[0]?.id || 0,
    amount: 0,
    status: 'pending',
  });
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  // FastAPI Base URL edit state
  const [draftBaseUrl, setDraftBaseUrl] = useState(apiConfig.baseUrl);

  // Clear helper
  const clearNotifications = () => {
    setErrorText('');
    setSuccessMsg('');
  };

  /**
   * ==========================================
   * CALCULATE KPI METRICS
   * ==========================================
   */
 // 1. Safe Arrays Initialization (Defensive Safety Net)
  const paymentsArray = Array.isArray(payments) ? payments : [];
  const enrollmentsArray = Array.isArray(enrollments) ? enrollments : [];
  const studentsArray = Array.isArray(students) ? students : [];
  const coursesArray = Array.isArray(courses) ? courses : [];

  // 2. Optimized Dashboard Metrics Calculations
  const totalRevenue = paymentsArray
    .filter((p) => p?.status === 'completed')
    .reduce((sum, p) => sum + (p?.amount || 0), 0);

  const activeEnrollmentsCount = enrollmentsArray.filter((e) => e?.status === 'active').length;
  
  // Alternative Analytics (Pro-Tip এর জন্য হিসাব)
  const totalStudentsCount = studentsArray.length;
  const totalCoursesCount = coursesArray.length;

  /**
   * Pro-Tip: 
   * ১. ডাটা প্রসেস করার সময় সবসময় Optional Chaining (?.) ব্যবহার করবেন (যেমন: p?.status)। 
   * এর ফলে অবজেক্টের কোনো প্রোপার্টি মিসিং থাকলেও রানটাইমে কোড ক্র্যাশ করবে না।
   * ২. performance অপ্টিমাইজেশনের জন্য এই ক্যালকুলেশনগুলোকে React.useMemo() এর ভেতর রাখতে পারেন, 
   * যাতে প্রতি রেন্ডারে পুরো অ্যারে লুপ না হয়।
   */
  /**
   * ==========================================
   * GRAPH DATA FORMATTERS
   * ==========================================
   */
  // Formatter for course popularity chart (enrollments count per course title)
  const coursePopularityData = courses.map((course) => {
    const count = enrollments.filter((e) => e.course_id === course.id).length;
    return {
      name: course.title.length > 20 ? `${course.title.slice(0, 20)}...` : course.title,
      'Enrollment Count': count,
    };
  });

  // Formatter for revenue by category mapping
  const categoryRevenueData = categories.map((cat) => {
    // find courses belonging to this category
    const catCourses = courses.filter((c) => c.category_id === cat.id);
    const catCourseIds = catCourses.map((c) => c.id);
    // find enrollments for these courses
    const catEnrollments = enrollments.filter((e) => catCourseIds.includes(e.course_id));
    const catEnrollmentIds = catEnrollments.map((e) => e.id);
    // calculate sum of completed payments
    const revenue = payments
      .filter((p) => catEnrollmentIds.includes(p.enrollment_id) && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      name: cat.name,
      Revenue: revenue,
    };
  });

  // Pie chart coloring structure
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  /**
   * ==========================================
   * CRUD ACTION HANDLERS
   * ==========================================
   */

  // 1. Categories Handlers
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;
    setIsSubmitting(true);
    clearNotifications();
    try {
      if (editingId) {
        await api.updateCategory(editingId, categoryForm);
        setSuccessMsg('Category updated successfully.');
      } else {
        await api.createCategory(categoryForm);
        setSuccessMsg('Category created successfully.');
      }
      setCategoryForm({ name: '', description: '' });
      setIsAddingCategory(false);
      setEditingId(null);
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Error saving category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startCategoryEdit = (cat: Category) => {
    setEditingId(cat.id);
    setCategoryForm({ name: cat.name, description: cat.description || '' });
    setIsAddingCategory(true);
    clearNotifications();
  };

  const handleCategoryDelete = async (id: number) => {
    const associatedCourses = courses.filter((c) => c.category_id === id);
    if (associatedCourses.length > 0) {
      setErrorText(`Cannot delete category. There are ${associatedCourses.length} active courses associated with it.`);
      return;
    }
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    clearNotifications();
    try {
      await api.deleteCategory(id);
      setSuccessMsg('Category deleted.');
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Error deleting category.');
    }
  };

  // 2. Course Handlers
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.price || !courseForm.category_id) return;
    setIsSubmitting(true);
    clearNotifications();
    try {
      if (editingId) {
        await api.updateCourse(editingId, courseForm);
        setSuccessMsg('Course updated successfully.');
      } else {
        await api.createCourse(courseForm);
        setSuccessMsg('Course created successfully.');
      }
      setCourseForm({ title: '', description: '', price: 0, category_id: categories[0]?.id || 0 });
      setIsAddingCourse(false);
      setEditingId(null);
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Error processing course creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startCourseEdit = (course: Course) => {
    setEditingId(course.id);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      price: course.price,
      category_id: course.category_id,
    });
    setIsAddingCourse(true);
    clearNotifications();
  };

  const handleCourseDelete = async (id: number) => {
    const associatedEnrollments = enrollments.filter((e) => e.course_id === id);
    if (associatedEnrollments.length > 0) {
      setErrorText(`Cannot delete course. There are ${associatedEnrollments.length} active enrollments referring to this.`);
      return;
    }
    if (!window.confirm('Delete this course from active offering directory?')) return;
    clearNotifications();
    try {
      await api.deleteCourse(id);
      setSuccessMsg('Course package deleted.');
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Failed to remove course.');
    }
  };

  // 3. Student Handlers
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.email) return;
    setIsSubmitting(true);
    clearNotifications();
    try {
      if (editingId) {
        await api.updateStudent(editingId, studentForm);
        setSuccessMsg('Student record updated.');
      } else {
        await api.createStudent(studentForm);
        setSuccessMsg('New student registered.');
      }
      setStudentForm({ name: '', email: '', phone: '' });
      setIsAddingStudent(false);
      setEditingId(null);
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Error updating student database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startStudentEdit = (std: Student) => {
    setEditingId(std.id);
    setStudentForm({ name: std.name, email: std.email, phone: std.phone || '' });
    setIsAddingStudent(true);
    clearNotifications();
  };

  const handleStudentDelete = async (id: number) => {
    if (!window.confirm('Remove this student registry? Associated enrollments will break.')) return;
    clearNotifications();
    try {
      await api.deleteStudent(id);
      setSuccessMsg('Student profile deleted.');
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Error pruning student table.');
    }
  };

  // 4. Enrollments Handlers
  const handleEnrollmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearNotifications();
    try {
      await api.createEnrollment(enrollmentForm);
      setSuccessMsg('Manual enrollment record processed.');
      setIsAddingEnrollment(false);
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Error building enrollment record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollmentStatusChange = async (enrollmentId: number, nextStatus: string) => {
    clearNotifications();
    try {
      await api.updateEnrollment(enrollmentId, { status: nextStatus });
      setSuccessMsg(`Enrollment #${enrollmentId} marked as ${nextStatus}.`);
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Fail to patch status.');
    }
  };

  const handleEnrollmentDelete = async (id: number) => {
    if (!window.confirm('Delete this student enrollment registration?')) return;
    clearNotifications();
    try {
      await api.deleteEnrollment(id);
      setSuccessMsg('Student enrollment removed safely.');
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Failed deleting enrollment log.');
    }
  };

  // 5. Payments Handlers
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearNotifications();
    try {
      await api.createPayment(paymentForm);
      setSuccessMsg('Tuition payment record added.');
      setIsAddingPayment(false);
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Fail to log payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentStatusChange = async (paymentId: number, nextStatus: string) => {
    clearNotifications();
    try {
      await api.updatePayment(paymentId, { status: nextStatus });
      setSuccessMsg(`Tuition billing record status changed to ${nextStatus}.`);
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Fail to update payment logs.');
    }
  };

  const handlePaymentDelete = async (id: number) => {
    if (!window.confirm('Prune billing transaction from accounting ledgers?')) return;
    clearNotifications();
    try {
      await api.deletePayment(id);
      setSuccessMsg('Billing log removed.');
      onRefreshAll();
    } catch (err: any) {
      setErrorText(err.message || 'Error purging billing index.');
    }
  };

  // FastAPI Sync Save config handler
  const handleSaveApiSettings = (isLiveToggle: boolean) => {
    clearNotifications();
    const config = {
      baseUrl: draftBaseUrl,
      isLive: isLiveToggle,
    };
    onUpdateApiConfig(config);
    setSuccessMsg(isLiveToggle ? 'Switched to Live API Sync Mode!' : 'Sandbox Local DB Re-activated.');
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col md:flex-row bg-[#0f172a]/20">
      
      {/* Sidebar Control Panel */}
      <aside className="w-full md:w-64 shrink-0 bg-[#111827]/40 border-b md:border-b-0 md:border-r border-white/10 p-4 space-y-1 backdrop-blur-md">
        <div className="px-3 py-2 mb-4">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400">DATABASE CONTROL</p>
        </div>

        <button
          id="tab-overview-btn"
          onClick={() => { setActiveTab('overview'); clearNotifications(); }}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition border cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white/10 text-white border-white/15 shadow-inner'
              : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            Overview Telemetry
          </span>
          <span className="bg-white/10 text-slate-300 font-mono text-[9px] px-1.5 py-0.5 rounded-full">HQ</span>
        </button>

        <button
          id="tab-courses-btn"
          onClick={() => { setActiveTab('courses'); clearNotifications(); }}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition border cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-inner'
              : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            Master Courses
          </span>
          <span className="bg-indigo-500/20 text-indigo-300 font-bold text-[9px] px-1.5 py-0.5 rounded-full">{courses.length}</span>
        </button>

        <button
          id="tab-categories-btn"
          onClick={() => { setActiveTab('categories'); clearNotifications(); }}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition border cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-inner'
              : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-indigo-400" />
            Industry Categories
          </span>
          <span className="bg-white/10 text-slate-350 font-mono text-[9px] px-1.5 py-0.5 rounded-full">{categories.length}</span>
        </button>

        <button
          id="tab-students-btn"
          onClick={() => { setActiveTab('students'); clearNotifications(); }}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition border cursor-pointer ${
            activeTab === 'students'
              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-inner'
              : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" />
            Student Registries
          </span>
          <span className="bg-white/10 text-slate-350 font-mono text-[9px] px-1.5 py-0.5 rounded-full">{students.length}</span>
        </button>

        <button
          id="tab-enrollments-btn"
          onClick={() => { setActiveTab('enrollments'); clearNotifications(); }}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition border cursor-pointer ${
            activeTab === 'enrollments'
              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-inner'
              : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            Cohort Enrollments
          </span>
          <span className="bg-white/10 text-slate-350 font-mono text-[9px] px-1.5 py-0.5 rounded-full">{enrollments.length}</span>
        </button>

        <button
          id="tab-payments-btn"
          onClick={() => { setActiveTab('payments'); clearNotifications(); }}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition border cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-inner'
              : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-400" />
            Billing & Accounts
          </span>
          <span className="bg-white/10 text-slate-350 font-mono text-[9px] px-1.5 py-0.5 rounded-full">{payments.length}</span>
        </button>

        <div className="border-t border-white/10 my-4 pt-4">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748b] px-3 py-2">fastapi endpoints</p>
          <button
            id="tab-api-sync-btn"
            onClick={() => { setActiveTab('api-sync'); clearNotifications(); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-lg transition border cursor-pointer ${
              activeTab === 'api-sync'
                ? 'bg-indigo-500/20 text-indigo-300 font-bold border-indigo-500/35 shadow-inner'
                : 'text-slate-400 hover:bg-white/5 border-transparent'
            }`}
          >
            <span className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-400" />
              API Server Sync
            </span>
            <div className={`h-2 w-2 rounded-full ${apiConfig.isLive ? (isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400') : 'bg-indigo-500'}`} />
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl">
        
        {/* Banner notification overlays */}
        {errorText && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-305 flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400" />
            <div>
              <span className="font-bold text-white">Execution Warning:</span> {errorText}
            </div>
            <button onClick={() => setErrorText('')} className="ml-auto text-slate-400 hover:text-white cursor-pointer font-bold">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4 text-xs text-indigo-200 flex items-start gap-2.5 shadow-sm">
            <Check className="h-4.5 w-4.5 shrink-0 text-indigo-400" />
            <div>
              <span className="font-bold text-white">System Status:</span> {successMsg}
            </div>
            <button onClick={() => setSuccessMsg('')} className="ml-auto text-slate-400 hover:text-white cursor-pointer font-bold">✕</button>
          </div>
        )}

        {/* Dynamic workspace context route logic */}
        
        {/* ==========================================
            TAB: OVERVIEW
            ========================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* High-Contrast Bento Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-md p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Total Revenue</span>
                  <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white font-display">${totalRevenue}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">Completed</span>
                </div>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-md p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Active Students</span>
                  <div className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-lg">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-white font-display">{students.length}</span>
                  <span className="text-xs text-slate-400 font-medium ml-1.5">Registered</span>
                </div>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-md p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Curriculum Courses</span>
                  <div className="text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-white font-display">{courses.length}</span>
                  <span className="text-xs text-slate-400 font-medium ml-1.5 line">Offered</span>
                </div>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-md p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">Cohort Size</span>
                  <div className="text-purple-400 bg-purple-500/10 border border-purple-500/20 p-2 rounded-lg">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-white font-display">{activeEnrollmentsCount}</span>
                  <span className="text-xs text-slate-400 font-medium ml-1.5">Active Links</span>
                </div>
              </div>
            </div>

            {/* Recharts Analytics Widgets */}
            <div className="grid gap-6 lg:grid-cols-2">
              
              {/* Plot 1: Popularity */}
              <div className="rounded-2xl bg-white/5 p-5 border border-white/10 shadow-lg space-y-4 backdrop-blur-md">
                <div>
                  <h3 className="text-sm font-bold text-white">Cohort Sizes by Course Package</h3>
                  <p className="text-xs text-slate-400">Distribution of enrolled student databases per offering.</p>
                </div>
                <div className="h-64 mt-4 w-full text-xs">
                  {coursePopularityData.some(d => d['Enrollment Count'] > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={coursePopularityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)' }} itemStyle={{ color: '#ebf8ff' }} />
                        <Bar dataKey="Enrollment Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white/5 rounded-xl border border-dashed border-white/10 text-center p-4">
                      <Users className="h-8 w-8 mb-2 stroke-1 text-slate-500" />
                      <span>No active enrollment metrics logged to generate stats</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Plot 2: Category Revenues */}
              <div className="rounded-2xl bg-white/5 p-5 border border-white/10 shadow-lg space-y-4 backdrop-blur-md">
                <div>
                  <h3 className="text-sm font-bold text-white">Billing Performance by Field</h3>
                  <p className="text-xs text-slate-400 font-medium">Revenues mapping based on categories.</p>
                </div>
                <div className="h-64 mt-4 w-full">
                  {categoryRevenueData.some(d => d.Revenue > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryRevenueData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="Revenue"
                        >
                          {categoryRevenueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} contentStyle={{ fontSize: 11, borderRadius: 8, backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)' }} itemStyle={{ color: '#ebf8ff' }} />
                        <Legend wrapperStyle={{ fontSize: 10, marginTop: 10, color: '#aaa' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white/5 rounded-xl border border-dashed border-white/10 text-center p-4">
                      <CreditCard className="h-8 w-8 mb-2 stroke-1 text-slate-500" />
                      <span>No completed payments found to display revenue breakdown</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="rounded-xl border border-white/10 bg-gradient-to-r from-indigo-950/80 to-slate-950/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div>
                <h4 className="font-bold text-base text-white">Quick-publish a Course?</h4>
                <p className="text-xs text-indigo-200 mt-1">Directly append a syllabus package to the student catalog.</p>
              </div>
              <button
                id="quick-add-course"
                onClick={() => {
                  setActiveTab('courses');
                  setIsAddingCourse(true);
                  setEditingId(null);
                  clearNotifications();
                }}
                className="rounded-lg bg-indigo-500 border border-white/10 px-4 py-2 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition text-xs flex items-center gap-1 cursor-pointer"
              >
                Create New Course
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: COURSES
            ========================================== */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Master Courses Registry</h2>
                <p className="text-xs text-slate-400">Provide, maintain, and drop educational class packages.</p>
              </div>
              <button
                id="add-course-trigger-btn"
                onClick={() => {
                  setIsAddingCourse(!isAddingCourse);
                  setEditingId(null);
                  setCourseForm({
                    title: '',
                    description: '',
                    price: 0,
                    category_id: categories[0]?.id || 0,
                  });
                }}
                className="rounded-lg bg-indigo-500 border border-white/10 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition flex items-center gap-1 cursor-pointer"
              >
                {isAddingCourse ? 'Hide Editor' : 'Publish Course'}
                {!isAddingCourse && <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Editor view */}
            {isAddingCourse && (
              <form onSubmit={handleCourseSubmit} className="rounded-xl border border-white/10 bg-[#111827]/90 p-5 space-y-4 shadow-2xl backdrop-blur-xl max-w-2xl text-white">
                <div className="border-b border-white/10 pb-2">
                  <h3 className="font-bold text-white">{editingId ? 'Modify Published Course' : 'Publish New Course'}</h3>
                  <p className="text-xs text-slate-400">Configure curriculum metadata, price parameters, and category linkage.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Course Title</label>
                    <input
                      id="course-title-field"
                      type="text"
                      required
                      placeholder="e.g. Masterclass in Systems Design"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tution Fee (USD)</label>
                    <input
                      id="course-price-field"
                      type="number"
                      required
                      min={0}
                      placeholder="e.g. 299"
                      value={courseForm.price}
                      onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category Field Linkage</label>
                    <select
                      id="course-catid-field"
                      required
                      value={courseForm.category_id}
                      onChange={(e) => setCourseForm({ ...courseForm, category_id: Number(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm text-white outline-none focus:border-indigo-500 bg-[#1e293b]"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#1e293b] text-white">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description Overview/Syllabus</label>
                    <textarea
                      id="course-desc-field"
                      rows={3}
                      placeholder="Describe the target audience, knowledge structures, outcome values or modules..."
                      value={courseForm.description || ''}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    id="course-editor-cancel"
                    type="button"
                    onClick={() => setIsAddingCourse(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-305 hover:bg-white/10 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="course-editor-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-indigo-500 border border-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/25"
                  >
                    {isSubmitting ? 'Saving...' : editingId ? 'Apply Amendments' : 'Publish & Catalog'}
                  </button>
                </div>
              </form>
            )}

            {/* Courses Table */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/10">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-300">
                  <thead className="bg-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Course Detail</th>
                      <th className="px-6 py-3">Category Index</th>
                      <th className="px-6 py-3">Tuition Charges</th>
                      <th className="px-6 py-3 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {courses.length > 0 ? (
                      courses.map((course) => {
                        const linkedCat = categories.find((cat) => cat.id === course.category_id);
                        return (
                          <tr key={course.id} className="hover:bg-white/5 transition">
                            <td className="px-6 py-4">
                              <span className="block font-bold text-white">{course.title}</span>
                              <span className="block text-xs text-slate-400 line-clamp-1 mt-0.5">{course.description || 'No description added.'}</span>
                            </td>
                            <td className="px-6 py-4 font-semibold">
                              <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-0.5 text-xs text-slate-300 border border-white/5">
                                {linkedCat ? linkedCat.name : `ID: ${course.category_id}`}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-emerald-400">${course.price}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  id={`edit-course-${course.id}`}
                                  onClick={() => startCourseEdit(course)}
                                  className="rounded border border-white/10 px-2 py-1 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition cursor-pointer flex items-center gap-1"
                                >
                                  <Edit2 className="h-3 w-3" /> Edit
                                </button>
                                <button
                                  id={`delete-course-${course.id}`}
                                  onClick={() => handleCourseDelete(course.id)}
                                  className="rounded border border-rose-550/20 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-350 hover:bg-rose-500/20 transition cursor-pointer flex items-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" /> Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                          <BookOpen className="mx-auto h-8 w-8 text-slate-500 stroke-1" />
                          <p className="mt-2 text-xs">No active course profiles registered. Publish a program parameters above.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: CATEGORIES
            ========================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Industry Categories Index</h2>
                <p className="text-xs text-slate-400">Regulate fields of study used to classify master syllabus indexes.</p>
              </div>
              <button
                id="add-cat-trigger-btn"
                onClick={() => {
                  setIsAddingCategory(!isAddingCategory);
                  setEditingId(null);
                  setCategoryForm({ name: '', description: '' });
                }}
                className="rounded-lg bg-indigo-500 border border-white/10 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition flex items-center gap-1 cursor-pointer"
              >
                {isAddingCategory ? 'Hide Editor' : 'Create Category'}
                {!isAddingCategory && <FolderPlus className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Category Form */}
            {isAddingCategory && (
              <form onSubmit={handleCategorySubmit} className="rounded-xl border border-white/10 bg-[#111827]/90 p-5 space-y-4 shadow-2xl backdrop-blur-xl max-w-2xl text-white">
                <div className="border-b border-white/10 pb-2">
                  <h3 className="font-bold text-white">{editingId ? 'Update Field Parameters' : 'Register New Study Fieldage'}</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category Name</label>
                    <input
                      id="cat-name-field"
                      type="text"
                      required
                      placeholder="e.g. Graphic Arts & Design"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description / Goal Outcome</label>
                    <textarea
                      id="cat-desc-field"
                      rows={2}
                      placeholder="A short sentence summarizing core goals..."
                      value={categoryForm.description || ''}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    id="cat-editor-cancel"
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-305 hover:bg-white/10 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="cat-editor-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-indigo-500 border border-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/25"
                  >
                    {isSubmitting ? 'Saving...' : editingId ? 'Update Fields' : 'Add to Catalog'}
                  </button>
                </div>
              </form>
            )}

            {/* Categories Listing Table */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/10 max-w-3xl">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-300">
                  <thead className="bg-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Field Name</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 font-bold text-white">{cat.name}</td>
                          <td className="px-6 py-4 text-xs max-w-sm shrink-0 truncate text-slate-350">{cat.description || 'No description log.'}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                id={`edit-category-${cat.id}`}
                                onClick={() => startCategoryEdit(cat)}
                                className="rounded border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                id={`delete-category-${cat.id}`}
                                onClick={() => handleCategoryDelete(cat.id)}
                                className="rounded border border-rose-550/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-350 hover:bg-rose-505/20 hover:text-rose-300 transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                          <FolderOpen className="mx-auto h-8 w-8 text-slate-505 stroke-1" />
                          <p className="mt-2 text-xs">No active index categories cataloged.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
                {/* ==========================================
            TAB: STUDENTS
            ========================================== */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Student Directory & Database</h2>
                <p className="text-xs text-slate-400">Inspect registered student contacts, trace profile statuses, and inject profiles manually.</p>
              </div>
              <button
                id="add-std-trigger-btn"
                onClick={() => {
                  setIsAddingStudent(!isAddingStudent);
                  setEditingId(null);
                  setStudentForm({ name: '', email: '', phone: '' });
                }}
                className="rounded-lg bg-indigo-500 border border-white/10 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition flex items-center gap-1 cursor-pointer"
              >
                {isAddingStudent ? 'Hide Register' : 'Register Student'}
                {!isAddingStudent && <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>

            {isAddingStudent && (
              <form onSubmit={handleStudentSubmit} className="rounded-xl border border-white/10 bg-[#111827]/90 p-5 space-y-4 shadow-2xl backdrop-blur-xl max-w-xl text-white">
                <div className="border-b border-white/10 pb-2">
                  <h3 className="font-bold text-white">{editingId ? 'Modify Student Record' : 'Register Fresh Student Profile'}</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Student Full Name</label>
                    <input
                      id="std-name-field"
                      type="text"
                      required
                      placeholder="Marcus Aurelius"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                    <input
                      id="std-email-field"
                      type="email"
                      required
                      placeholder="marcus@emperor.rome"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone Number (Optional)</label>
                    <input
                      id="std-phone-field"
                      type="tel"
                      placeholder="+1 (555) 753-1590"
                      value={studentForm.phone || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    id="std-editor-cancel"
                    type="button"
                    onClick={() => setIsAddingStudent(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-305 hover:bg-white/10 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="std-editor-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-indigo-500 border border-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/25"
                  >
                    {isSubmitting ? 'Processing...' : editingId ? 'Save Changes' : 'Write Profile'}
                  </button>
                </div>
              </form>
            )}

            {/* Students Table */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/10">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-300">
                  <thead className="bg-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Contact Email</th>
                      <th className="px-6 py-3">Phone Line</th>
                      <th className="px-6 py-3">Cohorts Joined</th>
                      <th className="px-6 py-3 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {students.length > 0 ? (
                      students.map((std) => {
                        const count = enrollments.filter((e) => e.student_id === std.id).length;
                        return (
                          <tr key={std.id} className="hover:bg-white/5 transition">
                            <td className="px-6 py-4 font-bold text-white">{std.name}</td>
                            <td className="px-6 py-4 font-mono text-slate-350">{std.email}</td>
                            <td className="px-6 py-4 text-slate-400">{std.phone || '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                count > 0
                                  ? 'bg-indigo-500/20 border-indigo-550/20 text-indigo-300'
                                  : 'bg-white/5 border-white/10 text-slate-400'
                              }`}>
                                {count} {count === 1 ? 'class' : 'classes'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  id={`edit-student-${std.id}`}
                                  onClick={() => startStudentEdit(std)}
                                  className="rounded border border-white/10 px-2 py-1 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  id={`delete-student-${std.id}`}
                                  onClick={() => handleStudentDelete(std.id)}
                                  className="rounded border border-rose-550/20 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-350 hover:bg-rose-500/20 transition cursor-pointer"
                                >
                                  Purge
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          <Users className="mx-auto h-8 w-8 text-slate-500 stroke-1" />
                          <p className="mt-2 text-xs">Student Directory is empty.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: ENROLLMENTS
            ========================================== */}
        {activeTab === 'enrollments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Cohort Enrollments Desk</h2>
                <p className="text-xs text-slate-400">Connect registered students to course curricula and dispatch status flags.</p>
              </div>
              <button
                id="add-enrollment-trigger-btn"
                onClick={() => {
                  if (students.length === 0 || courses.length === 0) {
                    setErrorText('You must create a student profile and publish at least one course before adding an enrollment.');
                    return;
                  }
                  setIsAddingEnrollment(!isAddingEnrollment);
                  setEnrollmentForm({
                    student_id: students[0]?.id || 0,
                    course_id: courses[0]?.id || 0,
                    status: 'active',
                  });
                }}
                className="rounded-lg bg-indigo-500 border border-white/10 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition flex items-center gap-1 cursor-pointer"
              >
                {isAddingEnrollment ? 'Close Editor' : 'Link Enrollment'}
                {!isAddingEnrollment && <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>

            {isAddingEnrollment && (
              <form onSubmit={handleEnrollmentSubmit} className="rounded-xl border border-white/10 bg-[#111827]/90 p-5 space-y-4 shadow-2xl backdrop-blur-xl max-w-xl text-white">
                <div className="border-b border-white/10 pb-2">
                  <h3 className="font-bold text-white">Configure Placement Blueprint</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-350 uppercase mb-1">Select Student</label>
                    <select
                      id="enroll-student-select"
                      required
                      value={enrollmentForm.student_id}
                      onChange={(e) => setEnrollmentForm({ ...enrollmentForm, student_id: Number(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm text-white outline-none focus:border-indigo-500 bg-[#1e293b]"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#1e293b] text-white">
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-350 uppercase mb-1">Select Sponsoring Course</label>
                    <select
                      id="enroll-course-select"
                      required
                      value={enrollmentForm.course_id}
                      onChange={(e) => setEnrollmentForm({ ...enrollmentForm, course_id: Number(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm text-white outline-none focus:border-indigo-500 bg-[#1e293b]"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#1e293b] text-white">
                          {c.title} (${c.price})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    id="enroll-editor-cancel"
                    type="button"
                    onClick={() => setIsAddingEnrollment(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-350 hover:bg-white/10 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="enroll-editor-submit"
                    type="submit"
                    className="rounded-lg bg-indigo-500 border border-white/10 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-600 transition cursor-pointer shadow-lg shadow-indigo-500/25"
                  >
                    Post Placement
                  </button>
                </div>
              </form>
            )}

            {/* Enrollments Listing Table */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/10">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-300">
                  <thead className="bg-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Student Placement</th>
                      <th className="px-6 py-3">Linked Curriculum</th>
                      <th className="px-6 py-3">Join Date</th>
                      <th className="px-6 py-3">Status State</th>
                      <th className="px-6 py-3 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {enrollments.length > 0 ? (
                      enrollments.map((enr) => {
                        const targetStudent = students.find((s) => s.id === enr.student_id);
                        const targetCourse = courses.find((c) => c.id === enr.course_id);

                        return (
                          <tr key={enr.id} className="hover:bg-white/5 transition">
                            <td className="px-6 py-4">
                              <span className="block font-bold text-white">{targetStudent ? targetStudent.name : `Student #${enr.student_id}`}</span>
                              <span className="block text-xs text-slate-400 font-mono">{targetStudent?.email}</span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-300">
                              {targetCourse ? targetCourse.title : `Course #${enr.course_id}`}
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-slate-400">
                              {enr.enrollment_date ? new Date(enr.enrollment_date).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <select
                                id={`enr-status-select-${enr.id}`}
                                value={enr.status}
                                onChange={(e) => handleEnrollmentStatusChange(enr.id, e.target.value)}
                                className={`rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider border outline-none cursor-pointer bg-[#1e293b] text-white ${
                                  enr.status === 'active'
                                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                                    : enr.status === 'completed'
                                    ? 'bg-[#10b981]/15 border-[#10b981]/40 text-emerald-300'
                                    : 'bg-white/5 border-white/20 text-slate-350'
                                }`}
                              >
                                <option value="active" className="bg-[#1e293b]">Active</option>
                                <option value="completed" className="bg-[#1e293b]">Completed</option>
                                <option value="cancelled" className="bg-[#1e293b]">Cancelled</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                id={`delete-enrollment-${enr.id}`}
                                onClick={() => handleEnrollmentDelete(enr.id)}
                                className="rounded border border-rose-550/20 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-350 hover:bg-rose-500/20 transition cursor-pointer"
                              >
                                Droppage
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          <Activity className="mx-auto h-8 w-8 text-slate-500 stroke-1" />
                          <p className="mt-2 text-xs">No active cohort links placed.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: PAYMENTS
            ========================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Billing Ledgers & Postings</h2>
                <p className="text-xs text-slate-400 font-medium">Audit student tuition charges, record subsidies, and track payment operations.</p>
              </div>
              <button
                id="add-payment-trigger-btn"
                onClick={() => {
                  if (enrollments.length === 0) {
                    setErrorText('Select students cohort links first in the placements desk to populate billings.');
                    return;
                  }
                  setIsAddingPayment(!isAddingPayment);
                  setPaymentForm({
                    enrollment_id: enrollments[0]?.id || 0,
                    amount: 299,
                    status: 'pending',
                  });
                }}
                className="rounded-lg bg-indigo-500 border border-white/10 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition flex items-center gap-1 cursor-pointer"
              >
                {isAddingPayment ? 'Close Ledger' : 'Invoice Credit'}
                {!isAddingPayment && <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>

            {isAddingPayment && (
              <form onSubmit={handlePaymentSubmit} className="rounded-xl border border-white/10 bg-[#111827]/90 p-5 space-y-4 shadow-2xl backdrop-blur-xl max-w-xl text-white">
                <div className="border-b border-white/10 pb-2">
                  <h3 className="font-bold text-white">Invoice Generation Sheet</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Placement Link</label>
                    <select
                      id="invoice-enrid-select"
                      required
                      value={paymentForm.enrollment_id}
                      onChange={(e) => setPaymentForm({ ...paymentForm, enrollment_id: Number(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-sm text-white outline-none focus:border-indigo-500 bg-[#1e293b]"
                    >
                      {enrollments.map((enr) => {
                        const student = students.find((s) => s.id === enr.student_id);
                        const course = courses.find((c) => c.id === enr.course_id);
                        return (
                          <option key={enr.id} value={enr.id} className="bg-[#1e293b] text-white">
                            #{enr.id} — {student?.name || 'Student'} linked {course?.title || 'Course'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-350 uppercase mb-1">Fee Bill Charge (USD)</label>
                    <input
                      id="invoice-amount-field"
                      type="number"
                      required
                      min={0}
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    id="invoice-cancel-btn"
                    type="button"
                    onClick={() => setIsAddingPayment(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-350 hover:bg-white/10 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="invoice-submit-btn"
                    type="submit"
                    className="rounded-lg bg-indigo-500 border border-white/10 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-600 transition cursor-pointer shadow-lg shadow-indigo-500/25"
                  >
                    Generate Invoice
                  </button>
                </div>
              </form>
            )}

            {/* Payments Log Ledger Table */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/10">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-300">
                  <thead className="bg-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Billing Target</th>
                      <th className="px-6 py-3">Placement Details</th>
                      <th className="px-6 py-3">Billing Amount</th>
                      <th className="px-6 py-3">Posting Date</th>
                      <th className="px-6 py-3">Verification State</th>
                      <th className="px-6 py-3 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {payments.length > 0 ? (
                      payments.map((p) => {
                        const correspondingPlacement = enrollments.find((e) => e.id === p.enrollment_id);
                        const studentDetails = correspondingPlacement
                          ? students.find((s) => s.id === correspondingPlacement.student_id)
                          : null;
                        const courseDetails = correspondingPlacement
                          ? courses.find((c) => c.id === correspondingPlacement.course_id)
                          : null;

                        return (
                          <tr key={p.id} className="hover:bg-white/5 transition">
                            <td className="px-6 py-4">
                              <span className="block font-bold text-white">{studentDetails ? studentDetails.name : `Enrollment ID #${p.enrollment_id}`}</span>
                              <span className="block text-xs text-slate-500 font-mono mt-0.5">Tx ID: #PA-0{p.id}</span>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-350">
                              {courseDetails ? courseDetails.title : '—'}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-emerald-400">${p.amount}</td>
                            <td className="px-6 py-4 text-xs font-mono text-slate-400">
                              {p.payment_date ? new Date(p.payment_date).toLocaleString() : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <select
                                id={`p-status-select-${p.id}`}
                                value={p.status}
                                onChange={(e) => handlePaymentStatusChange(p.id, e.target.value)}
                                className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wider border outline-none cursor-pointer bg-[#1e293b] text-white ${
                                  p.status === 'completed'
                                    ? 'bg-emerald-500/15 border-emerald-550/20 text-emerald-300'
                                    : p.status === 'pending'
                                    ? 'bg-amber-500/15 border-amber-550/20 text-amber-300'
                                    : p.status === 'refunded'
                                    ? 'bg-purple-500/15 border-purple-550/20 text-purple-300'
                                    : 'bg-rose-500/15 border-rose-550/20 text-rose-350'
                                }`}
                              >
                                <option value="completed" className="bg-[#1e293b]">Completed</option>
                                <option value="pending" className="bg-[#1e293b]">Pending</option>
                                <option value="failed" className="bg-[#1e293b]">Failed</option>
                                <option value="refunded" className="bg-[#1e293b]">Refunded</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                id={`delete-payment-${p.id}`}
                                onClick={() => handlePaymentDelete(p.id)}
                                className="rounded border border-rose-550/20 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-350 hover:bg-rose-500/20 transition cursor-pointer"
                              >
                                Void
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          <CreditCard className="mx-auto h-8 w-8 text-slate-650 stroke-1" />
                          <p className="mt-2 text-xs">No billing logs processed in bookkeeping.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: API SERVER SYNC (FASTAPI INSTRUCTIONS)
            ========================================== */}
        {activeTab === 'api-sync' && (
          <div className="space-y-6 max-w-4xl">
            
            {/* FastAPI Config Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-lg shadow-black/10 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-indigo-400" />
                  Dual-Mode FastAPI Connection Center
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Nexus Academy is fully full-stack prepared. Maintain your courses and students catalog on our standard sandboxed local database, or connect dynamically to your running Python FastAPI instance!
                </p>
              </div>

              {/* Endpoint configuration panel elements */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">FastAPI Backend Endpoint URL</label>
                    <input
                      id="api-sync-url-input"
                      type="url"
                      placeholder="e.g. http://localhost:8000"
                      value={draftBaseUrl}
                      onChange={(e) => setDraftBaseUrl(e.target.value)}
                      className="w-full font-mono rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500"
                    />
                  </div>

                  <div className="shrink-0 flex items-end">
                    <button
                      id="api-sync-test-btn"
                      type="button"
                      onClick={onTestConnection}
                      className="rounded-lg bg-indigo-500 border border-white/10 text-white px-4 py-2.5 text-xs font-bold hover:bg-indigo-600 transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/25"
                    >
                      <Wifi className="h-3.5 w-3.5" />
                      Test Link
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/10">
                  <div className="flex-1 flex gap-2.5 items-center">
                    <div className={`h-2.5 w-2.5 rounded-full ${apiConfig.isLive ? (isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500') : 'bg-blue-400'}`} />
                    <span className="text-xs font-medium text-slate-300">
                      Current Mode:{' '}
                      <strong className="text-white font-mono text-[11px]">
                        {apiConfig.isLive
                          ? isConnected
                            ? 'CONNECTED TO FASTAPI'
                            : 'FASTAPI OFFLINE / UNREACHABLE'
                          : 'SANDBOX LOCAL STORAGE'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      id="api-sync-mock-btn"
                      type="button"
                      onClick={() => handleSaveApiSettings(false)}
                      className={`rounded-lg px-4 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                        !apiConfig.isLive
                          ? 'bg-white/10 border-white/15 text-white font-bold'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      Use Sandbox Local
                    </button>
                    
                    <button
                      id="api-sync-live-btn"
                      type="button"
                      onClick={() => handleSaveApiSettings(true)}
                      className={`rounded-lg px-4 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                        apiConfig.isLive
                          ? 'bg-indigo-500 border-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/25'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      Sync Live FastAPI
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Educational developer handbook for real integrations */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-lg shadow-black/10 space-y-4 text-white">
              <div>
                <h4 className="font-bold text-white flex items-center gap-2">
                  <FolderPlus className="h-5 w-5 text-indigo-400" />
                  FastAPI Setup & CORS Integration Blueprint
                </h4>
                <p className="text-xs text-slate-450 mt-1">
                  To ensure errorless data operations, confirm your FastAPI application includes the standard CORS Cross-Origin Resource Sharing middlewares. Paste this python snippet directly in your main application script:
                </p>
              </div>

              {/* Developer Code Block */}
              <div className="rounded-xl bg-[#090d16] font-mono text-xs text-indigo-300 p-4 overflow-x-auto relative shadow-inner border border-white/5">
                <p className="text-[10px] text-indigo-400/70 border-b border-indigo-950 pb-2 mb-2 uppercase font-extrabold tracking-wider">FastAPI snippet — main.py</p>
                <code className="block whitespace-pre">
{`from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Course Management System API")

# CRITICAL CORS BINDING: Bypasses browser cross-origin locks
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify AI Studio preview domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to Nexus Academy API"}`}
                </code>
              </div>

              <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-4 flex gap-3 text-xs text-indigo-200 leading-normal">
                <AlertCircle className="h-5 w-5 shrink-0 text-indigo-400" />
                <div>
                  <span className="font-bold text-white">Important Browser Note:</span> Since this preview environment runs inside a sandbox container iframe, testing localhost backend URLs (e.g. <code className="font-mono bg-purple-500/20 px-1 py-0.5 rounded text-[11px] text-purple-300">http://localhost:8000</code>) is highly secure, but may require clicking the <strong className="text-indigo-300">Open in New Tab</strong> button near the preview panel if your browser blocks mixed-content iframe resources.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
