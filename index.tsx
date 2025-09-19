
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Find the root element in the HTML to mount the React application.
const rootElement = document.getElementById('root');
if (!rootElement) {
  // This is a critical failure. If the root element is missing, React cannot render.
  // We throw an error to halt execution and alert the developer immediately.
  throw new Error("Fatal Error: Could not find the root element to mount the React application. Ensure an element with id='root' exists in your index.html.");
}

// Create a React root and render the main App component into it.
// React.StrictMode is used to highlight potential problems in an application.
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
