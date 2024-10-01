import "dotenv/config";
import axios from "axios";
import fs from "fs";
import exceljs from "exceljs";
import {
    ITokenData,
    ILoginData,
    IPedidoData,
    IPedidoExcelData,
    IRequiredColumn,
    IPedidoDetailsRawData,
    IPedidoDetailsData,
} from "./types";

const loginAxios = axios.create({ baseURL: process.env.API_LOGIN_LINK });
const dataAxios = axios.create({ baseURL: process.env.API_DATA_LINK });

const user = process.env.API_USERNAME;
const pass = process.env.API_PASSWORD;

const REQUIRED_COLUMNS: IRequiredColumn[] = [
    { excelLetter: "A", excel: "DATA", get: (ped) => ped.dataAprovacao },
    { excelLetter: "B", excel: "PEDIDO", get: (ped) => ped.numero },
    { excelLetter: "C", excel: "NOME", get: (ped) => ped.clienteNomeRazao },
    { excelLetter: "D", excel: "VALOR FINAL", get: (ped) => ped.precoLiquido - ped.taxaEntrega },
    {
        excelLetter: "E",
        excel: "DESCONTO",
        get: (ped, excelData: IPedidoExcelData) =>
            -(
                (excelData["VALOR FINAL"] || ped.precoLiquido - ped.taxaEntrega) / ped.precoBruto -
                1
            ),
    },
];

function registerError(message: string) {
    const dtNow = new Date().toLocaleString();
    const fullMsg = `\n\n${dtNow} - ${message}`;
    fs.appendFileSync("./errors.txt", fullMsg);
    console.error(fullMsg);
}

function registerWarn(message: string) {
    const dtNow = new Date().toLocaleString();
    const fullMsg = `\n\n${dtNow} - ${message}`;
    fs.appendFileSync("./warns.txt", fullMsg);
    console.warn(fullMsg);
}

function getTokenFormData(user: string, pass: string, idAcessoUnico: string) {
    const tokenFormData = new URLSearchParams();
    tokenFormData.append("username", user);
    tokenFormData.append("password", pass);
    tokenFormData.append("id_acesso_unico", idAcessoUnico);
    tokenFormData.append("grant_type", "password");
    tokenFormData.append("client_id", "phusion_spa");
    tokenFormData.append("client_secret", "phusion@123");
    tokenFormData.append("scope", "fate_formulacerta offline_access");
    tokenFormData.append("gmt", "180");
    return tokenFormData;
}

function getPedidoParams(pedidoNumero: string | number, tenandId: string) {
    return {
        tenantId: tenandId,
        pedidoNumero: pedidoNumero,
        filialId: 112,
        offset: 0,
    };
}

async function getPedidosExcelData() {
    const wb = new exceljs.Workbook();
    await wb.xlsx.readFile(process.env.EXCEL_PATH);

    const ws = wb.getWorksheet("Vendas");

    const data: IPedidoExcelData[] = [];

    const firstRow = ws.getRow(1);
    const keys = firstRow.values;

    if (!Array.isArray(keys)) throw new Error("Não é um array");

    ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        const obj: IPedidoExcelData = { PEDIDO: 0 };

        for (let i = 1; i < keys.length; i++) {
            const key = keys[i];

            if (typeof key !== "string") continue;

            obj[key] = row.values[i];
        }

        data.push(obj);
    });

    return { wb, ws, data: data.slice(0, 20) };
}

async function insertPedidosInfo(
    pedidos: IPedidoExcelData[],
    item: number,
    col: IRequiredColumn,
    details: IPedidoDetailsData["resultado"],
    ws: exceljs.Worksheet
) {
    pedidos[item][col.excel] = col.get(details, pedidos[item]);
    ws.getCell(`${col.excelLetter}${item + 2}`).value = pedidos[item][col.excel];
}

async function writePedidosExcelData(wb: exceljs.Workbook) {
    await wb.xlsx.writeFile(process.env.EXCEL_PATH);
}

async function connectApi() {
    const loginData: ILoginData = await loginAxios
        .post("/api/sessao", { username: user, password: pass })
        .then((res) => res.data);

    const tokenData: ITokenData = await loginAxios
        .post("/connect/token", getTokenFormData(user, pass, loginData.acesso.idAcessoUnico))
        .then((res) => res.data);

    dataAxios.defaults.headers.common.Authorization = "Bearer " + tokenData.access_token;

    return { loginData, tokenData };
}

async function main() {
    const { tokenData } = await connectApi();

    const { wb: excelWb, ws: excelWs, data: pedidos } = await getPedidosExcelData();

    for (let i = 0; i < pedidos.length; i++) {
        const ped = pedidos[i];

        if (!ped.PEDIDO) {
            registerError(`Não existe o número do pedido na linha ${i + 2} do excel`);
            continue;
        }

        if (!ped["VALOR FINAL"]) {
            registerWarn(
                `O pedido ${ped.PEDIDO} não possui valor original, será inserido o da Phusion`
            );
        }

        if (REQUIRED_COLUMNS.every((col) => ped[col.excel] != undefined)) {
            console.info(`Pedido ${ped.PEDIDO} já possui todos os dados corretamente`);
            continue;
        }

        const pedidoApi: IPedidoData = await dataAxios
            .get("/vendas/api/pedido/v1", {
                params: getPedidoParams(ped.PEDIDO, tokenData.tenantId),
            })
            .then((res) => res.data);

        if (!pedidoApi.sucesso || !pedidoApi.resultado.length) {
            registerError(`O pedido ${ped.PEDIDO} não foi encontrado na Phusion`);
            continue;
        }

        const pedidoDetailsApi: IPedidoDetailsData = await dataAxios
            .get(`/vendas/api/pedido/detalhes/${pedidoApi.resultado[0].id},${tokenData.tenantId}`)
            .then((res) => {
                const data: IPedidoDetailsRawData = res.data;
                const result: IPedidoDetailsData = {
                    ...data,
                    resultado: {
                        ...data.resultado,
                        pacienteNome: data.resultado.pedidoFormulas?.at(0)?.pacienteNome,
                        dataAprovacao: data.resultado.pedidoFormulas?.at(0)?.dataAprovacao,
                        pedidoVeterinario: data.resultado.pedidoFormulas?.some(
                            (p) => p.pedidoVeterinario
                        ),
                    },
                };
                return result;
            });

        if (!pedidoDetailsApi.sucesso || !pedidoDetailsApi.resultado) {
            registerError(`Os detalhes do pedido ${ped.PEDIDO} não foram encontrados na Phusion`);
            continue;
        }

        REQUIRED_COLUMNS.forEach((col) => {
            if (ped[col.excel] != undefined) return;

            insertPedidosInfo(pedidos, i, col, pedidoDetailsApi.resultado, excelWs);
        });

        console.info(`Pedido ${ped.PEDIDO} atualizado com sucesso`);
    }

    await writePedidosExcelData(excelWb);
}

main()
    .then(() => console.info("Finalizado com sucesso."))
    .catch((err) => console.error("Finalizado com erro:", err));
