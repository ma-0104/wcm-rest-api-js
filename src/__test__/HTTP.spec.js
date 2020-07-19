import {HttpClient} from "../utils/HTTP"
import regeneratorRuntime from "regenerator-runtime";

describe('http client test', () => {
    test("it checks HTTP loads correctly", () => {
        const utilsInstance = HttpClient;
        const anyHttpClientlMethod = typeof utilsInstance.get;

        expect(anyHttpClientlMethod).not.toBe("undefined");
    });

    test("it checks get works", async () => {

        const data = await HttpClient.get('https://run.mocky.io/v3/3efd27c0-7f42-4f2a-a8c2-cb55e039a64d');

        expect(JSON.parse(data).success).toBe(true);
    });
});
