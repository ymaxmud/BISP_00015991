const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const AI_BASE = process.env.NEXT_PUBLIC_AI_URL || "/api/ai";

export type ApiRecord = Record<string, unknown>;

export interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

export interface AuthUser {
  id: number;
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  preferred_language?: string;
  is_active?: boolean;
  date_joined?: string;
}

export interface AuthSession {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface OrganizationRecord {
  id: number;
  name: string;
  slug?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface SpecialtyRecord {
  id: number;
  name: string;
  slug?: string;
}

export interface DoctorSpecialtyRecord {
  id: number;
  specialty: number;
  specialty_detail?: SpecialtyRecord;
}

export interface DoctorRecord {
  id: number;
  organization?: number | null;
  organization_detail?: OrganizationRecord;
  full_name: string;
  gender?: string;
  position?: string;
  avatar?: string | null;
  years_experience?: number;
  education?: string;
  license_number?: string;
  working_history?: ApiRecord[];
  bio?: string;
  languages?: string[];
  services?: string[];
  consultation_fee?: string | number;
  consultation_duration_minutes?: number;
  working_hours?: ApiRecord;
  accepts_new_patients?: boolean;
  is_verified?: boolean;
  ai_enabled?: boolean;
  public_slug?: string;
  is_active?: boolean;
  is_public?: boolean;
  created_at?: string;
  specialties?: DoctorSpecialtyRecord[];
}

export interface AdminAddDoctorResponse {
  doctor: DoctorRecord;
  temporary_password: string;
}

export interface AppointmentRecord {
  id: number;
  organization: number;
  organization_name?: string;
  patient_profile: number;
  patient_name?: string;
  doctor_profile: number;
  doctor_name?: string;
  doctor_specialties?: string[];
  department?: number | null;
  department_name?: string;
  status: string;
  appointment_type?: string;
  appointment_time: string;
  reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UploadRecord {
  id: number;
  patient_profile: number;
  patient_name?: string;
  uploaded_by_user: number;
  appointment?: number | null;
  appointment_time?: string | null;
  file: string;
  file_name: string;
  mime_type?: string;
  extracted_text?: string;
  validation_status: string;
  uploaded_at: string;
}

export interface PatientMedicalHistoryRecord {
  chronic_conditions?: string;
  allergies?: string;
  current_medications?: string;
}

export interface PatientChronicConditionRecord {
  id: number;
  code: string;
  label?: string;
  notes?: string;
}

export interface PatientProfileRecord {
  id: number;
  user?: number;
  first_name: string;
  last_name: string;
  dob?: string | null;
  gender?: string;
  medical_history?: PatientMedicalHistoryRecord;
  chronic_conditions?: PatientChronicConditionRecord[];
}

export interface SubscriptionPlanRecord {
  id: number;
  code: string;
  name: string;
  description?: string;
  price_monthly: string | number;
  currency?: string;
  max_doctors: number;
  ai_enabled: boolean;
  features?: string[];
  is_active?: boolean;
}

export interface CaseAnalysisRecord {
  summary: string;
  extracted_facts: Record<string, string>;
  risk_level: string;
  safety_alerts: string[];
  suggestions: string[];
  triage_notes: string;
}

export interface MedicationAlertRecord {
  type?: string;
  description?: string;
  message?: string;
}

export interface MedicationSafetyRecord {
  alerts: MedicationAlertRecord[];
  safe: boolean;
  recommendations: string[];
}

export interface ReportAbnormalValueRecord {
  parameter?: string;
  value?: string | number;
  unit?: string;
  reference_range?: string;
  status?: string;
  hint?: string;
}

export interface ReportAnalysisRecord {
  summary: string;
  key_findings: string[];
  abnormal_values: ReportAbnormalValueRecord[];
  recommendations: string[];
}

export interface ReportUploadRecord {
  filename: string;
  extracted_text: string;
  analysis: ReportAnalysisRecord;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function unwrapList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: res.statusText })) as ApiRecord;
    const detail =
      typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error) || res.statusText;
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

async function requestList<T>(
  url: string,
  options: RequestInit = {}
): Promise<T[]> {
  const data = await request<T[] | PaginatedResponse<T>>(url, options);
  return unwrapList(data);
}

// Everything below is grouped by feature area so pages can import one small
// API helper instead of rebuilding fetch calls each time.
export const auth = {
  register: (data: {
    email: string;
    password: string;
    role: string;
    first_name?: string;
    last_name?: string;
  }) =>
    request<AuthSession>(`${API_BASE}/auth/register/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  registerPatient: (data: Record<string, unknown>) =>
    request<AuthSession>(`${API_BASE}/auth/register/patient/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  registerDoctor: (data: Record<string, unknown>) =>
    request<AuthSession>(`${API_BASE}/auth/register/doctor/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  registerClinic: (data: Record<string, unknown>) =>
    request<AuthSession>(`${API_BASE}/auth/register/clinic/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<AuthSession>(`${API_BASE}/auth/login/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  supabaseSync: (accessToken: string) =>
    request<AuthSession & { created: boolean }>(`${API_BASE}/auth/supabase/sync/`, {
      method: "POST",
      body: JSON.stringify({ access_token: accessToken }),
    }),
  me: () => request<AuthUser>(`${API_BASE}/auth/me/`),
  refresh: (refresh: string) =>
    request<{ access: string }>(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      body: JSON.stringify({ refresh }),
    }),
  listUsers: (params?: string) =>
    request<ApiRecord | PaginatedResponse<ApiRecord>>(
      `${API_BASE}/auth/users/${params ? `?${params}` : ""}`
    ),
};

// Subscription and billing-related requests.
export const billing = {
  listPlans: () => requestList<SubscriptionPlanRecord>(`${API_BASE}/billing/plans/`),
  mySubscription: () => request<ApiRecord>(`${API_BASE}/billing/me/`),
};

// Doctor directory plus admin-only doctor creation.
export const doctors = {
  list: (params?: string) =>
    requestList<DoctorRecord>(`${API_BASE}/doctors/${params ? `?${params}` : ""}`),
  get: (slug: string) => request<DoctorRecord>(`${API_BASE}/doctors/${slug}/`),
  me: () => request<DoctorRecord>(`${API_BASE}/doctors/me/`),
  updateMe: (data: Record<string, unknown>) =>
    request<DoctorRecord>(`${API_BASE}/doctors/me/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  uploadAvatar: async (file: File) => {
    const token = getToken();
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await fetch(`${API_BASE}/doctors/me/`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const json = (await res.json().catch(() => ({}))) as ApiRecord;
    if (!res.ok) {
      throw new Error(
        (typeof json.detail === "string" && json.detail) ||
          JSON.stringify(json) ||
          res.statusText
      );
    }
    return json as unknown as DoctorRecord;
  },
  adminAdd: async (data: FormData | Record<string, unknown>) => {
    const token = getToken();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    let body: FormData | string;
    if (data instanceof FormData) {
      body = data;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
    const res = await fetch(`${API_BASE}/doctors/admin/add/`, {
      method: "POST",
      headers,
      body,
    });
    const json = (await res.json().catch(() => ({}))) as ApiRecord;
    if (!res.ok) {
      throw new Error(
        (typeof json.detail === "string" && json.detail) ||
          JSON.stringify(json) ||
          res.statusText
      );
    }
    return json as unknown as AdminAddDoctorResponse;
  },
};

// Clinics, hospitals, and related organization data.
export const organizations = {
  list: (params?: string) =>
    requestList<OrganizationRecord>(
      `${API_BASE}/organizations/${params ? `?${params}` : ""}`
    ),
  get: (slug: string) => request<OrganizationRecord>(`${API_BASE}/organizations/${slug}/`),
  update: (slug: string, data: Record<string, unknown>) =>
    request<OrganizationRecord>(`${API_BASE}/organizations/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Specialties are split out because many screens need them for dropdowns.
export const specialties = {
  list: () => requestList<SpecialtyRecord>(`${API_BASE}/organizations/specialties/`),
};

// Patient profile access for doctor/admin screens.
export const patients = {
  list: (params?: string) =>
    requestList<PatientProfileRecord>(
      `${API_BASE}/patients/profiles/${params ? `?${params}` : ""}`
    ),
};

// Appointment booking and status updates.
export const appointments = {
  list: (params?: string) =>
    requestList<AppointmentRecord>(`${API_BASE}/appointments/${params ? `?${params}` : ""}`),
  create: (data: Record<string, unknown>) =>
    request<AppointmentRecord>(`${API_BASE}/appointments/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Record<string, unknown>) =>
    request<AppointmentRecord>(`${API_BASE}/appointments/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Intake form endpoints used before or around appointments.
export const intake = {
  submit: (appointmentId: number, data: Record<string, unknown>) =>
    request<ApiRecord>(`${API_BASE}/queue/intake-forms/`, {
      method: "POST",
      body: JSON.stringify({ appointment: appointmentId, ...data }),
    }),
  get: (appointmentId: number) =>
    requestList<ApiRecord>(
      `${API_BASE}/queue/intake-forms/?appointment=${appointmentId}`
    ),
};

// Queue board endpoints for clinic workflow.
export const queue = {
  list: () => requestList<ApiRecord>(`${API_BASE}/queue/tickets/`),
  update: (id: number, data: Record<string, unknown>) =>
    request<ApiRecord>(`${API_BASE}/queue/tickets/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Consultation encounter records.
export const encounters = {
  create: (data: Record<string, unknown>) =>
    request<ApiRecord>(`${API_BASE}/encounters/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (id: number) => request<ApiRecord>(`${API_BASE}/encounters/${id}/`),
};

// Prescription creation and listing.
export const prescriptions = {
  list: () => requestList<ApiRecord>(`${API_BASE}/prescriptions/`),
  create: (data: Record<string, unknown>) =>
    request<ApiRecord>(`${API_BASE}/prescriptions/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Reminder management.
export const reminders = {
  list: () => requestList<ApiRecord>(`${API_BASE}/reminders/`),
  create: (data: Record<string, unknown>) =>
    request<ApiRecord>(`${API_BASE}/reminders/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Patient review endpoints.
export const reviews = {
  list: (params?: string) =>
    request<ApiRecord | PaginatedResponse<ApiRecord>>(
      `${API_BASE}/reviews/${params ? `?${params}` : ""}`
    ),
  create: (data: Record<string, unknown>) =>
    request<ApiRecord>(`${API_BASE}/reviews/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// File uploads go through the backend because auth and storage rules live there.
export const uploads = {
  list: () => requestList<UploadRecord>(`${API_BASE}/uploads/`),
  get: (id: number) => request<UploadRecord>(`${API_BASE}/uploads/${id}/`),
  upload: async (file: File, appointmentId?: number) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    if (appointmentId) formData.append("appointment", String(appointmentId));
    const res = await fetch(`${API_BASE}/uploads/`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const json = (await res.json().catch(() => ({}))) as ApiRecord;
    if (!res.ok) {
      throw new Error(
        (typeof json.detail === "string" && json.detail) ||
          JSON.stringify(json) ||
          res.statusText
      );
    }
    return json as unknown as UploadRecord;
  },
  remove: async (id: number) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/uploads/${id}/`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as ApiRecord;
      throw new Error(
        (typeof json.detail === "string" && json.detail) ||
          JSON.stringify(json) ||
          res.statusText
      );
    }
  },
};

// Dashboard and reporting numbers.
export const analytics = {
  dashboard: () => request<ApiRecord>(`${API_BASE}/analytics/dashboard/`),
  trends: () => request<ApiRecord[]>(`${API_BASE}/analytics/trends/`),
  workload: () => request<ApiRecord[]>(`${API_BASE}/analytics/workload/`),
  queueStats: () => request<ApiRecord>(`${API_BASE}/analytics/queue/`),
};

// AI-specific routes are kept in one place so the pages do not need to know
// the exact endpoint names.
export const ai = {
  symptomRouting: (data: {
    symptoms: string;
    duration: string;
    severity: string;
    age: number;
    gender: string;
  }) =>
    request<ApiRecord>(`${AI_BASE}/symptom-routing`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  intakeSummary: (data: Record<string, unknown>) =>
    request<ApiRecord>(`${AI_BASE}/intake-summary`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  caseAnalysis: (data: Record<string, unknown>) =>
    request<CaseAnalysisRecord>(`${AI_BASE}/case-analysis`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  medicationSafety: (data: Record<string, unknown>) =>
    request<MedicationSafetyRecord>(`${AI_BASE}/medication-safety`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  reportAnalysis: (data: { report_text: string; patient_context?: string }) =>
    request<ReportAnalysisRecord>(`${AI_BASE}/report-analysis`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  reportUpload: async (file: File, patientContext?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (patientContext) formData.append("patient_context", patientContext);
    const res = await fetch(`${AI_BASE}/report-upload`, {
      method: "POST",
      body: formData,
    });
    const json = (await res.json().catch(() => ({}))) as ApiRecord;
    if (!res.ok) {
      throw new Error(
        (typeof json.detail === "string" && json.detail) ||
          JSON.stringify(json) ||
          res.statusText
      );
    }
    return json as unknown as ReportUploadRecord;
  },
  reportChat: (data: {
    report_text: string;
    question: string;
    chat_history?: ApiRecord[];
  }) =>
    request<ApiRecord>(`${AI_BASE}/report-chat`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
