window.escapeHtml=(value)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.Api={
  async request(path,options={}){const response=await fetch(path,{...options,credentials:'same-origin',headers:{'content-type':'application/json',...(options.headers||{})}});const type=response.headers.get('content-type')||'';const value=type.includes('application/json')?await response.json():await response.text();if(!response.ok)throw new Error(value?.error||`Request failed (${response.status})`);return value},
  get:(path)=>window.Api.request(path),
  post:(path,data)=>window.Api.request(path,{method:'POST',body:JSON.stringify(data)}),
  put:(path,data)=>window.Api.request(path,{method:'PUT',body:JSON.stringify(data)}),
  patch:(path,data)=>window.Api.request(path,{method:'PATCH',body:JSON.stringify(data)}),
  requestOtp:(phone)=>window.Api.post('/api/auth/customer/request-otp',{phone}),
  verifyOtp:(phone,otp)=>window.Api.post('/api/auth/customer/verify-otp',{phone,otp}),
  login:(email,password)=>window.Api.post('/api/auth/staff',{email,password}),
  logout:()=>window.Api.post('/api/auth/logout',{}),
  search:(params)=>window.Api.get(`/api/providers?${new URLSearchParams(params)}`),
  createRequest:(data)=>window.Api.post('/api/requests',data),
  pay:(id,data)=>window.Api.post(`/api/requests/${encodeURIComponent(id)}/payments`,data),
  requests:()=>window.Api.get('/api/requests'),
  updateRequest:(id,status)=>window.Api.patch(`/api/requests/${encodeURIComponent(id)}/status`,{status}),
  cases:()=>window.Api.get('/api/agent/cases'),
  createCase:(data)=>window.Api.post('/api/agent/cases',data)
};
