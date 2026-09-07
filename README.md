# CNPJSearch

Interface web para consulta dos dados públicos do CNPJ (Receita Federal)

## SQLite

Esse foi o banco escolhido para aplicação por algumas razões. Muitas de suas limitações não são experenciadas pela aplicação,como:
- Sem suporte para multiusuário — A aplicação roda localmente, com usuário único.
- Tempo de escrita consideravelmente baixo — O tempo de *download* dos arquivos zipados normalmente é bem maior que o de escrita e extração, ou seja,
  quem limita a aplicação não é a escrita do banco de dados. Além disso, a escrita ocorre apenas uma vez, e a sincronização com o repositório ofical
  necessita apenas uma escrita por mês.
- *Multithreading* — Esse banco não suporta múltiplos escritores (e apenas um escritor e múltiplos leitores simultaneamente no modo WAL), entretanto,
como a escrita ocorre apenas uma vez e limitada pelo *download*, essa limitação também não foi observada. 

Vantagens:
- É *Serverless*, portanto não necessita de uma configuração exaustiva.
- Por ser de arquivo único possui portabilidade, facilitando o desenvolvimento.
- Possui baixa latência para leituras
- Não consome muitos recursos, sendo considerado um bando de dados leve.

### Índices

São construídos após a ingestão do banco de dados, evitando a atualização e normalização da *B-Tree* a cada inserção.

- `idx_empresa_cnpj` — tabela `empresa` coluna `cnpj_basico`; acelera a leitura de empresas utilizando cnpj_basico.
- `idx_socio` — tabela `socios` coluna `cnpj_basico`; acelera a busca de sócios relacionados ao cnpj_basico.
- `idx_socio_id` — tabela `socios` colunas `cnpj_cpf_socio`, `nome_socio_razao_social`; índice composto que acelera a geração do grafo,
uma vez que o banco seleciona vários sócios com os mesmo digitos do cpf, a sub-ordenação tornou-se essencial para diminuir o tempo de
resposta.
- `idx_estabelecimentos_preview` — tabela `estabelecimentos` coluna `cnpj_basico`; acelera a listagem dos dados básicos dos estabelecimentos utilizando o cnpj_basico.
- `idx_estabelecimentos_local` — tabela `estabelecimentos` colunas `uf`, `municipio`; essencial para o autocomplete em tempo de digitação dos municípios filtrados
pela uf, isso porque ocorre um join das tabelas de `estabelelcimentos` e `municipios`, tornando essa query lenta (principalmente em tempo de digitação).

## WebDav

- Extensão do protocolo http para gerenciamento de arquivos.
- Essencial para o arquivo `pipeline.py`, onde foram listados os diretórios contendo a base de dados e, posteriormente, baixados (também via WebDav).

## Flask

- Microframework web python de propósito geral.
- Se ajustou muito bem a proposta, tendo em vista a simplicidade da api necessária e a praticidade do ferramental fornecido.

## Rodando o backend

Dentro do diretório CNPJSearch:

```bash
cd backend
pip install flask requests
cd src
python app.py
```

A API sobe em `http://localhost:5000`. 

## Rodando o frontend

Dentro do diretório CNPJSearch:

```bash
cd frontend
npm install
cp .env.example .env   
npm run dev
```

Abra `http://localhost:5173`.

> [!NOTE]
> O banco de dados (SQLite) é armazenado localmente, ou seja, consome o espaço de disco. Nos testes
> realizado o espaço total consumido foi 27 GB, e o tempo necessário para realizar o download, extração
> e escrita dos dados foi de aproximadamente 30 minutos (depende da velocidade de internet, já que a pipeline
> extrai e escreve enquanto o download ocorre).

