from typing import overload
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
    'naturezas_juridicas': _NATUREZAS_COLUMN,
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

        self.__cur = self.__con.cursor()
        self.__batch_size = 1000

        self.__init_tables()
    
    def set_batch_size(self, batch_size):
        if batch_size <= 0: return
        self.__batch_size = batch_size
        
    def set_write_mode(self):
        self.__cur.execute("PRAGMA journal_mode = WAL;")
        self.__cur.execute("PRAGMA synchronous = OFF;")
        self.__cur.execute("PRAGMA temp_store = MEMORY;")
        self.__cur.execute("PRAGMA cache_size = -131072;") 

    def set_read_mode(self):
        self.__cur.execute("CREATE INDEX IF NOT EXISTS idx_empresa_cnpj ON empresas(cnpj_basico)")

        self.__cur.execute("PRAGMA synchronous = NORMAL;")
        self.__cur.execute("PRAGMA mmap_size = 2147483648;")
        self.__cur.execute("PRAGMA optimize;")

        self.__con.commit()

    def write(self, file: tuple[str, bytes]):
        match = re.match(r'([a-zA-Z]+)\d?.zip', file[0])
        if match: table_to_insert = str.lower(match.group(1))
        else: raise Exception("Invalid file")

        io_text = io.TextIOWrapper(io.BytesIO(file[1]), 'ISO-8859-1')
        reader = csv.reader(io_text, delimiter=';')
        insert = _format_insert(table_to_insert)


        print(f"escrevendo {file[0]}")
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

            self.__cur.executemany(insert, values)
            self.__con.commit()    

        print(f"escrito {file[0]}")

    def query_empresa_by_cnpj_basico(self, cnpj_basico: str):
        row = self.__cur.execute(_format_query('empresas', ['cnpj_basico']), [cnpj_basico]).fetchone()
        return dict(zip(_EMPRESAS_COLUMN, row)) if row else None

    def query_empresas_with_filter(self, filter: dict[str, str]):
        conditions = []
        values = []
        for key, val in filter.items():
            if key == 'razao_social':
                conditions.append("e.razao_social LIKE ?")
                values.append(f"{val.upper()}%")
            else:
                conditions.append(f"es.{key} = ?")
                values.append(val)

        where = " AND ".join(conditions) 
        query =f"""
        SELECT e.cnpj_basico, e.razao_social, es.cnpj_ordem, es.uf, es.municipio, es.situacao_cadastral FROM
        empresas e
        INNER JOIN estabelecimentos es USING (cnpj_basico)
        WHERE {where}
        LIMIT 50;
        """

        results = self.__cur.execute(query, values).fetchall()
        cols = ['cnpj_basico', 'razao_social', 'cnpj_ordem', 'uf', 'municipio', 'situacao_cadastral']
        return [dict(zip(cols, row)) for row in results]

    def query_socios_preview_by_cnpj_basico(self, cnpj_basico: str):
        results = self.__cur.execute(_format_query('socios', ['cnpj_basico']), [cnpj_basico]).fetchall()
        return [dict(zip(_SOCIOS_COLUMN, row)) for row in results]

    def query_socios_details_by_id(self, id: str):
        row = self.__cur.execute(_format_query('socios', ['identificador_socio']), [id]).fetchone()
        return dict(zip(_SOCIOS_COLUMN, row)) if row else None

    def query_estabelecimentos_preview_by_cnpj_basico(self, cnpj_basico: str):
        results = self.__cur.execute(_format_query('estabelecimentos', ['cnpj_basico']), [cnpj_basico]).fetchall()
        return [dict(zip(_ESTABELECIMENTO_COLUMN, row)) for row in results]

    def query_estabelecimentos_details_by_cnpj(self, cnpj_basico: str, cnpj_ordem: str):
        row = self.__cur.execute(_format_query('estabelecimentos', ['cnpj_basico', 'cnpj_ordem']), [cnpj_basico, cnpj_ordem]).fetchone()
        return dict(zip(_ESTABELECIMENTO_COLUMN, row)) if row else None

    def query_municipios_autocomplete_with_filter(self, descricao: str, uf: str):
        if uf is None:
            results = self.__cur.execute(_format_autocomplete_query('municipios', ['descricao']), [f"{descricao.upper()}%"]).fetchall()
            return [dict(zip(_MUNICIPIOS_COLUMN, row)) for row in results]

        query ='''
        SELECT DISTINCT m.codigo, m.descricao FROM
        municipios m
        INNER JOIN estabelecimentos es ON es.municipio = m.codigo
        WHERE es.uf = ? AND m.descricao LIKE ?
        '''

        results = self.__cur.execute(query, [uf.upper(), f"{descricao.upper()}%"]).fetchall()
        return [dict(zip(_MUNICIPIOS_COLUMN, row)) for row in results]

    def query_cnaes_autocomplete_by_descricao(self, descricao):
        results = self.__cur.execute(_format_autocomplete_query('cnaes', ['descricao']), [f"{descricao.upper()}%"]).fetchall()
        return [dict(zip(_CNAES_COLUMN, row)) for row in results]  

    def __init_tables(self):
        for name, column in _TABLES_CONFIG.items():
            self.__cur.execute(_format_table(name, column))
