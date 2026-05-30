/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Category,
  CategoryCreate,
  CategoryUpdate,
  Course,
  CourseCreate,
  CourseUpdate,
  Student,
  StudentCreate,
  StudentUpdate,
  Enrollment,
  EnrollmentCreate,
  EnrollmentUpdate,
  Payment,
  PaymentCreate,
  PaymentUpdate,
  ApiConfig,
} from '../types';

const CONFIG_KEY = 'cms_api_config';
const CATEGORIES_KEY = 'cms_categories';
const COURSES_KEY = 'cms_courses';
const STUDENTS_KEY = 'cms_students';
const ENROLLMENTS_KEY = 'cms_enrollments';
const PAYMENTS_KEY = 'cms_payments';

// Default pre-seeded mock data for beautiful visual demonstration on first boot
const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Software Development', description: 'Web, mobile, desktop and cloud engineering skills.' },
  { id: 2, name: 'Creative Design', description: 'User interface, user experience, typography, and illustration.' },
  { id: 3, name: 'Product & Business', description: 'Product management, agile methods, analytics, and marketing.' },
];

const DEFAULT_COURSES: Course[] = [
  {
    id: 1,
    title: 'Full-Stack React & Node Bootcamp',
    description: 'Learn modern Web Development from database design to hosting and deployment.',
    price: 499,
    category_id: 1,
  },
  {
    id: 2,
    title: 'UI/UX Design Masterclass',
    description: 'Design beautiful, accessible, and responsive visual interfaces using Figma and motion principles.',
    price: 299,
    category_id: 2,
  },
  {
    id: 3,
    title: 'Python for Data Science & AI',
    description: 'Learn data analysis, statistical operations, and deep learning using industry-standard notebooks.',
    price: 399,
    category_id: 1,
  },
  {
    id: 4,
    title: 'Growth Marketing & Analytics',
    description: 'Build acquisition loops, track conversions, and map funnels with high-performance tracking.',
    price: 199,
    category_id: 3,
  },
];

const DEFAULT_STUDENTS: Student[] = [
  { id: 1, name: 'Alice Watson', email: 'alice.watson@gmail.com', phone: '+1 (555) 234-5678' },
  { id: 2, name: 'Marcus Sterling', email: 'm.sterling@techcorp.com', phone: '+1 (555) 876-5432' },
  { id: 3, name: 'Elena Rostova', email: 'elena.rostova@design.co', phone: null },
  { id: 4, name: 'David Kim', email: 'david.kim@academia.edu', phone: '+1 (555) 432-1098' },
];

const DEFAULT_ENROLLMENTS: Enrollment[] = [
  { id: 1, student_id: 1, course_id: 1, status: 'active', enrollment_date: '2026-05-10T14:30:00Z' },
  { id: 2, student_id: 2, course_id: 3, status: 'active', enrollment_date: '2026-05-15T09:12:00Z' },
  { id: 3, student_id: 3, course_id: 2, status: 'completed', enrollment_date: '2026-04-01T10:00:00Z' },
  { id: 4, student_id: 4, course_id: 1, status: 'cancelled', enrollment_date: '2026-05-20T16:45:00Z' },
];

const DEFAULT_PAYMENTS: Payment[] = [
  { id: 1, enrollment_id: 1, amount: 499, status: 'completed', payment_date: '2026-05-10T14:35:00Z' },
  { id: 2, enrollment_id: 2, amount: 399, status: 'completed', payment_date: '2026-05-15T09:15:00Z' },
  { id: 3, enrollment_id: 3, amount: 299, status: 'completed', payment_date: '2026-04-01T10:05:00Z' },
  { id: 4, enrollment_id: 4, amount: 499, status: 'refunded', payment_date: '2026-05-20T17:00:00Z' },
];

/**
 * Initialize mock data if not existing in LocalStorage
 */
export function initializeStorage() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(CATEGORIES_KEY)) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(COURSES_KEY)) {
    localStorage.setItem(COURSES_KEY, JSON.stringify(DEFAULT_COURSES));
  }
  if (!localStorage.getItem(STUDENTS_KEY)) {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(DEFAULT_STUDENTS));
  }
  if (!localStorage.getItem(ENROLLMENTS_KEY)) {
    localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(DEFAULT_ENROLLMENTS));
  }
  if (!localStorage.getItem(PAYMENTS_KEY)) {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(DEFAULT_PAYMENTS));
  }
}

/**
 * Get current API Settings
 */
export function getApiConfig(): ApiConfig {
  if (typeof window === 'undefined') return { baseUrl: 'http://localhost:8000', isLive: false };
  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) {
    return { baseUrl: 'http://localhost:8000', isLive: false };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return { baseUrl: 'http://localhost:8000', isLive: false };
  }
}

/**
 * Save new API Settings
 */
export function saveApiConfig(config: ApiConfig) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// Helper: Local Storage Storage Writers/Readers
function getLocal<T>(key: string): T[] {
  initializeStorage();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveLocal<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Generates next incremental ID for local records
function getNextId(key: string): number {
  const items = getLocal<{ id: number }>(key);
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map(i => i.id)) + 1;
}

// Universal API fetch client helper for Live Mode
async function makeRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const config = getApiConfig();
  
  // Clean path to prevent double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${config.baseUrl.replace(/\/$/, '')}${cleanPath}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Auth Token if available in LocalStorage
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let errMsg = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        if (typeof errJson.detail === 'string') {
          errMsg = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          errMsg = errJson.detail.map((e: any) => `${e.loc?.join('.') || 'Validation'}: ${e.msg}`).join('; ');
        }
      }
    } catch {
      // ignore JSON parse fail
    }
    throw new Error(errMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * ==========================================
 * CATEGORIES ENDPOINTS
 * ==========================================
 */
export async function getCategories(): Promise<Category[]> {
  const config = getApiConfig();
  return config.isLive ? makeRequest<Category[]>('/categories/') : getLocal<Category>(CATEGORIES_KEY);
}

export async function createCategory(data: CategoryCreate): Promise<Category> {
  const config = getApiConfig();
  if (config.isLive) {
    return makeRequest<Category>('/categories/', 'POST', data);
  } else {
    const categories = getLocal<Category>(CATEGORIES_KEY);
    const newCategory: Category = {
      id: getNextId(CATEGORIES_KEY),
      name: data.name,
      description: data.description || null,
    };
    categories.push(newCategory);
    saveLocal(CATEGORIES_KEY, categories);
    return newCategory;
  }
}

export async function updateCategory(id: number, data: CategoryUpdate): Promise<Category> {
  const config = getApiConfig();
  if (config.isLive) {
    return makeRequest<Category>(`/categories/${id}`, 'PUT', data);
  } else {
    const categories = getLocal<Category>(CATEGORIES_KEY);
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    categories[idx] = {
      ...categories[idx],
      ...(data.name !== undefined && { name: data.name! }),
      ...(data.description !== undefined && { description: data.description }),
    };
    saveLocal(CATEGORIES_KEY, categories);
    return categories[idx];
  }
}

export async function deleteCategory(id: number): Promise<void> {
  const config = getApiConfig();
  if (config.isLive) {
    await makeRequest<void>(`/categories/${id}`, 'DELETE');
  } else {
    let categories = getLocal<Category>(CATEGORIES_KEY);
    categories = categories.filter(c => c.id !== id);
    saveLocal(CATEGORIES_KEY, categories);
  }
}

/**
 * ==========================================
 * COURSES ENDPOINTS
 * ==========================================
 */
export async function getCourses(): Promise<Course[]> {
  const config = getApiConfig();
  return config.isLive ? makeRequest<Course[]>('/courses/') : getLocal<Course>(COURSES_KEY);
}

export async function createCourse(data: CourseCreate): Promise<Course> {
  const config = getApiConfig();
  if (config.isLive) {
    return makeRequest<Course>('/courses/', 'POST', data);
  } else {
    const courses = getLocal<Course>(COURSES_KEY);
    const newCourse: Course = {
      id: getNextId(COURSES_KEY),
      title: data.title,
      description: data.description || null,
      price: Number(data.price),
      category_id: Number(data.category_id),
    };
    courses.push(newCourse);
    saveLocal(COURSES_KEY, courses);
    return newCourse;
  }
}

export async function updateCourse(id: number, data: CourseUpdate): Promise<Course> {
  const config = getApiConfig();
  if (config.isLive) {
    return makeRequest<Course>(`/courses/${id}`, 'PUT', data);
  } else {
    const courses = getLocal<Course>(COURSES_KEY);
    const idx = courses.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Course not found');
    courses[idx] = {
      ...courses[idx],
      ...(data.title !== undefined && { title: data.title! }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: Number(data.price!) }),
      ...(data.category_id !== undefined && { category_id: Number(data.category_id!) }),
    };
    saveLocal(COURSES_KEY, courses);
    return courses[idx];
  }
}

export async function deleteCourse(id: number): Promise<void> {
  const config = getApiConfig();
  if (config.isLive) {
    await makeRequest<void>(`/courses/${id}`, 'DELETE');
  } else {
    let courses = getLocal<Course>(COURSES_KEY);
    courses = courses.filter(c => c.id !== id);
    saveLocal(COURSES_KEY, courses);
  }
}

/**
 * ==========================================
 * STUDENTS ENDPOINTS
 * ==========================================
 */
export async function getStudents(): Promise<Student[]> {
  const config = getApiConfig();
  return config.isLive ? makeRequest<Student[]>('/students/') : getLocal<Student>(STUDENTS_KEY);
}

export async function createStudent(data: StudentCreate): Promise<Student> {
  const config = getApiConfig();
  if (config.isLive) {
    return makeRequest<Student>('/students/', 'POST', data);
  } else {
    const students = getLocal<Student>(STUDENTS_KEY);
    const existing = students.find(s => s.email.toLowerCase() === data.email.toLowerCase());
    if (existing) return existing;

    const newStudent: Student = {
      id: getNextId(STUDENTS_KEY),
      name: data.name,
      email: data.email,
      phone: data.phone || null,
    };
    students.push(newStudent);
    saveLocal(STUDENTS_KEY, students);
    return newStudent;
  }
}

export async function updateStudent(id: number, data: StudentUpdate): Promise<Student> {
  const config = getApiConfig();
  if (config.isLive) {
    return makeRequest<Student>(`/students/${id}`, 'PUT', data);
  } else {
    const students = getLocal<Student>(STUDENTS_KEY);
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Student not found');
    students[idx] = {
      ...students[idx],
      ...(data.name !== undefined && { name: data.name! }),
      ...(data.email !== undefined && { email: data.email! }),
      ...(data.phone !== undefined && { phone: data.phone }),
    };
    saveLocal(STUDENTS_KEY, students);
    return students[idx];
  }
}

export async function deleteStudent(id: number): Promise<void> {
  const config = getApiConfig();
  if (config.isLive) {
    await makeRequest<void>(`/students/${id}`, 'DELETE');
  } else {
    let students = getLocal<Student>(STUDENTS_KEY);
    students = students.filter(s => s.id !== id);
    saveLocal(STUDENTS_KEY, students);
  }
}

/**
 * ==========================================
 * ENROLLMENTS ENDPOINTS
 * ==========================================
 */
export async function getEnrollments(): Promise<Enrollment[]> {
  const config = getApiConfig();
  return config.isLive ? makeRequest<Enrollment[]>('/enrollments/') : getLocal<Enrollment>(ENROLLMENTS_KEY);
}

export async function createEnrollment(data: EnrollmentCreate): Promise<Enrollment> {
  const config = getApiConfig();
  if (config.isLive) {
    return makeRequest<Enrollment>('/enrollments/', 'POST', data);
  } else {
    const enrollments = getLocal<Enrollment>(ENROLLMENTS_KEY);
    const dup = enrollments.find(e => e.student_id === Number(data.student_id) && e.course_id === Number(data.course_id));
    if (dup) return dup;

    const newEnrollment: Enrollment = {
      id: getNextId(ENROLLMENTS_KEY),
      student_id: Number(data.student_id),
      course_id: Number(data.course_id),
      status: data.status || 'active',
      enrollment_date: new Date().toISOString(),
    };
    enrollments.push(newEnrollment);
    saveLocal(ENROLLMENTS_KEY, enrollments);
    return newEnrollment;
  }
}

export async function updateEnrollment(id: number, data: EnrollmentUpdate): Promise<Enrollment> {
  const config = getApiConfig();
  if (config.isLive) {
    return makeRequest<Enrollment>(`/enrollments/${id}`, 'PUT', data);
  } else {
    const enrollments = getLocal<Enrollment>(ENROLLMENTS_KEY);
    const idx = enrollments.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Enrollment not found');
    enrollments[idx] = {
      ...enrollments[idx],
      status: data.status,
    };
    saveLocal(ENROLLMENTS_KEY, enrollments);
    return enrollments[idx];
  }
}

export async function deleteEnrollment(id: number): Promise<void> {
  const config = getApiConfig();
  if (config.isLive) {
    await makeRequest<void>(`/enrollments/${id}`, 'DELETE');
  } else {
    let enrollments = getLocal<Enrollment>(ENROLLMENTS_KEY);
    enrollments = enrollments.filter(e => e.id !== id);
    saveLocal(ENROLLMENTS_KEY, enrollments);
  }
}

/**
 * ==========================================
 * PAYMENTS ENDPOINTS
 * ==========================================
 */
export async function getPayments(): Promise<Payment[]> {
  const config = getApiConfig();
  return config.isLive ? makeRequest<Payment[]>('/payments/') : getLocal<Payment>(PAYMENTS_KEY);
}

export async function createPayment(data: PaymentCreate): Promise<Payment> {
  const config = getApiConfig();
  if (config.isLive) {
    return makeRequest<Payment>('/payments/', 'POST', data);
  } else {
    const payments = getLocal<Payment>(PAYMENTS_KEY);
    const newPayment: Payment = {
      id: getNextId(PAYMENTS_KEY),
      enrollment_id: Number(data.enrollment_id),
      amount: Number(data.amount),
      status: data.status || 'pending',
      payment_date: new Date().toISOString(),
    };
    payments.push(newPayment);
    saveLocal(PAYMENTS_KEY, payments);
    return newPayment;
  }
}

export async function updatePayment(id: number, data: PaymentUpdate): Promise<Payment> {
  const config = getApiConfig();
  if (config.isLive) {
    return makeRequest<Payment>(`/payments/${id}`, 'PUT', data);
  } else {
    const payments = getLocal<Payment>(PAYMENTS_KEY);
    const idx = payments.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Payment not found');
    payments[idx] = {
      ...payments[idx],
      status: data.status,
    };
    saveLocal(PAYMENTS_KEY, payments);
    return payments[idx];
  }
}

export async function deletePayment(id: number): Promise<void> {
  const config = getApiConfig();
  if (config.isLive) {
    await makeRequest<void>(`/payments/${id}`, 'DELETE');
  } else {
    let payments = getLocal<Payment>(PAYMENTS_KEY);
    payments = payments.filter(p => p.id !== id);
    saveLocal(PAYMENTS_KEY, payments);
  }
}

/**
 * Helper to check connection to the FastAPI URL
 */
export async function checkApiHealth(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const url = `${baseUrl.replace(/\/$/, '')}/`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}