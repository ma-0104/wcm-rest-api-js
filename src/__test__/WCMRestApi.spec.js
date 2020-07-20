import {WCMRestAPI} from "../utils/wcm-rest-api";

describe('Tests for WCM REST API', () => {
    test("it checks DOMUtils loads correctly", () => {
        const utilsInstance = WCMRestAPI;
        const anyWCMRestAPIMethod = typeof new utilsInstance({});

        expect(anyWCMRestAPIMethod).not.toBe("undefined");
    });

    test("it checks DOMUtils loads correctly", () => {
        const wcmRestAPIInstance = new WCMRestAPI({creation: true, virtualPortal: 'gov'});
        const expectedPath = '/wps/contenthandler/gov/!ut/p/wcmrest/'
        expect(wcmRestAPIInstance.wcmRestPath).toBe(expectedPath);
    });
});
