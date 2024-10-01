import "dotenv/config";
import axios from "axios";
import xlsx from "xlsx";
import fs from "fs";
import { ITokenData, ILoginData, IPedidoData } from "./types";

const loginAxios = axios.create({ baseURL: process.env.API_LOGIN_LINK });
const dataAxios = axios.create({ baseURL: process.env.API_DATA_LINK });

const user = process.env.API_USERNAME;
const pass = process.env.API_PASSWORD;

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

async function main() {
    // const loginData: ILoginData = await loginAxios
    //     .post("/api/sessao", { username: user, password: pass })
    //     .then((res) => res.data);

    // const tokenData: ITokenData = await loginAxios
    //     .post("/connect/token", getTokenFormData(user, pass, loginData.acesso.idAcessoUnico))
    //     .then((res) => res.data);

    // dataAxios.defaults.headers.common.Authorization = "Bearer " + tokenData.access_token;

    // const pedidoData: IPedidoData = await dataAxios
    //     .get("/vendas/api/pedido/v1", { params: getPedidoParams(63049, tokenData.tenantId) })
    //     .then((res) => res.data);

    const wb = xlsx.readFile(process.env.EXCEL_PATH, { cellDates: true });

    const ws = wb.Sheets[wb.SheetNames[0]];

    const data = xlsx.utils.sheet_to_json(ws);

    fs.writeFileSync("./data.json", JSON.stringify(data, null, 4));
}

main()
    .then(() => console.info("Finalizado com sucesso."))
    .catch((err) => console.error("Finalizado com erro:", err));
