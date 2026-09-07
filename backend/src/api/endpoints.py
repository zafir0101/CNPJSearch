from flask import Blueprint, current_app, jsonify, request 

endpoint_bp = Blueprint('app', __name__)

@endpoint_bp.route("/api/v1/empresas", methods=['GET'])
def get_empresa():
    db = current_app.config['DB']

    cnpj_basico = request.args.get('cnpj_basico')
    razao_social = request.args.get('razao_social')

    if (cnpj_basico is None and razao_social is None) or (cnpj_basico is not None and razao_social is not None):
        return jsonify({"status": "erro", "dados": "Forneça os parâmetros corretamente"}), 404 

    if cnpj_basico is not None: result = db.query_empresa_using_cnpj_basico(cnpj_basico)
    else: result = db.query_empresas_using_razao_social(razao_social)
    
    if not result: return jsonify({"status": "erro", "dados": "Nenhuma empresa encontrada"}), 404 
    return jsonify({"status": "sucesso", "dados": result}), 200

@endpoint_bp.route("/api/v1/estabelecimentos/<cnpj_basico>", methods=['GET'])
def get_estabelecimento_preview(cnpj_basico: str):
    db = current_app.config['DB']

    filter = {}

    if request.args.get('uf') is not None: filter['uf'] = request.args.get('uf')
    if request.args.get('municipio') is not None: filter['municipio'] = request.args.get('municipio')
    if request.args.get('situacao_cadastral') is not None: filter['situacao_cadastral'] = request.args.get('situacao_cadastral')
    if request.args.get('cnaes') is not None: filter['cnae_fiscal_principal'] = request.args.get('cnaes')

    estabelecimentos = db.query_estabelecimentos_preview_using_cnpj_basico_and_filter(cnpj_basico, filter)

    if not estabelecimentos:
        return jsonify({"status": "erro", "dados": "Nenhum estabelecimento encontrado"}), 404
    return jsonify({"status": "sucesso", "dados": estabelecimentos}), 200


@endpoint_bp.route("/api/v1/estabelecimento/<cnpj_basico>/<cnpj_ordem>", methods=['GET'])
def get_estabelecimento_details(cnpj_basico, cnpj_ordem: str):
    db = current_app.config['DB']
    estabelecimento = db.query_estabelecimento_details_using_cnpj(cnpj_basico, cnpj_ordem)

    if not estabelecimento: return jsonify({"status": "erro", "dados": "Ocorreu um erro ao carregar os detalhes do estabelecimento"}), 404 
    return jsonify({"status": "sucesso", "dados": estabelecimento}), 200

@endpoint_bp.route("/api/v1/cnaes/<descricao>")
def get_cnaes_using_descricao(descricao: str):
    db = current_app.config['DB']

    cnaes = db.query_cnaes_autocomplete_using_descricao(descricao)
    
    if not cnaes: return jsonify({"status": "erro", "dados": "Nenhum CNAE encontrado"}), 404
    return jsonify({"status": "sucesso", "dados": cnaes}), 200

@endpoint_bp.route("/api/v1/cnaes/codigo/<codigo>")
def get_cnaes_using_codigo(codigo: str):
    db = current_app.config['DB']

    cnaes = db.query_cnaes_using_codigo(codigo)
    
    if not cnaes: return jsonify({"status": "erro", "dados": "Nenhum CNAE encontrado"}), 404
    return jsonify({"status": "sucesso", "dados": cnaes}), 200

@endpoint_bp.route("/api/v1/municipios/<descricao>")
def get_municipios(descricao: str):
    db = current_app.config['DB']

    uf = request.args.get('uf')
    municipios = db.query_municipios_autocomplete_using_filter(descricao, uf)
    
    if not municipios: return jsonify({"status": "erro", "dados": "Nenhum municipio encontrado"}), 404
    return jsonify({"status": "sucesso", "dados": municipios}), 200    

@endpoint_bp.route("/api/v1/socios/<cnpj_basico>")
def get_socios(cnpj_basico: str):
    db = current_app.config['DB']

    socios = db.query_socios_preview_using_cnpj_basico(cnpj_basico)

    if not socios: return jsonify({"status": "erro", "dados": "Nenhum socio encontrado"}), 404
    return jsonify({"status": "sucesso", "dados": socios}), 200    

@endpoint_bp.route("/api/v1/socio/<cnpj_basico>/<cnpj_cpf_socio>")
def get_socio(cnpj_basico: str, cnpj_cpf_socio: str):
    db = current_app.config['DB']

    socio = db.query_socio_details_using_cnpj_or_cpf(cnpj_basico, cnpj_cpf_socio)

    if not socio: return jsonify({"status": "erro", "dados": "Nenhum socio encontrado"}), 404
    return jsonify({"status": "sucesso", "dados": socio}), 200    

@endpoint_bp.route("/api/v1/naturezas/codigo/<codigo>")
def get_naturezas_using_codigo(codigo: str):
    db = current_app.config['DB']
    natureza = db.query_naturezas_using_codigo(codigo)

    if not natureza: return jsonify({"status": "erro", "dados": "Nenhuma natureza jurídica encontrada"}), 404
    return jsonify({"status": "sucesso", "dados": natureza}), 200

@endpoint_bp.route("/api/v1/estatisticas", methods=['GET'])
def get_stats():
    db = current_app.config['DB']
    try:
        stats = db.query_stats()
        if not stats: 
            return jsonify({"status": "erro", "dados": "Nenhuma estatística encontrada"}), 404
        return jsonify({"status": "sucesso", "dados": stats}), 200
    except Exception as e:
        return jsonify({"status": "erro", "dados": "Ocorreu um erro ao processar as estatísticas"}), 500

@endpoint_bp.route("/api/v1/grafo/<cnpj_basico>", methods=['GET'])
def get_socios_and_empresas_graph(cnpj_basico: str):
    db = current_app.config['DB']
    graph = db.query_graph(cnpj_basico)

    if not graph or not graph["nodes"]:
        return jsonify({"status": "erro", "dados": "Não foi possível gerar o grafo para este CNPJ"}), 404

    return jsonify({"status": "sucesso", "dados": graph}), 200
