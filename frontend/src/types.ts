/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export type CategoryCreate = Omit<Category, 'id'>;
export type CategoryUpdate = Partial<CategoryCreate>;

export interface Course {
  id: number;
  title: string;
  description: string | null;
  price: number;
  category_id: number;
}

export type CourseCreate = Omit<Course, 'id'>;
export type CourseUpdate = Partial<CourseCreate>;

export interface Student {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

export type StudentCreate = Omit<Student, 'id'>;
export type StudentUpdate = Partial<StudentCreate>;

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  status: string; // "active", "completed", "cancelled"
  enrollment_date?: string; // ISO String
}

export type EnrollmentCreate = Omit<Enrollment, 'id' | 'enrollment_date'> & {
  status?: string;
};
export type EnrollmentUpdate = {
  status: string;
};

export interface Payment {
  id: number;
  enrollment_id: number;
  amount: number;
  status: string; // "pending", "completed", "failed", "refunded"
  payment_date?: string; // ISO String
}

export type PaymentCreate = Omit<Payment, 'id' | 'payment_date'> & {
  status?: string;
};
export type PaymentUpdate = {
  status: string;
};

// API Connection Settings
export interface ApiConfig {
  baseUrl: string;
  isLive: boolean; // false means mock/local storage, true means real FastAPI URL
}