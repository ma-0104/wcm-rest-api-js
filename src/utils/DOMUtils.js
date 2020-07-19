import {Utils} from "./utils";

export class DOMUtils {
    /**
     * @summary create an HTMLElement
     * @param tag
     * @param attributes
     * @param text
     * @return {HTMLElement}
     */
    static createElement(tag, attributes, text) {
        const element = document.createElement(tag);
        if (!Utils.isEmpty(attributes)) {
            DOMUtils.assignAttributes(element, attributes);
        }
        if (text) {
            element.appendChild(DOMUtils.createText(text));
        }
        return element;
    }

    /**
     * @summary assign multiple attributes to an html element
     * @param element
     * @param attributes
     */
    static assignAttributes(element, attributes) {
        for (let key in attributes) {
            if (key === 'data') {
                for (let dataKey in attributes[key]) {
                    element.dataset[dataKey] = attributes[key][dataKey];
                }
            } else {
                element[key] = attributes[key];
            }
        }
    }

    /**
     * @summary create text node
     * @param text
     * @return {Text}
     */
    static createText(text) {
        return document.createTextNode(text)
    }
}
