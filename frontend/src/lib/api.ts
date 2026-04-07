const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const AI_BASE = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8001/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
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
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || JSON.stringify(error) || res.statusText);
  }
  return res.json();
}

// Auth
export const auth = {
  register: (data: {
    email: string;
    password: string;
    role: string;
    first_name?: string;
    last_name?: string;
  }) =>
    request<{ access: string; refresh: string; user: any }>(
      `${API_BASE}/auth/register/`,
      { method: "POST", body: JSON.stringify(data) }
    ),
  login: (data: { email: string; password: string }) =>
    request<{ access: string; refresh: string; user: any }>(
      `${API_BASE}/auth/login/`,
      { method: "POST", body: JSON.stringify(data) }
    ),
  me: () =>
    request<{
      id: number;
      email: string;
      role: string;
      first_name: string;
      last_name: string;
    }>(`${API_BASE}/auth/me/`),
  refresh: (refresh: string) =>
    request<{ access: string }>(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      body: JSON.stringify({ refresh }),
    }),
};

// Doctors
export const doctors = {
  list: (params?: string) =>
    request<any[]>(`${API_BASE}/doctors/${params ? `?${params}` : ""}`),
  get: (slug: string) => request<any>(`${API_BASE}/doctors/${slug}/`),
};

// Organizations
export const organizations = {
  list: (params?: string) =>
    request<any[]>(
      `${API_BASE}/organizations/${params ? `?${params}` : ""}`
    ),
  get: (slug: string) =>
    request<any>(`${API_BASE}/organizations/${slug}/`),
};

// Specialties
export const specialties = {
  list: () =>
    request<any[]>(`${API_BASE}/organizations/specialties/`),
};

// Appointments
export const appointments = {
  list: () => request<any[]>(`${API_BASE}/appointments/`),
  create: (data: any) =>
    request<any>(`${API_BASE}/appointments/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: any) =>
    request<any>(`${API_BASE}/appointments/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Intake
export const intake = {
  submit: (appointmentId: number, data: any) =>
    request<any>(`${API_BASE}/queue/intake-forms/`, {
      method: "POST",
      body: JSON.stringify({ appointment: appointmentId, ...data }),
    }),
  get: (appointmentId: number) =>
    request<any>(
      `${API_BASE}/queue/intake-forms/?appointment=${appointmentId}`
    ),
};

// Queue
export const queue = {
  list: () => request<any[]>(`${API_BASE}/queue/tickets/`),
  update: (id: number, data: any) =>
    request<any>(`${API_BASE}/queue/tickets/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Encounters
export const encounters = {
  create: (data: any) =>
    request<any>(`${API_BASE}/encounters/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (id: number) => request<any>(`${API_BASE}/encounters/${id}/`),
};

// Prescriptions
export const prescriptions = {
  list: () => request<any[]>(`${API_BASE}/prescriptions/`),
  create: (data: any) =>
    request<any>(`${API_BASE}/prescriptions/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Reminders
export const reminders = {
  list: () => request<any[]>(`${API_BASE}/reminders/`),
  create: (data: any) =>
    request<any>(`${API_BASE}/reminders/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Reviews
export const reviews = {
  list: (params?: string) =>
    request<any[]>(`${API_BASE}/reviews/${params ? `?${params}` : ""}`),
  create: (data: any) =>
    request<any>(`${API_BASE}/reviews/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Uploads
export const uploads = {
  list: () => request<any[]>(`${API_BASE}/uploads/`),
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
    return res.json();
  },
};

// Analytics
export const analytics = {
  dashboard: () => request<any>(`${API_BASE}/analytics/dashboard/`),
  trends: () => request<any>(`${API_BASE}/analytics/trends/`),
  workload: () => request<any>(`${API_BASE}/analytics/workload/`),
  queueStats: () => request<any>(`${API_BASE}/analytics/queue/`),
};

// AI Service
export const ai = {
  symptomRouting: (data: {
    symptoms: string;
    duration: string;
    severity: string;
    age: number;
    gender: string;
  }) =>
    request<any>(`${AI_BASE}/symptom-routing`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  intakeSummary: (data: any) =>
    request<any>(`${AI_BASE}/intake-summary`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  caseAnalysis: (data: any) =>
    request<any>(`${AI_BASE}/case-analysis`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  medicationSafety: (data: any) =>
    request<any>(`${AI_BASE}/medication-safety`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  reportAnalysis: (data: { report_text: string; patient_context?: string }) =>
    request<any>(`${AI_BASE}/report-analysis`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  reportChat: (data: {
    report_text: string;
    question: string;
    chat_history?: any[];
  }) =>
    request<any>(`${AI_BASE}/report-chat`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
