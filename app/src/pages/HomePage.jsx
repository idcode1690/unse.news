// src/pages/HomePage.jsx
import React from 'react';
import SajooForm from '../components/sajoo/SajooForm';

const HomePage = (/* props 무시해도 됨 */) => {
  const handleSuccess = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <section className="calculator">
      <SajooForm onSuccess={handleSuccess} />
    </section>
  );
};

export default HomePage;
