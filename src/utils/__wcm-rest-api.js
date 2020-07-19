import {HttpClient} from "./HTTP"

class __wcmRestApi {
    constructor(virtualPortal) {
        this.virtualPortal = virtualPortal ? `${virtualPortal}/` : "";
        this.wcmRestContext = `/wps/contenthandler/${this.virtualPortal}!ut/p/wcmrest/`;
    }

    static makeAjaxCall(params) {
        const requestParams = {
            method: params.method || "GET",
            cache: "no-cache",
            credentials: params.credentials || "same-origin",
            headers: {
                "Content-Type": params.contentType || "application/json",
                "Accept": params.contentType || "application/json"
            },
            referrerPolicy: "no-referrer"
        };

        if (params.body) requestParams.body = JSON.stringify(params.body);

        const fetchCall = HttpClient.makeRequest(params.url, requestParams);
        return new Promise((resolve, reject) => {
            fetchCall
                .then(data => resolve(data))
                .catch(err => reject(err));
        })
    };
}

export {__wcmRestApi};

