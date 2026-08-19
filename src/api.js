async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

export const api = {
  signup: (body) => request("/api/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),
  forgot: (email) => request("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  reset: (body) => request("/api/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
  updateProfile: (body) => request("/api/users/me", { method: "PATCH", body: JSON.stringify(body) }),
  dashboard: () => request("/api/dashboard"),
  users: (q = "") => request(`/api/users?q=${encodeURIComponent(q)}`),
  listings: (q = "", type = "") => request(`/api/listings?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`),
  createListing: (body) => request("/api/listings", { method: "POST", body: JSON.stringify(body) }),
  deleteListing: (id) => request(`/api/listings/${id}`, { method: "DELETE" }),
  collaborations: (q = "", type = "") => request(`/api/collaborations?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`),
  createCollaboration: (body) => request("/api/collaborations", { method: "POST", body: JSON.stringify(body) }),
  deleteCollaboration: (id) => request(`/api/collaborations/${id}`, { method: "DELETE" }),
  jobs: (q = "") => request(`/api/jobs?q=${encodeURIComponent(q)}`),
  createJob: (body) => request("/api/jobs", { method: "POST", body: JSON.stringify(body) }),
  deleteJob: (id) => request(`/api/jobs/${id}`, { method: "DELETE" }),
  messages: (userId) => request(`/api/messages/${userId}`),
  sendMessage: (userId, content) => request(`/api/messages/${userId}`, { method: "POST", body: JSON.stringify({ content }) })
};
