export type ILoginData = {
    erro: number;
    acesso: {
        id: string;
        usuarioId: string;
        tenantId: string;
        userName: string;
        ip: string;
        token: string;
        refreshToken: string;
        dataAcesso: string;
        dataSaida?: null;
        ativo: boolean;
        dataLogin: string;
        origemLogout?: null;
        idAcessoUnico: string;
    };
};

export type ITokenData = {
    access_token: string;
    expires_in: number;
    token_type: string;
    refresh_token: string;
    scope: string;
    id: string;
    username: string;
    tenantId: string;
    empresa: string;
    paisId: number;
    nome: string;
    gmt: number;
    data: string;
    tempoInatividade: number;
};

export interface IPedidoData {
    resultado: {
        id: number;
        canalId: number;
        pedidoId: number;
        numero: number;
        dataAtualizacao: string;
        dataAprovacao: string;
        clienteNomeRazao: string;
        atendenteNome: string;
        precoLiquido: number;
        valorSubsidio: number;
        pedidoStatusId: number;
        statusFinanceiroId: number;
        statusAtual: number;
        statusAtualDescricao: string;
    }[];
    sucesso: boolean;
}
