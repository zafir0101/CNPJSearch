import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { api } from '../api/client'; 
import styles from './GrafoSocios.module.css';

export function GrafoSocios({ cnpjBasico }: { cnpjBasico: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    setLoading(true);
    setError(null);

    api.getGrafo(cnpjBasico, abortController.signal)
      .then((data) => {
        if (!data || !containerRef.current) return;
        
        const nodes = data.nodes.map(n => ({
          id: n.id,
          label: n.label,
          shape: n.type === 'empresa' ? 'box' : 'ellipse',
          color: n.type === 'empresa' ? '#3b82f6' : '#10b981',
          font: { color: 'white', face: 'IBM Plex Sans' }
        }));

        // 2. Transformamos as Edges da API para o formato do Vis.js
        const edges = data.edges.map(e => ({
          from: e.source,
          to: e.target,
          label: e.relation, // Escreve na linha se é Sócio-Administrador, etc.
          font: { align: 'middle', size: 10, face: 'IBM Plex Sans' },
          arrows: 'to'
        }));

        // 3. Configurações da Física do grafo
        const options = {
          physics: {
            barnesHut: { gravitationalConstant: -2000, centralGravity: 0.3, springLength: 150 }
          },
          edges: {
            color: '#94a3b8',
            smooth: { type: 'continuous' }
          }
        };

        // 4. Instancia e desenha o grafo na tela
        networkRef.current = new Network(containerRef.current, { nodes, edges }, options);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      abortController.abort();
      if (networkRef.current) {
        networkRef.current.destroy(); // Limpa o canvas ao sair da aba
      }
    };
  }, [cnpjBasico]);

  return (
    <div className={styles.container}>
      {loading && <div className={styles.status}>Carregando conexões...</div>}
      {error && <div className={styles.status} style={{ color: '#ef4444' }}>{error}</div>}
      
      <div 
        ref={containerRef} 
        className={styles.network} 
        style={{ visibility: loading || error ? 'hidden' : 'visible' }}
      />
    </div>
  );
}
