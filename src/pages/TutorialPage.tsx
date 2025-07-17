import React from 'react';
import Layout from '../components/Layout';
import Tutorial from '../components/Tutorial';

const TutorialPage: React.FC = () => {
  return (
    <Layout>
      <div className="pt-20">
        <Tutorial />
      </div>
    </Layout>
  );
};

export default TutorialPage;