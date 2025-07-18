import React from 'react';
import Layout from '../components/Layout';
import FAQ from '../components/FAQ';

const FAQPage: React.FC = () => {
  return (
    <Layout>
      <div className="text-center py-16 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Perguntas <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Frequentes</span>
        </h1>
        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
          Encontre respostas para as principais dúvidas sobre nossos Portfólios de IA
        </p>
      </div>
      <FAQ />
    </Layout>
  );
};

export default FAQPage;