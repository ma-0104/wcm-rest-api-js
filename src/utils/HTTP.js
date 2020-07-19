import https from "https";
import http from "https";
import URL from "url";
import {getDefaultHttpOptions} from "./http-options";

function __sendRequest(url, options) {
    return typeof fetch !== "undefined" ?
        __sendWithBrowser(url, options) :
        __sendWithNode(url, options);
}

function __sendWithBrowser(url, options) {
    return fetch(url, options).then((response) => {
        response.ok ? response.json() : response.error()
    });
}

function __sendWithNode(url, options) {
    return new Promise((resolve, reject) => {
        let parsedURL = URL.parse(url);
        let Adapter = parsedURL.protocol === "http:" ? http : https;

        const requestOptions = {
            protocol: parsedURL.protocol,
            hostname: parsedURL.hostname,
            port: parsedURL.port,
            path: parsedURL.path,
            method: options.method,
            headers: options.headers,
        };

        let data = options.body;

        const req = Adapter.request(requestOptions, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(body)
                } else {
                    if (res.statusCode === 404 && utils.isEmptyString(body)) {
                        body = {statusCode: res.statusCode, statusMessage: res.statusMessage};
                    }
                    reject(body)
                }
            })
        });

        req.on('error', error => {
            reject(error)
        });

        if (data != null) {
            req.write(data)
        }

        req.end()
    })
}

export class HttpClient {
    static get(url, options = getDefaultHttpOptions()) {
        options.url = url;
        return this.makeRequest(options);
    }

    static post(url, options = getDefaultHttpOptions()) {
        options.url = url;
        options.method = "POST";
        return this.makeRequest(options);
    }

    static put(url, options = getDefaultHttpOptions()) {
        options.url = url;
        options.method = "PUT";
        return this.makeRequest(options);
    }

    static delete(url, options = getDefaultHttpOptions()) {
        options.url = url;
        options.method = "DELETE";
        return this.makeRequest(options);
    }

    static makeRequest(options) {
        return __sendRequest(options.url, options);
    }
}
