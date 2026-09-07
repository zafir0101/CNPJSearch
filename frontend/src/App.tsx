import { useState } from 'react';
import { Header } from './components/Header';
import { ProvisioningScreen } from './components/ProvisioningScreen';
import { SearchPanel } from './components/SearchPanel';
import { EmpresaDetailsPanel } from './components/EmpresaDetailsPanel';
import { EstatisticasGerais } from './components/EstatisticasGerais'; // IMPORT DO NOVO COMPONENTE
import { usePipelineStatus } from './hooks/usePipelineStatus';
import styles from './App.module.css';

export default function App() {
  const { status, connectionError } = usePipelineStatus();
  const [selectedCnpjBasico, setSelectedCnpjBasico] = useState<string | null>(null);
  
  // Estado para controlar qual tela está ativa
  const [activeView, setActiveView] = useState<'busca' | 'estatisticas'>('busca');

  const ready = status?.status === 'pronto';

  return (
    <div className={styles.app}>
      <Header />
      {ready ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* BARRA DE NAVEGAÇÃO (TABS) */}
          <nav style={{ display: 'flex', gap: '1rem', padding: '1rem 2rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <button 
              onClick={() => setActiveView('busca')}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                background: activeView === 'busca' ? '#3b82f6' : 'transparent',
                color: activeView === 'busca' ? 'white' : '#4b5563',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Busca e Detalhes
            </button>
            <button 
              onClick={() => setActiveView('estatisticas')}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                background: activeView === 'estatisticas' ? '#3b82f6' : 'transparent',
                color: activeView === 'estatisticas' ? 'white' : '#4b5563',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Estatísticas Gerais
            </button>
          </nav>

          {activeView === 'busca' ? (
            <main className={styles.main}>
              <section className={styles.searchColumn}>
                <SearchPanel selectedCnpjBasico={selectedCnpjBasico} onSelectEmpresa={setSelectedCnpjBasico} />
              </section>
              <section className={styles.detailsColumn}>
                {selectedCnpjBasico ? (
                  <EmpresaDetailsPanel cnpjBasico={selectedCnpjBasico} />
                ) : (
                  <div className={styles.emptyState}>
                    <p>Busque uma empresa para ver os dados cadastrais, estabelecimentos e sócios.</p>
                  </div>
                )}
              </section>
            </main>
          ) : (
            <main style={{ padding: '2rem', overflowY: 'auto' }}>
              <EstatisticasGerais />
            </main>
          )}

        </div>
      ) : (
        <ProvisioningScreen status={status} connectionError={connectionError} />
      )}
    </div>
  );
}
