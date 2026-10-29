const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export async function analyzeUrl(urlToAnalyze) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/analyze/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: urlToAnalyze }),
    });
  } catch {
    throw new Error('Analiz servisine ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.');
  }

  if (!response.ok) {
    throw new Error(`Analiz tamamlanamadı (HTTP ${response.status}). Lütfen tekrar deneyin.`);
  }

  return response.json();
}

export async function fetchBrands() {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/brands`);
  } catch {
    throw new Error('Katalog servisine ulaşılamadı.');
  }
  if (!response.ok) {
    throw new Error(`Katalog getirilemedi (HTTP ${response.status}).`);
  }
  return response.json();
}

export function getAdminToken() {
  return localStorage.getItem('cti_admin_token') || sessionStorage.getItem('cti_admin_token') || '';
}

export function setAdminToken(token, remember = true) {
  if (remember) {
    localStorage.setItem('cti_admin_token', token);
  } else {
    sessionStorage.setItem('cti_admin_token', token);
  }
}

export function clearAdminToken() {
  localStorage.removeItem('cti_admin_token');
  sessionStorage.removeItem('cti_admin_token');
}

export async function adminLogin(password, remember = true) {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Giriş başarısız. Parolanızı kontrol edin.');
  }

  const data = await response.json();
  if (data.token) {
    setAdminToken(data.token, remember);
  }
  return data;
}

export async function adminVerify() {
  const token = getAdminToken();
  if (!token) return { valid: false };

  try {
    const response = await fetch(`${API_BASE_URL}/admin/verify`, {
      headers: { 'X-Admin-Token': token },
    });
    if (!response.ok) {
      clearAdminToken();
      return { valid: false };
    }
    return await response.json();
  } catch {
    return { valid: false };
  }
}

export async function fetchAdminStats() {
  const token = getAdminToken();
  const headers = token ? { 'X-Admin-Token': token } : {};
  const response = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
  if (!response.ok) {
    throw new Error('İstatistikler alınamadı.');
  }
  return response.json();
}

export async function fetchLists(listType) {
  const url = listType ? `${API_BASE_URL}/lists?list_type=${listType}` : `${API_BASE_URL}/lists`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Liste getirilemedi (HTTP ${response.status}).`);
  }
  return response.json();
}

export async function addListItem(itemData) {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['X-Admin-Token'] = token;
  }

  const response = await fetch(`${API_BASE_URL}/lists`, {
    method: 'POST',
    headers,
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Kural eklenemedi (HTTP ${response.status}).`);
  }

  return response.json();
}

export async function deleteListItem(itemId) {
  const token = getAdminToken();
  const headers = {};
  if (token) {
    headers['X-Admin-Token'] = token;
  }

  const response = await fetch(`${API_BASE_URL}/lists/${itemId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Kural silinemedi (HTTP ${response.status}).`);
  }

  return true;
}
