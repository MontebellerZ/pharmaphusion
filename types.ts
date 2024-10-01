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

export type IPedidoData = {
    resultado: {
        id: number;
        numero: number;
        dataAprovacao: string;
        clienteNomeRazao: string;
        precoLiquido: number;
        valorSubsidio: number;
    }[];
    sucesso: boolean;
};

export type IPedidoDetailsRawData = {
    resultado: {
        numero: number;
        clienteNomeRazao: string;
        percentualDesconto: number;
        valorDesconto: number;
        percentualAcrescimo: number;
        valorAcrescimo: number;
        valorPago: number;
        precoOriginal: number;
        precoBruto: number;
        precoLiquido: number;
        taxaEntrega: number;
        pedidoFormulas?:
            | {
                  pedidoNumero: number;
                  pacienteNome: string;
                  pedidoVeterinario: boolean;
                  dataAprovacao: string;
              }[]
            | null;
        valorSubsidio: number;
    };
    sucesso: boolean;
};

export type IPedidoDetailsData = {
    resultado: {
        numero: number;
        clienteNomeRazao: string;
        percentualDesconto: number;
        valorDesconto: number;
        percentualAcrescimo: number;
        valorAcrescimo: number;
        valorPago: number;
        precoOriginal: number;
        precoBruto: number;
        precoLiquido: number;
        taxaEntrega: number;
        pacienteNome: string;
        pedidoVeterinario: boolean;
        dataAprovacao: string;
        valorSubsidio: number;
    };
    sucesso: boolean;
};

export type IPedidoExcelData = {
    DATA?: string;
    PEDIDO: number;
    NOME?: string;
    "VALOR FINAL"?: number;
    DESCONTO?: number | null;
    "TOTAL DE ITENS"?: number | null;
    COMPROVANTE?: string | null;
    PAGAMENTO?: string | null;
};

export type IRequiredColumn = {
    excelLetter: string;
    excel: string;
    get: (
        pedidoDetails: IPedidoDetailsData["resultado"],
        ...params: any
    ) => number | string | boolean | Date;
};
