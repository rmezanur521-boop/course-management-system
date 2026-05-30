/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Tag,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
  CreditCard,
  User,
  Mail,
  Phone,
  BookOpen,
  Lock // ✅ Fixed: Added missing Lock icon import
} from 'lucide-react';
import { Course, Category, Student, StudentCreate, Enrollment } from '../types';
import * as api from '../lib/api';

interface PublicCatalogProps {
  courses: Course[];
  categories: Category[];
  onRefreshAll: () => void;
}

export default function PublicCatalog({ courses, categories, onRefreshAll }: PublicCatalogProps) {
  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [catalogSort, setCatalogSort] = useState<'none' | 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc'>('none');
  
  // Active course for detail view / enrollment Modal triggers
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  
  // Registration Flow state
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [studentForm, setStudentForm] = useState<StudentCreate>({
    name: '',
    email: '',
    phone: '',
  });

  // Secure Checkout payment state
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1); // 1 = Registration Info, 2 = Payment Info
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardZip, setCardZip] = useState('');
  const [cardFocus, setCardFocus] = useState<'none' | 'name' | 'number' | 'expiry' | 'cvv'>('none');
  
  // Feedback States
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState<{
    student: Student;
    enrollment: Enrollment;
    paymentAmount: number;
    courseTitle: string;
  } | null>(null);

  // ✅ Fixed: Defensive Programming to completely prevent 'courses.filter is not a function'
  const coursesArray = Array.isArray(courses) ? courses : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];

  // Filter courses based on selections
  const filteredCourses = coursesArray.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) || 
                          (course.description && course.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategoryId === 'all' || course.category_id === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  // Sort courses
  if (catalogSort === 'price-asc') {
    filteredCourses.sort((a, b) => a.price - b.price);
  } else if (catalogSort === 'price-desc') {
    filteredCourses.sort((a, b) => b.price - a.price);
  } else if (catalogSort === 'title-asc') {
    filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
  } else if (catalogSort === 'title-desc') {
    filteredCourses.sort((a, b) => b.title.localeCompare(a.title));
  }

  // Card Number Input Masker
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const cleanChunks = rawVal.match(/.{1,4}/g);
    if (cleanChunks) {
      setCardNumber(cleanChunks.slice(0, 4).join(' '));
    } else {
      setCardNumber('');
    }
  };

  // Expiry date Input Masker
  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (rawVal.length <= 2) {
      setCardExpiry(rawVal);
    } else {
      setCardExpiry(`${rawVal.slice(0, 2)}/${rawVal.slice(2, 4)}`);
    }
  };

  // Handle enrollment creation
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;

    if (checkoutStep === 1) {
      if (!studentForm.name || !studentForm.email) {
        setErrorMessage('Name and Email are required.');
        setSubmissionStatus('error');
        return;
      }
      setErrorMessage('');
      setSubmissionStatus('idle');
      setCheckoutStep(2);
      return;
    }

    if (!cardName.trim()) {
      setErrorMessage('Cardholder Name is required.');
      setSubmissionStatus('error');
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 15) {
      setErrorMessage('Please provide a valid long credit card number.');
      setSubmissionStatus('error');
      return;
    }
    if (cardExpiry.length < 5) {
      setErrorMessage('Expiration Date is incomplete (MM/YY).');
      setSubmissionStatus('error');
      return;
    }
    if (cardCvv.length < 3) {
      setErrorMessage('Security Code CVV must be completed.');
      setSubmissionStatus('error');
      return;
    }

    setSubmissionStatus('loading');
    setErrorMessage('');

    try {
      // Simulate payment processing handshake
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 1: Create or Fetch Student Record
      const student = await api.createStudent(studentForm);

      // Step 2: Create Enrollment Link
      const enrollmentObj = await api.createEnrollment({
        student_id: student.id,
        course_id: activeCourse.id,
        status: 'active'
      });

      // Step 3: Trigger Mock Payment record
      await api.createPayment({
        enrollment_id: enrollmentObj.id,
        amount: activeCourse.price,
        status: 'completed'
      });

      // Track details on UI success state
      setSuccessDetails({
        student,
        enrollment: enrollmentObj,
        paymentAmount: activeCourse.price,
        courseTitle: activeCourse.title
      });

      setSubmissionStatus('success');
      onRefreshAll(); // Reload global list to sync dashboard views
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during student enrollment processing.');
      setSubmissionStatus('error');
    }
  };

  // Reset helper
  const closeDetailsModal = () => {
    setActiveCourse(null);
    setIsEnrolling(false);
    setStudentForm({ name: '', email: '', phone: '' });
    setCheckoutStep(1);
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardZip('');
    setCardFocus('none');
    setSubmissionStatus('idle');
    setErrorMessage('');
    setSuccessDetails(null);
  };

  return (
    <div className="bg-[#0f172a]/40 text-slate-100 min-h-screen">
      {/* Decorative ambient background */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none -z-10" />

      {/* Hero Header */}
      <section className="relative px-6 pt-16 pb-12 text-center lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20 mb-6">
            <Sparkles className="h-3 w-3" />
            Empower Your Career Path
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Acquire high-impact <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">modern skills</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
            A comprehensive catalog of carefully curated, premium business and software courses designed to take you from core basics to professional excellence.
          </p>
        </div>

        {/* Global Catalog Statistics Panel */}
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md sm:grid-cols-4">
          <div className="text-center border-r border-white/5 last:border-0 last:pr-0">
            <p className="text-3xl font-extrabold tracking-tight text-indigo-400">{coursesArray.length}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Mastery Courses</p>
          </div>
          <div className="text-center sm:border-r border-white/5 pr-4 last:border-0 last:pr-0">
            <p className="text-3xl font-extrabold tracking-tight text-indigo-400">{categoriesArray.length}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Industry Classes</p>
          </div>
          <div className="text-center border-r border-white/5 pr-4 last:border-0 last:pr-0">
            <p className="text-3xl font-extrabold tracking-tight text-indigo-400">4.9 ★</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Student Rating</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tracking-tight text-indigo-400">Self-Paced</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Flexible Schedule</p>
          </div>
        </div>
      </section>

      {/* Main filter & catalog grid */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        {/* Controls Panel */}
        <div className="flex flex-col gap-4 rounded-xl bg-white/5 p-4 border border-white/10 backdrop-blur-md md:flex-row md:items-center md:justify-between">
          
          {/* Text Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="catalog-search-input"
              type="text"
              placeholder="Search active courses or curriculum..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 text-white py-2 pl-9 pr-4 text-sm outline-none transition duration-200 focus:border-indigo-500 focus:bg-white/10 placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sort options */}
            <div className="flex items-center gap-1.5 rounded-lg border border-white/5 px-3 py-1.5 text-xs text-slate-300 bg-white/5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Sort by:</span>
              <select
                id="catalog-sort-select"
                value={catalogSort}
                onChange={(e) => setCatalogSort(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-300 outline-none cursor-pointer"
              >
                <option value="none" className="bg-[#0f172a]">Default</option>
                <option value="price-asc" className="bg-[#0f172a]">Price: Low to High</option>
                <option value="price-desc" className="bg-[#0f172a]">Price: High to Low</option>
                <option value="title-asc" className="bg-[#0f172a]">Title: A to Z</option>
                <option value="title-desc" className="bg-[#0f172a]">Title: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Tabs list */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5 overflow-x-auto pb-2">
          <button
            id="cat-tab-all"
            onClick={() => setSelectedCategoryId('all')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition duration-150 cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-indigo-500 text-white border-indigo-500/20 shadow-lg shadow-indigo-500/20'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            All Fields ({coursesArray.length})
          </button>
          
          {categoriesArray.map((cat) => {
            const courseCount = coursesArray.filter((c) => c.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                id={`cat-tab-${cat.id}`}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold border transition duration-150 cursor-pointer ${
                  selectedCategoryId === cat.id
                    ? 'bg-indigo-500 text-white border-indigo-500/20 shadow-lg shadow-indigo-500/20'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.name}
                <span className={`inline-flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[10px] font-bold ${
                  selectedCategoryId === cat.id ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300'
                }`}>
                  {courseCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Courses Listing Grid */}
        <div className="mt-8">
          {filteredCourses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => {
                const category = categoriesArray.find((c) => c.id === course.category_id);
                
                return (
                  <div
                    key={course.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 shadow-lg shadow-black/10"
                  >
                    {/* Course card banner design pattern */}
                    <div className="relative h-40 w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 flex flex-col justify-end">
                      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-all duration-300" />
                      <div className="relative z-10">
                        <span className="inline-block rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-wider px-2.5 py-0.5 uppercase">
                          {category ? category.name : 'Unassigned'}
                        </span>
                        <div className="mt-2 text-white font-extrabold text-lg line-clamp-2 md:text-xl leading-tight">
                          {course.title}
                        </div>
                      </div>
                    </div>

                    {/* Course Card Body */}
                    <div className="flex flex-1 flex-col p-5">
                      <p className="flex-1 text-sm text-slate-300 line-clamp-3 leading-relaxed">
                        {course.description || 'No overview timeline configured for this syllabus. Click enroll below for details.'}
                      </p>

                      <div className="mt-5 border-t border-white/10 pt-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">TUITION FEES</p>
                          <p className="text-xl font-display font-extrabold text-white">${course.price}</p>
                        </div>

                        <button
                          id={`enroll-view-btn-${course.id}`}
                          onClick={() => setActiveCourse(course)}
                          className="flex items-center gap-1 rounded-lg bg-indigo-500 border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-600 cursor-pointer shadow-lg shadow-indigo-500/25"
                        >
                          Details & Apply
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 backdrop-blur-md py-16 px-4 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-slate-500" />
              <h3 className="mt-4 text-base font-bold text-white">No courses match your query</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
                Try widening your filters, clearing your search query, or switching categories.
              </p>
              <button
                id="clear-catalog-filters-btn"
                onClick={() => {
                  setSearch('');
                  setSelectedCategoryId('all');
                  setCatalogSort('none');
                }}
                className="mt-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30 transition cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Details & Enrollment modal */}
      {activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#111827]/90 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300 md:max-w-2xl">
            {/* Modal Header */}
            <div className="relative p-6 bg-gradient-to-r from-indigo-950/80 to-slate-950/80 border-b border-white/10 text-white min-h-[140px] flex flex-col justify-end">
              <button
                id="catalog-close-modal"
                onClick={closeDetailsModal}
                className="absolute top-4 right-4 rounded-full bg-white/5 p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              
              <span className="inline-block rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 text-[10px] font-bold tracking-wider px-2 py-0.5 uppercase max-w-max">
                {categoriesArray.find(c => c.id === activeCourse.category_id)?.name || 'Course Class'}
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
                {activeCourse.title}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {!isEnrolling ? (
                /* VIEW 1: Information Overview */
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-mono tracking-wider text-slate-400 uppercase font-bold">About This course</h3>
                    <p className="mt-2 text-slate-200 leading-relaxed text-sm whitespace-pre-line md:text-base">
                      {activeCourse.description || 'This curriculum prepares students to master core operational frameworks, real-time metrics dashboards, and deployment models tailored for the industry.'}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3 border-t border-white/10 pt-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">12 Weeks</span>
                        <span className="block text-[10px] text-slate-400 font-mono">Duration</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">Certificate</span>
                        <span className="block text-[10px] text-slate-400 font-mono">Upon Completion</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/25">
                        <Tag className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">${activeCourse.price}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">Flat Rate tuition</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-5 mt-6">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Have questions? Live assistance available.</p>
                      <p className="text-xl font-display font-extrabold text-white">${activeCourse.price} USD</p>
                    </div>
                    <button
                      id="catalog-trigger-enroll-btn"
                      onClick={() => setIsEnrolling(true)}
                      className="rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 transition cursor-pointer border border-white/10"
                    >
                      Begin Application
                    </button>
                  </div>
                </div>
              ) : (
                /* VIEW 2: Enrollment & Registration Application Form */
                <div>
                  {submissionStatus === 'success' && successDetails ? (
                    <div className="text-center py-6">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 animate-bounce">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Application & Tuition Processed!</h3>
                      <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                        Welcome to the Nexus cohort, <strong className="text-white">{successDetails.student.name}</strong>! Your flat-rate tuition seat has been fully captured and credited.
                      </p>

                      {/* Professional Invoice Receipt */}
                      <div className="mt-6 rounded-2xl bg-[#0b0f19] border border-white/10 p-5 text-left max-w-md mx-auto space-y-3.5 text-xs text-slate-300 relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 p-1 bg-emerald-500/10 border-b border-l border-white/10 text-emerald-400 font-mono text-[9px] uppercase tracking-widest font-extrabold rounded-bl-lg">
                          PAID & SECURED
                        </div>
                        
                        <div className="border-b border-white/5 pb-2">
                          <span className="block text-[9px] font-mono tracking-wider uppercase text-slate-500">COHORT TRANSACTION RECEIPT</span>
                          <span className="font-mono font-bold text-indigo-400 text-xs">TX-ID: #NEX-{Math.floor(Math.random() * 900000) + 100000}</span>
                        </div>

                        <div className="space-y-2 font-mono">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">STUDENT PROFILE:</span>
                            <span className="font-bold text-white truncate max-w-[200px]">{successDetails.student.name}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">STUDENT EMAIL:</span>
                            <span className="font-bold text-white max-w-[200px] truncate">{successDetails.student.email}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">ENROLLED PATH:</span>
                            <span className="font-bold text-white max-w-[200px] truncate">{successDetails.courseTitle}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">REGISTRATION Seat ID:</span>
                            <span className="font-bold text-white">#E-00{successDetails.enrollment.id}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] border-t border-white/5 pt-2 text-indigo-300">
                            <span className="text-slate-400 uppercase">Settled Tuition Price:</span>
                            <span className="font-bold text-emerald-400 font-mono text-sm">${successDetails.paymentAmount}.00 USD</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono italic text-center pt-1 border-t border-dashed border-white/10 leading-normal">
                          Credit statement generated on {new Date().toLocaleDateString()}. Go to your "Student Dashboard" navigation tab and type "{successDetails.student.email}" to stream your learning tracks instantly!
                        </div>
                      </div>

                      <div className="mt-8 flex justify-center gap-3">
                        <button
                          id="enroll-modal-finish"
                          onClick={closeDetailsModal}
                          className="rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition cursor-pointer"
                        >
                          Discover More Courses
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleEnrollSubmit} className="space-y-5">
                      {/* Step Progress indicators */}
                      <div className="flex justify-between items-center bg-white/5 rounded-xl border border-white/5 px-4 py-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                            checkoutStep === 1 ? 'bg-indigo-500 text-white' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            1
                          </span>
                          <span className={checkoutStep === 1 ? 'text-white font-bold' : 'text-slate-400'}>Profile Info</span>
                        </div>
                        <div className="h-px bg-white/10 flex-1 mx-3" />
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                            checkoutStep === 2 ? 'bg-indigo-500 text-white animate-pulse' : 'bg-white/10 text-slate-400'
                          }`}>
                            2
                          </span>
                          <span className={checkoutStep === 2 ? 'text-white font-bold' : 'text-slate-400'}>Secure Payment Checkout</span>
                        </div>
                      </div>

                      {submissionStatus === 'error' && (
                        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3.5 flex items-start gap-2.5 text-xs text-rose-400">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Checkout Failure: </span>
                            {errorMessage}
                          </div>
                        </div>
                      )}

                      {/* SUB-FORM 1: Profiles details */}
                      {checkoutStep === 1 ? (
                        <div className="space-y-4">
                          <div className="border-b border-white/10 pb-2">
                            <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">Student Account Profile Setup</h3>
                            <p className="text-[11px] text-slate-400 leading-normal">Enter cohort profile variables. We will synchronize lessons and certifications to this identity.</p>
                          </div>

                          {/* Name Input */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Full Name</label>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                              <input
                                id="enroll-form-name"
                                type="text"
                                required
                                placeholder="e.g. John Doe"
                                value={studentForm.name}
                                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition focus:bg-white/10"
                              />
                            </div>
                          </div>

                          {/* Email Input */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono font-bold">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                              <input
                                id="enroll-form-email"
                                type="email"
                                required
                                placeholder="e.g. johndoe@domain.com"
                                value={studentForm.email}
                                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition focus:bg-white/10"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">Important: Log in to your study room later using this exact lookup.</span>
                          </div>

                          {/* Phone Input */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">Phone Number (Optional)</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                              <input
                                id="enroll-form-phone"
                                type="tel"
                                placeholder="e.g. +1 (555) 123-4567"
                                value={studentForm.phone || ''}
                                onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition focus:bg-white/10"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-3 text-xs">
                            <div>
                              <span className="block text-[10px] text-slate-400 uppercase font-mono">Tuition Cost Charge</span>
                              <span className="font-extrabold text-white text-base">${activeCourse.price}.00 USD</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono tracking-wider italic">Secure flat-rate seat</div>
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                            <button
                              id="enroll-form-cancel"
                              type="button"
                              onClick={() => setIsEnrolling(false)}
                              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition cursor-pointer"
                            >
                              Cancel View
                            </button>
                            <button
                              id="enroll-form-next"
                              type="submit"
                              className="rounded-lg bg-indigo-500 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-600 transition cursor-pointer border border-white/10"
                            >
                              Proceed to Payment Info →
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* SUB-FORM 2: Secure Payment Form */
                        <div className="space-y-4">
                          <div className="border-b border-white/10 pb-2">
                            <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono flex items-center gap-2">
                              <Lock className="h-4 w-4 text-emerald-400" />
                              Encryption tuition Checkout
                            </h3>
                            <p className="text-[11px] text-slate-400 leading-normal">Provide mock credentials to bind your enrollment token. No real accounts are charged.</p>
                          </div>

                          {/* INTERACTIVE CREDIT CARD VISUAL MOCKUP */}
                          <div className={`rounded-xl p-5 bg-gradient-to-br from-indigo-900 via-purple-800 to-slate-900 border transition shadow-2xl relative overflow-hidden text-white h-40 flex flex-col justify-between select-none ${
                            cardFocus !== 'none' ? 'border-indigo-400 scale-[1.02] shadow-indigo-500/20' : 'border-white/10'
                          }`}>
                            <div className="absolute top-[-40%] right-[-10%] w-48 h-48 bg-fuchsia-400/10 rounded-full blur-2xl pointer-events-none" />
                            
                            {/* Card Top */}
                            <div className="flex justify-between items-start z-10">
                              <div>
                                <span className="block text-[9px] font-mono tracking-wider text-indigo-300 font-extrabold">NEXUS ACADEMY STUDENT SECURE</span>
                                <span className="text-[10px] font-mono opacity-80 uppercase leading-none font-medium text-slate-300">Sandbox Payment Network</span>
                              </div>
                              <CreditCard className="h-6 w-6 text-indigo-300 group-hover:scale-110 transition shrink-0" />
                            </div>

                            {/* Card Chip & Number Display */}
                            <div className="z-10 bg-slate-900/15 p-2 rounded-lg border border-white/5 font-mono text-center tracking-widest text-sm text-indigo-200">
                              {cardNumber || '•••• •••• •••• ••••'}
                            </div>

                            {/* Card Bottom */}
                            <div className="flex justify-between items-end z-10">
                              <div className="truncate max-w-[200px]">
                                <span className="block text-[8px] font-mono tracking-wider uppercase text-indigo-350">CARDHOLDER NAME</span>
                                <span className="font-mono text-xs font-bold uppercase truncate text-white block">
                                  {cardName || 'YOUR FULL NAME'}
                                </span>
                              </div>
                              <div className="flex gap-4 shrink-0 text-right">
                                <div>
                                  <span className="block text-[8px] font-mono tracking-wider uppercase text-indigo-350">EXPIRY</span>
                                  <span className="font-mono text-xs font-bold text-white block">
                                    {cardExpiry || 'MM/YY'}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[8px] font-mono tracking-wider uppercase text-indigo-350">CVV</span>
                                  <span className="font-mono text-xs font-bold text-white block">
                                    {cardCvv ? '•••' : 'CVV'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* CARD FIELDS FORM GRID */}
                          <div className="grid gap-3 sm:grid-cols-2">
                            {/* Cardholder name input */}
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Cardholder Full Name</label>
                              <input
                                id="payment-card-name"
                                type="text"
                                required
                                placeholder="CARDHOLDER NAME"
                                value={cardName}
                                onFocus={() => setCardFocus('name')}
                                onBlur={() => setCardFocus('none')}
                                onChange={(e) => setCardName(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-xs font-mono uppercase text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                              />
                            </div>

                            {/* Card Number input */}
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Long Credit Card Number</label>
                              <input
                                id="payment-card-number"
                                type="text"
                                required
                                placeholder="4000 1234 5678 9010"
                                maxLength={19}
                                value={cardNumber}
                                onFocus={() => setCardFocus('number')}
                                onBlur={() => setCardFocus('none')}
                                onChange={handleCardNumberChange}
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                              />
                            </div>

                            {/* Card Expiration field */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Expiry MM/YY</label>
                              <input
                                id="payment-card-expiry"
                                type="text"
                                required
                                placeholder="12/28"
                                maxLength={5}
                                value={cardExpiry}
                                onFocus={() => setCardFocus('expiry')}
                                onBlur={() => setCardFocus('none')}
                                onChange={handleCardExpiryChange}
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-indigo-500 text-center"
                              />
                            </div>

                            {/* CVV Input */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">CVV Security Code</label>
                              <input
                                id="payment-card-cvv"
                                type="password"
                                required
                                placeholder="•••"
                                maxLength={3}
                                value={cardCvv}
                                onFocus={() => setCardFocus('cvv')}
                                onBlur={() => setCardFocus('none')}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-indigo-500 text-center"
                              />
                            </div>

                            {/* Zip code index */}
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Billing Postal ZIP Code</label>
                              <input
                                id="payment-card-zip"
                                type="text"
                                required
                                placeholder="10001"
                                maxLength={10}
                                value={cardZip}
                                onChange={(e) => setCardZip(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 px-3 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          {/* SSL Padlock warning indicator */}
                          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 flex gap-2.5 items-start text-[10px] text-slate-400 leading-normal">
                            <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="block font-bold text-emerald-300 font-mono uppercase">SSL HANDSHAKE ACTIVATED (AES-256 ENCRYPTED)</span>
                              Real card parameters are never shipped. We simulate authorized bookkeeping records inside your browser standard sandbox.
                            </div>
                          </div>

                          {/* Action Controllers */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-6">
                            <button
                              id="payment-back-btn"
                              type="button"
                              onClick={() => {
                                setCheckoutStep(1);
                                setErrorMessage('');
                                setSubmissionStatus('idle');
                              }}
                              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition cursor-pointer"
                            >
                              ← Student Profile Settings
                            </button>

                            <button
                              id="enroll-form-submit"
                              type="submit"
                              disabled={submissionStatus === 'loading'}
                              className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 transition cursor-pointer border border-white/10 disabled:opacity-50"
                            >
                              {submissionStatus === 'loading' ? 'Encrypting Auth...' : `Authorize & Process $${activeCourse.price}.00`}
                            </button>
                          </div>
                        </div>
                      )}
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}