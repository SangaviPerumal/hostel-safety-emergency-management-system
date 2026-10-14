/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    window.location.replace('/frontend/index.html');
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'sans-serif', background: '#f0f2f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#1e40af' }}>🚨 Loading Hostel Emergency & Safety System...</h1>
      <p style={{ marginTop: '16px' }}>
        <a href="/frontend/index.html" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'underline' }}>
          Click here to enter the system
        </a>
      </p>
    </div>
  );
}
