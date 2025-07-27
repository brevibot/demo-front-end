'use client';

import { useState, useEffect, FormEvent } from 'react';
import apiClient from '../lib/api'; // Import our configured API client

// Define a type for the successful API response
interface SuccessResponse {
  status: string;
  received: string;
}

export default function Home() {
  const [inputValue, setInputValue] = useState<string>('My secret message');
  const [statusMessage, setStatusMessage] = useState<string>('Awaiting initial request...');
  const [response, setResponse] = useState<SuccessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Make an initial GET request when the component mounts.
  // This establishes a session with the backend and receives the XSRF-TOKEN cookie.
  useEffect(() => {
    const getHello = async () => {
      try {
        const res = await apiClient.get<{ message: string }>('/hello');
        setStatusMessage(res.data.message);
      } catch (err) {
        console.error("Failed to connect to backend:", err);
        setStatusMessage("❌ Could not connect to the backend. Is it running?");
        setError("Please ensure the Spring Boot application is running on port 8080.");
      }
    };
    getHello();
  }, []); // Empty dependency array means this runs once on mount.

  // Step 2: Handle the form submission to send a POST request.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResponse(null);
    setStatusMessage('Sending POST request...');

    try {
      // The axios interceptor in `lib/api.ts` will automatically add the CSRF header.
      const result = await apiClient.post<SuccessResponse>('/secure-data', { content: inputValue });
      setResponse(result.data);
      setStatusMessage('✅ POST request was successful!');
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('CSRF Token validation failed! This is the expected error if the token is missing or incorrect.');
        setStatusMessage('❌ POST request was forbidden (403).');
      } else if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
        setStatusMessage('❌ An error occurred during the POST request.');
      } else {
        setError('An unknown error occurred.');
        setStatusMessage('❌ An unknown error occurred during the POST request.');
      }
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Next.js + Spring Boot CSRF Demo (TypeScript)</h1>

      <div style={{ padding: '1rem', backgroundColor: '#000000ff', borderRadius: '4px', marginBottom: '1rem' }}>
        <strong>Status:</strong> {statusMessage}
      </div>

      <form onSubmit={handleSubmit}>
        <p>Enter data to send via POST request:</p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          required
          style={{ width: 'calc(100% - 110px)', padding: '8px', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '8px 12px' }}>
          Send Data
        </button>
      </form>

      {response && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#000000ff', border: '1px solid #4caf50', borderRadius: '4px' }}>
          <h3>Success Response</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#000000ff', border: '1px solid #f44336', borderRadius: '4px' }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#555' }}>
        <h3>How it Works:</h3>
        <ol>
          <li>Page loads, a GET request to <code>/api/hello</code> is sent.</li>
          <li>Spring Boot backend receives the request, creates a session, generates a CSRF token, and sends it back in a cookie named <strong>XSRF-TOKEN</strong>.</li>
          <li>You click "Send Data", which triggers a POST request.</li>
          <li>Our <code>axios</code> client reads the <strong>XSRF-TOKEN</strong> from the cookie and puts its value in an HTTP header named <strong>X-XSRF-TOKEN</strong>.</li>
          <li>Spring Boot compares the token from the header with the one it has stored in your session. If they match, the request is allowed.</li>
        </ol>
      </div>
    </div>
  );
}