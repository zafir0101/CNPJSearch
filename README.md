# CNPJSearch

Interface web para consulta dos dados públicos do CNPJ (Receita Federal)

## Rodando o backend

```bash
cd backend
pip install flask requests
python app.py
```

A API sobe em `http://localhost:5000`. 

Enquanto a ingestão não termina, os demais endpoints (`/api/v1/empresas`, etc.) podem retornar
resultados vazios simplesmente porque a base ainda está sendo populada — isso é esperado.

## Rodando o frontend

```bash
cd frontend
npm install
cp .env.example .env   
npm run dev
```

Abra `http://localhost:5173`. Enquanto o backend estiver provisionando a base, a tela de
abastecimento é exibida automaticamente; assim que `status` vira `pronto`, a interface de busca
aparece.

> [!NOTE]
> O banco de dados (SQLite) é armazenado localmente, ou seja, consome o espaço de disco. Nos testes
> realizado o espaço total consumido foi 27 GB, e o tempo necessário para realizar o download, extração
> e escrita dos dados foi de aproximadamente 30 minutos (depende da velocidade de internet, já que a pipeline
> extrai e escreve enquanto o download ocorre).
