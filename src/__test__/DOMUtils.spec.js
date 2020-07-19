import {DOMUtils} from "../utils/DOMUtils";

describe('http client test', () => {
    test("it checks DOMUtils loads correctly", () => {
        const utilsInstance = DOMUtils;
        const anyDOMUtilsMethod = typeof utilsInstance.createElement;

        expect(anyDOMUtilsMethod).not.toBe("undefined");
    });

    test("it checks DOMUtils create correctly an html element", () => {
        const element = DOMUtils.createElement('div');
        const isHTMLElement = element instanceof HTMLElement;
        expect(isHTMLElement).toBe(true);
    });

    test("it checks DOMUtils create correctly an html element with attributes", () => {
        const element = DOMUtils.createElement('div', {className: 'dom-utils--test'});
        const elementClass = element.className;
        expect(elementClass).toBe('dom-utils--test');
    });

});
