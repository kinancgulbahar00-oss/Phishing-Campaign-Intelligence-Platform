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

export async function fetchLists(listType) {
  const url = listType ? `${API_BASE_URL}/lists?list_type=${listType}` : `${API_BASE_URL}/lists`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Liste getirilemedi (HTTP ${response.status}).`);
  }
  return response.json();
}

export async function addListItem(itemData) {
  const response = await fetch(`${API_BASE_URL}/lists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Kural eklenemedi (HTTP ${response.status}).`);
  }

  return response.json();
}

export async function deleteListItem(itemId) {
  const response = await fetch(`${API_BASE_URL}/lists/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Kural silinemedi (HTTP ${response.status}).`);
  }

  return true;
}
