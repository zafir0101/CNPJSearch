import io
import sqlite3
import re
import csv

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

def _format_table(name: str, columns: list[str]) -> str:
    cols_formatted = " TEXT,\n  ".join(columns) + " TEXT"
    table = f"CREATE TABLE IF NOT EXISTS {name} (\n  {cols_formatted}\n);"
    return table

def _init_tables(cur: sqlite3.Cursor):
    for name, column in _TABLES_CONFIG.items():
        cur.execute(_format_table(name, column))
    
class DataBase:
    def __init__(self, debug: bool=False):
        if debug: self.__con = sqlite3.connect("data/debug.db", check_same_thread=False)
        else: self.__con = sqlite3.connect("data/cnpj.db", check_same_thread=False)

        self.__cur = self.__con.cursor()
        self.__batch_size = 100
        _init_tables(self.__cur)

    def set_batch_size(self, batch_size):
        if batch_size <= 0: return
        self.__batch_size = batch_size
        
    def set_write_mode(self):
        self.__cur.execute("PRAGMA journal_mode = WAL;")
        self.__cur.execute("PRAGMA synchronous = OFF;")
        self.__cur.execute("PRAGMA temp_store = MEMORY;")
        self.__cur.execute("PRAGMA cache_size = -131072;") 

    def set_read_mode(self):
        # Fazer os indices        
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
