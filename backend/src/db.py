import threading
import io
import sqlite3
import re
import csv
import os

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))

_EMPRESAS_COLUMN = [
    'cnpj_basico',
    'razao_social',
    'natureza_juridica',
    'qualificacao_responsavel',
    'capital_social',
    'porte_empresa',
    'ente_federativo_responsavel'
]

_ESTABELECIMENTO_COLUMN = [
    'cnpj_basico',
    'cnpj_ordem',
    'cnpj_dv',
    'identificador_matriz_filial',
    'nome_fantasia',
    'situacao_cadastral',
    'data_situacao_cadastral',
    'motivo_situacao_cadastral',
    'nome_cidade_exterior',
    'pais',
    'data_inicio_atividade',
    'cnae_fiscal_principal',
    'cnae_fiscal_secundaria',
    'tipo_logradouro',
    'logradouro',
    'numero',
    'complemento',
    'bairro',
    'cep',
    'uf',
    'municipio',
    'ddd_1',
    'telefone_1',
    'ddd_2',
    'telefone_2',
    'ddd_fax',
    'fax',
    'correio_eletronico',
    'situacao_especial',
    'data_situacao_especial'
]

_SOCIOS_COLUMN = [
    'cnpj_basico',
    'identificador_socio',
    'nome_socio_razao_social',
    'cnpj_cpf_socio',
    'qualificacao_socio',
    'data_entrada_sociedade',
    'pais',
    'representante_legal',
    'nome_do_representante',
    'qualificacao_representante_legal',
    'faixa_etaria'
]

_CNAES_COLUMN = ['codigo', 'descricao']
_NATUREZAS_COLUMN = ['codigo', 'descricao']
_MUNICIPIOS_COLUMN = ['codigo', 'descricao']

_TABLES_CONFIG = {
    'cnaes': _CNAES_COLUMN,
    'empresas': _EMPRESAS_COLUMN,
    'estabelecimentos': _ESTABELECIMENTO_COLUMN,
    'socios': _SOCIOS_COLUMN,
    'naturezas': _NATUREZAS_COLUMN,
    'municipios': _MUNICIPIOS_COLUMN
}

def _format_insert(name: str):
    param_formatted = "(" + ", ".join(_TABLES_CONFIG[name]) + ")"    
    values = 'VALUES(' + ', '.join(['?' for _ in range(len(_TABLES_CONFIG[name]))]) + ')'
    insert = f"INSERT INTO {name}" + param_formatted + " " + values
    return insert

def _format_query(table: str, columns: list[str]):
    where = 'WHERE ' + ' = ? AND '.join([column for column in columns]) + ' = ?'
    return f'SELECT * FROM {table} ' + where

def _format_autocomplete_query(table: str, columns: list[str]):
    where = 'WHERE ' + ' AND '.join(f"{column} LIKE ?" for column in columns) + ' LIMIT 15'
    return f'SELECT * FROM {table} ' + where

def _format_table(name: str, columns: list[str]) -> str:
    cols_formatted = " TEXT,\n  ".join(columns) + " TEXT"
    table = f"CREATE TABLE IF NOT EXISTS {name} (\n  {cols_formatted}\n);"
    return table

class DataBase:
    def __init__(self, debug: bool=False):
        if debug: self.__con = sqlite3.connect(os.path.join(_BASE_DIR, 'data/debug.db'), check_same_thread=False)
        else: self.__con = sqlite3.connect(os.path.join(_BASE_DIR, 'data/cnpj.db'), check_same_thread=False)
        self.__batch_size = 10000

        self.__init_tables()
        self.__lock = threading.Lock()

    def __init_tables(self):
        for name, column in _TABLES_CONFIG.items():
            self.__con.execute(_format_table(name, column))
        
    def set_batch_size(self, batch_size):
        if batch_size <= 0: return
        self.__batch_size = batch_size
        
    def set_write_mode(self):
        self.__con.execute("PRAGMA journal_mode = WAL;")
        self.__con.execute("PRAGMA synchronous = OFF;")
        self.__con.execute("PRAGMA temp_store = MEMORY;")
        self.__con.execute("PRAGMA cache_size = -131072;") 

    def set_read_mode(self):
        self.__con.execute("CREATE INDEX IF NOT EXISTS idx_empresa_cnpj ON empresas(cnpj_basico)")
        self.__con.execute("CREATE INDEX IF NOT EXISTS idx_socio ON socios(cnpj_basico)")
        self.__con.execute("CREATE INDEX IF NOT EXISTS idx_socio_id ON socios(cnpj_cpf_socio, nome_socio_razao_social)")
        self.__con.execute("CREATE INDEX IF NOT EXISTS idx_estabelecimentos_preview ON estabelecimentos(cnpj_basico) ")
        self.__con.execute("CREATE INDEX IF NOT EXISTS idx_estabelecimentos_local ON estabelecimentos(uf, municipio) ")

        self.__con.execute("PRAGMA synchronous = NORMAL;")
        self.__con.execute("PRAGMA mmap_size = 2147483648;")
        self.__con.execute("PRAGMA optimize;")

        self.__con.commit()

    def write(self, file: tuple[str, bytes]):
        match = re.match(r'([a-zA-Z]+)\d?.zip', file[0])
        if match: table_to_insert = str.lower(match.group(1))
        else: raise Exception("Invalid file")

        io_text = io.TextIOWrapper(io.BytesIO(file[1]), 'ISO-8859-1')
        reader = csv.reader(io_text, delimiter=';')
        insert = _format_insert(table_to_insert)

        empty_file = False
        while True:
            if empty_file: break

            values = []
            for _ in range(0, self.__batch_size):
                row = next(reader, None)
                if row is None:
                    empty_file = True
                    break
                values.append(tuple(column for column in row))

            self.__con.executemany(insert, values)
            self.__con.commit()    

    def query_empresa_using_cnpj_basico(self, cnpj_basico: str):
        with self.__lock:
            row = self.__con.execute(_format_query('empresas', ['cnpj_basico']), (cnpj_basico,)).fetchone()
            return dict(zip(_EMPRESAS_COLUMN, row)) if row else None

    def query_empresas_using_razao_social(self, razao_social: str):
        with self.__lock:
            results = self.__con.execute(_format_autocomplete_query('empresas', ['razao_social']), (f"{razao_social.upper()}%",)).fetchall()
            return [dict(zip(_EMPRESAS_COLUMN, row)) for row in results] 

    def query_socios_preview_using_cnpj_basico(self, cnpj_basico: str):
        with self.__lock:
            results = self.__con.execute(_format_query('socios', ['cnpj_basico']), (cnpj_basico,)).fetchall()
            return [dict(zip(_SOCIOS_COLUMN, row)) for row in results]

    def query_socio_details_using_cnpj_or_cpf(self, cnpj_basico: str, cnpj_cpf_socio):
        with self.__lock:
            row = self.__con.execute(_format_query('socios', ['cnpj_basico', 'cnpj_cpf_socio']), (cnpj_basico, cnpj_cpf_socio)).fetchone()
            return dict(zip(_SOCIOS_COLUMN, row)) if row else None

    def query_estabelecimentos_preview_using_cnpj_basico_and_filter(self, cnpj_basico: str, filter: dict[str, str]):
        with self.__lock:
            if not filter:
                results = self.__con.execute(_format_query('estabelecimentos', ['cnpj_basico']), (cnpj_basico,)).fetchall()
                return [dict(zip(_ESTABELECIMENTO_COLUMN, row)) for row in results]

            conditions = list(filter.keys())
            conditions.append('cnpj_basico')
            values = list(filter.values())
            values.append(cnpj_basico)

            results = self.__con.execute(_format_query('estabelecimentos', conditions), tuple(values)).fetchall()
            return [dict(zip(_ESTABELECIMENTO_COLUMN, row)) for row in results]

    def query_estabelecimento_details_using_cnpj(self, cnpj_basico: str, cnpj_ordem: str):
        with self.__lock:
            row = self.__con.execute(_format_query('estabelecimentos', ['cnpj_basico', 'cnpj_ordem']), (cnpj_basico, cnpj_ordem)).fetchone()
            return dict(zip(_ESTABELECIMENTO_COLUMN, row)) if row else None

    def query_municipios_autocomplete_using_filter(self, descricao: str, uf: str):
        with self.__lock:
            if not uf:
                results = self.__con.execute(_format_autocomplete_query('municipios', ['descricao']), (f"{descricao.upper()}%",)).fetchall()
                return [dict(zip(_MUNICIPIOS_COLUMN, row)) for row in results]

            query ='''
            SELECT DISTINCT m.codigo, m.descricao FROM
            municipios m
            INNER JOIN estabelecimentos es ON es.municipio = m.codigo
            WHERE es.uf = ? AND m.descricao LIKE ?
            '''
            results = self.__con.execute(query, (uf.upper(), f"{descricao.upper()}%")).fetchall()
            return [dict(zip(_MUNICIPIOS_COLUMN, row)) for row in results]

    def query_cnaes_autocomplete_using_descricao(self, descricao):
        with self.__lock:
            results = self.__con.execute(_format_autocomplete_query('cnaes', ['descricao']), (f"{descricao.upper()}%",)).fetchall()
            return [dict(zip(_CNAES_COLUMN, row)) for row in results]  

    def query_cnaes_using_codigo(self, codigo):
        with self.__lock:
            row = self.__con.execute(_format_autocomplete_query('cnaes', ['codigo']), (codigo,)).fetchone()
            return dict(zip(_CNAES_COLUMN, row)) if row else None   

    def query_naturezas_using_codigo(self, codigo: str):
        with self.__lock:
            row = self.__con.execute(_format_query('naturezas', ['codigo']), (codigo,)).fetchone()
            return dict(zip(_NATUREZAS_COLUMN, row)) if row else None

    def query_stats(self):
            if hasattr(self, '_cached_stats') and self._cached_stats is not None:
                return self._cached_stats

            with self.__lock:
                if hasattr(self, '_cached_stats') and self._cached_stats is not None:
                    return self._cached_stats

                stats = {}
                stats['empresas_total'] = self.__con.execute("SELECT COUNT(*) FROM empresas").fetchone()[0]
                stats['estabelecimentos_total'] = self.__con.execute("SELECT COUNT(*) FROM estabelecimentos").fetchone()[0]
                stats['socios_total'] = self.__con.execute("SELECT COUNT(*) FROM socios").fetchone()[0]

                query_uf = """
                SELECT uf, COUNT(*) as qtd 
                FROM estabelecimentos 
                WHERE uf IS NOT NULL AND uf != '' 
                GROUP BY uf 
                ORDER BY qtd DESC
                """
                ufs = self.__con.execute(query_uf).fetchall()
                stats['estabelecimentos_por_uf'] = [{"uf": row[0], "quantidade": row[1]} for row in ufs]

                query_situacao = """
                SELECT situacao_cadastral, COUNT(*) as qtd 
                FROM estabelecimentos 
                WHERE situacao_cadastral IS NOT NULL AND situacao_cadastral != ''
                GROUP BY situacao_cadastral 
                ORDER BY qtd DESC
                """
                situacoes = self.__con.execute(query_situacao).fetchall()
                stats['estabelecimentos_por_situacao'] = [{"situacao_cadastral": row[0], "quantidade": row[1]} for row in situacoes]

                self._cached_stats = stats
            
                return stats

    def query_graph(self, cnpj_basico: str):
        nodes = {}
        edges = []

        main_empresa = self.query_empresa_using_cnpj_basico(cnpj_basico)
        if not main_empresa:
            return None

        nodes[cnpj_basico] = {
            "id": cnpj_basico,
            "label": main_empresa.get("razao_social") or cnpj_basico,
            "type": "empresa"
        }

        socios = self.query_socios_preview_using_cnpj_basico(cnpj_basico)
        for socio in socios:
            socio_id = socio.get("cnpj_cpf_socio") 
            socio_nome = socio.get("nome_socio_razao_social")

            if socio_id not in nodes:
                nodes[socio_id] = {"id": socio_id, "label": socio_nome, "type": "socio"}

            edges.append({
                "source": socio_id,
                "target": cnpj_basico,
                "relation": socio.get("qualificacao_socio") or "Sócio"
            })

            if socio_id:
                other_relationships = self.__con.execute(
                    "SELECT cnpj_basico, qualificacao_socio FROM socios WHERE cnpj_cpf_socio = ? " +
                     "AND nome_socio_razao_social = ? AND cnpj_basico != ?", [socio_id, socio_nome, cnpj_basico]
                ).fetchall()
                for cnpj, qualif in other_relationships:
                    emp = self.query_empresa_using_cnpj_basico(cnpj)
                    if emp:
                        if cnpj not in nodes:
                            nodes[cnpj] = {
                                "id": cnpj,
                                "label": emp.get("razao_social") or cnpj,
                                "type": "empresa"
                            }
                        edges.append({
                            "source": socio_id,
                            "target": cnpj,
                            "relation": qualif or "Sócio"
                        })

        return {"nodes": list(nodes.values()), "edges": edges}
