const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('printporter_token') : null;
  const currentPersona = typeof window !== 'undefined' ? localStorage.getItem('printporter_persona') || 'customer' : 'customer';

  // Map persona to test user id for seamless auth
  let devUserId = 'usr_customer_101';
  if (currentPersona === 'partner') devUserId = 'usr_owner_201';
  if (currentPersona === 'admin') devUserId = 'usr_admin_301';
  if (currentPersona === 'delivery') devUserId = 'usr_delivery_401';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': devUserId,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData where Content-Type is auto-set
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}: Failed request`);
  }
  return data;
}
