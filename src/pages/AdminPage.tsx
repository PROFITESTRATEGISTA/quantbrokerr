import React from 'react';
import Layout from '../components/Layout';
import AdminPanel from '../components/AdminPanel';

const AdminPage: React.FC = () => {
  return (
    <Layout>
      <div className="pt-20">
        <AdminPanel />
      </div>
    </Layout>
  );
};

export default AdminPage;