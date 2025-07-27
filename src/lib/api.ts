import axios, { AxiosRequestConfig } from 'axios';

// Helper function to read a cookie value by its name.
function getCookie(name: string): string | null {
  if (typeof window === 'undefined') {
    return null; // Return null if on the server-side
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// Create an axios instance with default configuration
const apiClient = axios.create({
  // The base URL for your Spring Boot backend
  baseURL: 'http://localhost:8080/api',
  // Crucial: This allows axios to send cookies (like the JSESSIONID) with requests
  withCredentials: true,
});

// Add a request interceptor to automatically attach the CSRF token.
apiClient.interceptors.request.use((config: AxiosRequestConfig) => {
  // We only need to add the CSRF token for state-changing methods.
  const methodsToProtect = ['post', 'put', 'delete'];
  if (config.method && methodsToProtect.includes(config.method.toLowerCase())) {
    const token = getCookie('XSRF-TOKEN');
    if (token && config.headers) {
      // Spring Security expects the token in a header named 'X-XSRF-TOKEN'
      config.headers['X-XSRF-TOKEN'] = token;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;