import React, { useState } from 'react';
import Layout from '../components/Layout';
import AdminDashboard from '../components/admin/AdminDashboard';

const AdminPage: React.FC = () => {

  return (
    <Layout>
      <AdminDashboard />
    </Layout>
  );
};

export default AdminPage;