import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './PublicLayout.css'; // Import styles for layout

const PublicLayout = () => {
  return (
    <div className="layout-container">
      <Header />
      <main className="content"> {/* Added content class here */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
