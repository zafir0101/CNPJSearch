import { useEffect, useState } from 'react';
import { api } from '../api/client'; 
import type { StatsData } from '../types'; 

export function EstatisticasGerais() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      const controller = new AbortController();
      let isMounted = true; // Impede que o estado atualize se o componente desmontar
    
      async function fetchStats() {
        try {
          setLoading(true);
          setError(null);
        
          const data = await api.getStats(controller.signal);
        
          if (isMounted) {
            if (data) {
              setStats(data);
            } else {
              setError('Nenhuma estatística retornada pelo servidor.');
            }
            setLoading(false);
          }
        } catch (err: any) {
          if (isMounted && err.name !== 'AbortError') {
            setError(err.message || 'Falha ao carregar as estatísticas.');
            setLoading(false);
          }
        }
      }

      fetchStats();
    
      return () => {
        isMounted = false;
        controller.abort();
      };
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Carregando estatísticas...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'red' }}>Erro: {error}</div>;
  }

  if (!stats) {
    return <div style={{ padding: '2rem' }}>Nenhum dado disponível.</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Visão Geral do Banco de Dados
      </h2>

      {/* Cards de Totais */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, padding: '1.5rem', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1rem', color: '#4b5563', margin: 0 }}>Total de Empresas</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
            {stats.empresas_total.toLocaleString('pt-BR')}
          </p>
        </div>
        <div style={{ flex: 1, padding: '1.5rem', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1rem', color: '#4b5563', margin: 0 }}>Estabelecimentos</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
            {stats.estabelecimentos_total.toLocaleString('pt-BR')}
          </p>
        </div>
        <div style={{ flex: 1, padding: '1.5rem', background: '#f3f4f6', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '1rem', color: '#4b5563', margin: 0 }}>Sócios</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
            {stats.socios_total.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Tabela de UFs */}
        <div style={{ flex: 1 }}>
          <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>Top 10 UFs</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {stats.estabelecimentos_por_uf.slice(0, 10).map((item) => (
              <li key={item.uf} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <strong style={{ color: '#1f2937' }}>{item.uf}</strong>
                <span style={{ color: '#6b7280' }}>{item.quantidade.toLocaleString('pt-BR')}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tabela de Situação Cadastral */}
        <div style={{ flex: 1 }}>
          <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>Por Situação Cadastral</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {stats.estabelecimentos_por_situacao.map((item) => (
              <li key={item.situacao_cadastral} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <strong style={{ color: '#1f2937' }}>{item.situacao_cadastral}</strong>
                <span style={{ color: '#6b7280' }}>{item.quantidade.toLocaleString('pt-BR')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
