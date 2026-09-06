from flask import Blueprint, current_app, jsonify, request 

endpoint_bp = Blueprint('app', __name__)

@endpoint_bp.route("/api/v1/empresas/<cnpj_basico>", methods=['GET'])
def get_empresa_by_cnpj(cnpj_basico: str):
    db = current_app.config['DB']
    empresa = db.query_empresa_by_cnpj_basico(cnpj_basico)

    if not empresa: return jsonify({"status": "erro", "dados": "Nenhuma empresa encontrada"}), 404 
    return jsonify({"status": "sucesso", "dados": empresa}), 200

@endpoint_bp.route("/api/v1/empresas", methods=['GET'])
def get_empresas_by_filter():
    db = current_app.config['DB']

    filter = {}

    if request.args.get('razao_social'): filter['razao_social'] = request.args.get('razao_social')
    if request.args.get('uf') is not None: filter['uf'] = request.args.get('uf')
    if request.args.get('municipio') is not None: filter['municipio'] = request.args.get('municipio')
    if request.args.get('situacao_cadastral') is not None: filter['situacao_cadastral'] = request.args.get('situacao_cadastral')
    if request.args.get('cnaes') is not None: filter['cnae_fiscal_principal'] = request.args.get('cnaes')

    if not filter:
        return jsonify({"status": "erro", "dados": "Nenhum parâmetro de busca fornecido"}), 400

    empresas = db.query_empresas_with_filter(filter)

    if not empresas:
        return jsonify({"status": "erro", "dados": "Nenhuma empresa encontrada"}), 404
    return jsonify({"status": "sucesso", "dados": empresas}), 200

@endpoint_bp.route("/api/v1/estabelecimentos/<cnpj_basico>", methods=['GET'])
def get_estabelecimentos_preview(cnpj_basico: str):
    db = current_app.config['DB']
    estabelecimentos = db.query_estabelecimentos_preview_by_cnpj_basico(cnpj_basico)

    if not estabelecimentos: return jsonify({"status": "erro", "dados": "Nenhum estabelecimento encontrado"}), 404 
    return jsonify({"status": "sucesso", "dados": estabelecimentos}), 200

@endpoint_bp.route("/api/v1/estabelecimento/<cnpj_basico>/<cnpj_ordem>", methods=['GET'])
def get_estabelecimento_details(cnpj_basico, cnpj_ordem: str):
    db = current_app.config['DB']
    estabelecimento = db.query_estabelecimentos_details_by_cnpj(cnpj_basico, cnpj_ordem)

    if not estabelecimento: return jsonify({"status": "erro", "dados": "Ocorreu um erro ao carregar os detalhes do estabelecimento"}), 404 
    return jsonify({"status": "sucesso", "dados": estabelecimento}), 200

@endpoint_bp.route("/api/v1/cnaes/<descricao>")
def get_cnaes(descricao: str):
    db = current_app.config['DB']

    cnaes = db.query_cnaes_autocomplete_by_descricao(descricao)
    
    if not cnaes: return jsonify({"status": "erro", "dados": "Nenhum CNAE encontrado"}), 404
    return jsonify({"status": "sucesso", "dados": cnaes}), 200

@endpoint_bp.route("/api/v1/municipios/<descricao>")
def get_municipios(descricao: str):
    db = current_app.config['DB']

    uf = request.args.get('uf')
    municipios = db.query_municipios_autocomplete_with_filter(descricao, uf)
    
    if not municipios: return jsonify({"status": "erro", "dados": "Nenhum municipio encontrado"}), 404
    return jsonify({"status": "sucesso", "dados": municipios}), 200    
