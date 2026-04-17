const BASE = process.env.NEXT_PUBLIC_API_URL;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getRide: (id)                  => request(`/ride/${id}`),
  getCustomerData: (customerId)  => request(`/booking/customer/${customerId}`),
  createBooking: (body)          => request('/booking/create', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
};
