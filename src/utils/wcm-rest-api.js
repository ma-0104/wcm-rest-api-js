/*
interface WcmRestAPIConfig {
     wcmRestPath : string; //the path for the wcm to create the content, if itÂ´s a project or not
     contentTemplateID: string //authoring template uuid
     parentID: string //site area uuid
     virtualPortal: string; // Virtual Portal Name
     workflowID: string //workflow uuid
     categoriesIDArray: string // all the categories uuidÂ´s to be tagged to the piece of content
     approverDistinguishedName: string //approvers uuidÂ´s
     userID: string //the user uuid to publish the piece of content
     projectID: string// project uuid
     projectName: string //project name
}
 */
import {Utils} from './utils';
import {HttpClient} from "./HTTP";
import {DOMUtils} from "./DOMUtils";

class WCMRestAPI {

    /**
     * @method constructor
     * @summary: Initialize the api with the config given in order to create/update pieces of content
     * @param {object} config   an object that contains all the specifications of the entry object that will be created
     */
    constructor(config) {
        this._setDefaultValues();
        if (config.hasOwnProperty('creation') && config.creation) {
            this._setCreationConfig(config);
        } else if (config.update) {
            this._setUpdateConfig(config)
        }
    }

    _setDefaultValues() {
        this.wcmRestPath = '/wps/contenthandler/web/!ut/p/wcmrest/';
        this.virtualPortal = '';
        this.contentTemplateID = null;
        this.parentID = null;
        this.workflowID = null;
        this.categoriesIDArray = [];
        this.approverDistinguishedName = [];
        this.userID = null;
        this.projectID = null;
        this.authoringTemplateData = {};
        this.uniqueName = null;
        this.entryObject = {};
        this.authoringTemplateRestricted = false;
    }

    /**
     * @method _setCreationConfig
     * @summary: Initialize the api with the config given in order to create pieces of content
     * @param {object} config   an object that contains all the specifications of the entry object that will be created
     */
    _setCreationConfig(config) {
        let hasProject = config.hasOwnProperty('projectName');

        this.virtualPortal = typeof config.virtualPortal === 'undefined' || config.virtualPortal === '' ? '' : config.virtualPortal + '/';
        this.wcmRestPath = hasProject ? "/wps/contenthandler/" + this.virtualPortal + "!ut/p/wcmrest/" : "/wps/contenthandler/" + this.virtualPortal + "$project/" + config['projectName'] + "/!ut/p/wcmrest/";
        this.contentTemplateID = typeof config.contentTemplateID !== 'undefined' ? config.contentTemplateID : null;
        this.parentID = typeof config.parentID !== 'undefined' ? config.parentID : null;
        this.workflowID = typeof config.workflowID !== 'undefined' ? config.workflowID : null;
        this.categoriesIDArray = typeof config.categoriesIDArray !== 'undefined' ? config.categoriesIDArray : [];
        this.approverDistinguishedName = typeof config.approverDistinguishedName !== 'undefined' ? config.approverDistinguishedName : [];
        this.userID = typeof config.userID !== 'undefined' ? config.userID : null;
        this.projectID = typeof config.projectID !== 'undefined' ? config.projectID : null;
        this.authoringTemplateRestricted = typeof config.authoringTemplateRestricted !== 'undefined' ? config.authoringTemplateRestricted : false;

        return new Promise((resolve, reject) => {
            if (!this.contentTemplateID) {
                console.error('In order to create a new piece of content you must specify a Content Template');
                return reject('In order to create a new piece of content you must specify a Content Template');
            }

            return this.getDataFromAuthoringTemplate(this.contentTemplateID).then((response) => {
                this.entryObject = Utils.cloneObject(response, true);

                this.updateLinkElement('parent', this.parentID);
                this.updateLinkElement('workflow', this.workflowID);
                this.updateLinkElement('project', this.projectID);

                return resolve(response);
            }).catch((error) => {
                return reject(error);
            });
        });
    }

    /**
     * @method _setUpdateConfig
     * @summary: Initialize the api with the config given in order to update pieces of content
     * @param {object} config - an object that contains all the specifications of the entry object that will be created
     */
    _setUpdateConfig(config) {
        this.virtualPortal = typeof config.virtualPortal === 'undefined' || config.virtualPortal === '' ? '' : config.virtualPortal + '/';
        this.wcmRestPath = window.location.href.indexOf('$project') < 0 ? "/wps/contenthandler/" + this.virtualPortal + "!ut/p/wcmrest/" : "/wps/contenthandler/" + this.virtualPortal + "$project/" + config['projectName'] + "/!ut/p/wcmrest/";
        this.pieceOfContentID = typeof config.pieceOfContentID !== 'undefined' ? config.pieceOfContentID : null;

        return new Promise((resolve, reject) => {
            if (!this.pieceOfContentID) {
                console.error('In order to update a piece of content you must specify the Content UID');
                return reject('In order to update a piece of content you must specify the Content UID');
            }

            return this.getDataFromPieceOfContent(this.pieceOfContentID).then((response) => {
                this.entryObject = Utils.cloneObject(response, true);
                return resolve(response);
            }).catch((error) => reject(error));
        });
    }

    getEntryObject() {
        return Utils.cloneObject(this.entryObject, true);
    };

    setEntryObject(entry) {
        this.entryObject = Utils.cloneObject(entry, true);
    };

    /**
     * @method setPropertyValueByName
     * @summary Set the new content property value by name.
     * @param {string} property - The property to set the new value.
     * @param {string} value - The value to set.
     */
    setPropertyValueByName(property, value) {
        switch (property) {
            case "name":
                this.entryObject.entry.name = value;
                break;
            case "title":
                this.entryObject.entry.title = {lang: "en", value: value};
                break;
            case "description" :
                this.entryObject.entry.summary = {lang: "en", value: value};
                break;
            default:
                console.log('The property "' + property + '" is not supported yet');
        }
    };

    /**
     * @summary Set the skeleton element value by Name.
     * @param {string} name - The element name in the authoring template to set.
     * @param {string} value - The value to set.
     * @param extra
     * @return {number}
     */

    setElementValueByName(name, value, extra) {
        const elements = this.entryObject.entry.content.content.elements.element;
        //let value = $.isArray( value ) ? value.toString() : value;
        const length = elements.length;
        let found = false;
        for (let i = 0; i < length; i++) {
            if (elements[i].name === name) {
                let type = elements[i].type;
                this.setElementValueByType(elements[i], type, value, extra);
                found = true;
                return 0;
            }
        }

        if (!found && !this.authoringTemplateRestricted) {
            console.warn('Element ' + name + ' does not exist on the Authoring Template');
            return -1;
            //let newElement = this.generateShortTextElementForWCM( name, value, name );
            //elements.push( newElement );
        }

    };

    /**
     * @summary Set the value of an element value based in it's type.
     * @param {object} element - The element to set the new value.
     * @param {string} type - The element type.
     * @param {string|object} value - The value to set. String in case of ShortText,Text and RichtText, object in case of optionSelection.
     * @param extra
     */
    setElementValueByType(element, type, value, extra) {
        if (element.data && element.data.hasOwnProperty('elementName')) {
            delete element.data.elementName;
        }
        switch (type) {
            case 'ShortTextComponent':
            case 'TextComponent':
            case 'HTMLComponent':
            case 'RichTextComponent':
                element.data.value = value ? value : '';
                break;
            case 'ReferenceComponent':
                element.data.reference = this.wcmRestPath + '/item/' + value;
                break;
            case 'DateComponent':
                element.data.date = {
                    'type': 'DateTime',
                    'value': value
                };

                if (!value) {
                    delete element.data.date.value;
                }
                break;
            case 'ImageComponent':
                if (Utils.isEmpty(value)) {
                    element.data = {
                        image: {
                            altText: "",
                            dimension: {
                                border: "",
                                height: "",
                                width: ""
                            },
                            tagName: "",
                            fileName: "",
                            resourceUri: {
                                type: "",
                                value: ""
                            }
                        },
                        type: "application/vnd.ibm.wcm+xml"
                    };
                    break;
                }
                if (value.hasOwnProperty('image')) {
                    element.data = value;
                } else {
                    element.data.image.binaryresource = value;
                    if (element.data.image.hasOwnProperty('resourceUri')) {
                        delete element.data.image.resourceUri;
                    }
                }

                if (element.data && element.data.elementName) {
                    delete element.data.elementName;
                }
                break;
            case 'FileComponent':
                if (value.hasOwnProperty('resourceUri')) {
                    element.data = value;
                } else {
                    element.data.binaryresource = value;
                    if (element.data.hasOwnProperty('resourceUri')) {
                        delete element.data.resourceUri;
                    }
                }

                if (element.data && element.data.elementName) {
                    delete element.data.elementName;
                }
                break;
            case 'JSPComponent':
                element.data.jsp.path = value;
                if (typeof extra !== 'undefined') element.data.jsp.errorMessage = extra;
                break;
            case 'LinkComponent':
                element.data.linkElement.destination.type = typeof extra !== 'undefined' ? extra : 'external';
                element.data.linkElement.destination.value = value;
                break;
            case 'NumericComponent':
                element.data.double = value;
                break;
            case 'UserSelectionComponent':
                element.data.userSelection.user = value;
                break;
            case 'OptionSelectionComponent':
                let options = element.data.optionselection.options.option;
                let mode = element.data.optionselection.options.mode;
                let selection = element.data.optionselection.selection;

                if (selection !== 'UnrestrictedCategory' && !options) break;

                if (selection === 'UnrestrictedCategory') {
                    element.data.optionselection.options.option = [];
                }

                options = element.data.optionselection.options.option;

                let length = element.data.optionselection.options.option.length;

                let newValue = [];

                for (let m = 0; m < length; m++) {
                    options[m].selected = false;
                }


                if (!Array.isArray(value)) {
                    newValue.push(value);
                } else {
                    newValue = [...value];
                }

                let valuesLength = newValue.length;


                for (let j = 0; j < valuesLength; j++) {
                    if (newValue[j].hasOwnProperty('namePath')) delete newValue[j].id;

                    let found = false;
                    for (let i = 0; i < length; i++) {
                        if (element.data.optionselection.options.option[i].value !== newValue[j].value) {
                            if (mode === 'Singleselect') element.data.optionselection.options.option[i].selected = false;
                            continue;
                        }
                        found = true;
                        element.data.optionselection.options.option[i].selected = true;
                    }

                    if (!found) {
                        let optionSelected = {};
                        optionSelected.selected = true;
                        if (typeof newValue[j].category !== 'undefined')
                            optionSelected.category = this.wcmRestPath + 'Category/' + newValue[j].category;
                        if (typeof newValue[j].id !== 'undefined')
                            optionSelected.id = newValue[j].id;

                        if (newValue[j].value) {
                            optionSelected.value = newValue[j].value;
                        }
                        element.data.optionselection.options.option.push(optionSelected);
                    }
                }

                if (valuesLength === 0) {
                    for (let k = 0; k < length; k++) {
                        element.data.optionselection.options.option[k].selected = false;
                    }
                }
                break;
            default:
                console.log('The type "' + type + '" is not supported yet.');
                break;
        }
    };

    deleteElementByName(name) {
        let elements = this.entryObject.entry.content.content.elements.element;
        for (let i = elements.length - 1; i >= 0; i--) {
            let elementName = elements[i].name;
            if (elementName === name) {
                elements.splice(i, 1);
                return;
            }
        }
    };

    /**
     * converts all the data that is on the authoringTemplateData object to element list to send it to WCM
     * @return  {array} elementList of the piece of content
     */
    convertAuthoringTemplateDataToElementArray() {
        let elementList = [];
        for (let element in this.authoringTemplateData) {
            if (this.authoringTemplateData.hasOwnProperty(element)) {
                elementList.push(this.authoringTemplateData[element]);
            }
        }
        return elementList;
    };


    /**
     * Append an element to the Link object.
     * @param  rel     the type of the link element (parent, project, workflow, contentTemplate....)
     * @param  uid    the uid of the link element
     * @return  {object} element the element added
     */
    updateLinkElement(rel, uid) {

        if (!uid) return;

        let element = {
            rel: rel,
            href: this.wcmRestPath + 'item/' + uid
        };

        //Update if exists, append if it's not
        let length = this.entryObject.entry.link.length;
        let linkArray = this.entryObject.entry.link;

        for (let i = 0; i < length; i++) {
            if (linkArray[i].rel === rel) {
                linkArray[i] = element;
                return element;
            }
        }

        //Not exist
        this.entryObject.entry.link.push(element);
        return element;
    };

    /**
     * @method createJSONDataForWCM
     * @summary create the JSON object to be sent to wcm
     * @param  name     the name that the piece of content will have
     * @param  arrayElements  array that contains all the elements for the wcm
     * @param  customID  customId if they want the unique name to have that customID
     * @return {object} the jsonEntry for the wcm
     */
    createJSONDataForWCM(name, arrayElements, customID) {
        this.uniqueName = typeof customID === 'undefined' ? this.formatName(name) + '-' + this.generateUUID() : customID;
        let jsonEntry = {
            "entry": {
                "title": {"lang": "en", "value": name},
                "name": this.uniqueName,
                "type": "Content",
                "owner": this.generateOwnerArray(),
                "link": [
                    {
                        "rel": "content-template",
                        "href": this.wcmRestPath + "ContentTemplate/" + this.contentTemplateID
                    }, {
                        "rel": "workflow",
                        "href": this.generateWorkflowHref()
                    }, {
                        "rel": "parent",
                        "href": this.wcmRestPath + "item/" + this.parentID
                    }
                ],
                "profile": {
                    "category": this.generateCategoriesArray()
                },
                "content": {
                    "type": "application/vnd.ibm.wcm+xml",
                    "content": {
                        "elements": {
                            "element": arrayElements
                        }
                    }
                }
            }
        };

        if (this.projectID) {
            jsonEntry.entry.link.push({
                "rel": "project",
                "href": this.wcmRestPath + 'Project/' + this.projectID
            });
        }

        return jsonEntry
    };

    /**
     * @method generateUUID
     * @summary concatenate  and calculate four random numbers for the uuid
     * @return random and "unique" uuid
     */
    generateUUID() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return s4() + s4() + "-" + s4() + "-" + s4();
    };

    /**
     * @method formatName
     * @summary concatenate and calculate four random numbers for the uuid
     * @param name the name given to the piece of content
     * @return {string} the name replacing all empty spaces and removing all non alpha numeric characters
     */
    formatName(name) {
        return name.replace(/\s/g, '-').replace(/[^0-9a-zA-Z\-]/g, '').toLowerCase();
    };

    /**
     * @method generateWorkflowHref
     * @summary generate workflow href
     * @return the workflow href
     */
    generateWorkflowHref() {
        return this.wcmRestPath + 'item/' + this.workflowID;
    };

    /**
     * @method generateCategoriesArray
     * @summary push all the categories uuid the the categories array with the full path of the categorie
     * @return {array} the categories array
     */
    generateCategoriesArray() {
        let categoriesArray = [];
        let length = this.categoriesIDArray.length;
        for (let i = 0; i < length; i++) {
            categoriesArray.push(this.wcmRestPath + 'Category/' + this.categoriesIDArray[i]);
        }
        return categoriesArray;
    };


    /**
     * create the object of the links element
     *
     * @param propertyName the name of this element
     * @param destination the destination of the link
     * @param title the tile por the element
     * @return {object} the link object for wcm
     *
     */
    generateLinkElementForWCM(propertyName, destination, title) {
        return {
            "name": propertyName,
            "type": "LinkComponent",
            "title": title,
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "linkElement": {
                    /*"destination" :
                    {
                        "type" : "content",
                        "allowClear" : false,
                        "queryString" : "",
                        "value" : destination
                    },
                    "display" :
                    {
                        "type" : title
                    },
                    "description" :
                    {
                        "useDestination" : true,
                        "value" : destination
                    },
                    "target" : "None",
                        "additionalAttributes" : ""*/
                }
            }
        };
    };

    /**
     * @summary create the object for file element
     * @param propertyName the name of this element
     * @param base64value the value
     * @param title the destination of the link
     * @param fileName the destination of the link
     * @param fileType the destination of the link
     * @return {object} the file element object for wcm
     *
     */
    generateFileElementForWCM(propertyName, base64value, title, fileName, fileType) {
        let data = {
            "name": propertyName,
            "type": "FileComponent",
            "title": title,
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "binaryresource": {}
            }
        };
        if (typeof base64value !== 'undefined' && base64value !== null) {
            data.data.binaryresource = {
                "type": typeof fileType === 'undefined' ? 'image/jpg' : fileType,
                "fileName": typeof fileName === 'undefined' ? '' : fileName,
                "value": base64value
            };
        }

        return data;
    };

    /**
     * @summary create the object for Image element
     * @param propertyName the name of this element
     * @param base64value the value
     * @param title the destination of the link
     * @param imageType the image type
     * @param imageName the image name
     * @return {object} the file element object for wcm
     *
     */
    generateImageElementForWCM(propertyName, base64value, title, imageType, imageName) {
        let data = {
            "name": propertyName,
            "type": "ImageComponent",
            "title": typeof title === 'undefined' ? '' : title,
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "image": {
                    "altText": ""
                }
            }

        };

        if (typeof base64value !== 'undefined' && base64value !== null) {
            data.data.image.fileName = typeof imageName !== 'undefined' ? '' : imageName;
            data.data.image.resourceUri = {
                "type": imageType,
                "value": base64value
            };
        }

        return data;
    };

    /**
     * @summary create the object for short text element
     * @param propertyName the name of this element
     * @param value the value of the element
     * @param title the title of the short or text component
     * @param update if itÂ´s an update element or for create
     * @param textComponent flag to know if itÂ´s a text component
     * @return {object} the file element object for wcm
     *
     */
    generateShortTextElementForWCM(propertyName, value, title, update, textComponent) {
        let type = typeof textComponent !== 'undefined' && textComponent ? "TextComponent" : "ShortTextComponent";
        let object = {
            "name": propertyName,
            "type": type,
            "title": typeof title === 'undefined' ? '' : title
        };

        if (typeof update !== 'undefined' && update) {
            object.content = {
                "type": "text/plain",
                "value": value
            };
        } else {
            object.data = {
                "type": "text/plain",
                "value": value
            };
        }

        return object;
    };

    /**
     * @summary create the object for rich text element
     * @param propertyName the name of this element
     * @param value the value of the element
     * @param title the title of the component
     * @return {object} the file element object for wcm
     *
     */
    generateRichTextElementForWCM(propertyName, value, title) {
        return {
            "name": propertyName,
            "type": "RichTextComponent",
            "title": typeof title === 'undefined' ? '' : title,
            "data": {
                "type": "text/html",
                "value": value
            }
        }
    };

    /**
     * @summary create the object for date element
     * @param propertyName the name of this element
     * @param value the value of the element
     * @param title the title of the component
     * @return {object} the file element object for wcm
     *
     */
    generateDateElementForWCM(propertyName, value, title) {
        return {
            "name": propertyName,
            "type": "application/vnd.ibm.wcm+xml",
            "title": typeof title === 'undefined' ? '' : title,
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "date": {
                    "type": "DateTime",
                    "value": value
                }
            }
        }
    };

    /**
     * @summary create the object for option selection element
     * @param propertyName the name of this element
     * @param title the title of the component
     * @param options the set of options to send to wcm
     * @param multiSelect flag to know if the selection uas multiselect
     * @return {object} the file element object for wcm
     *
     */
    generateOptionElementForWCM(propertyName, title, options, multiSelect) {
        let optionMode = multiSelect === true ? "Multiselect" : "Singleselect";
        options = options.map(function (node) {
            return {
                "selected": node.selected,
                "id": node.id,
                "value": node.value,
                "category": node.category
            };
        });
        return {
            "name": propertyName,
            "title": title,
            "type": "OptionSelectionComponent",
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "optionselection": {
                    "displaytype": "Automatic",
                    "selection": "UserDefined",
                    "options": {
                        "mode": optionMode,
                        "option": options
                    }
                }
            }
        }
    };


    /**
     * @summary create the object for file element
     * @param propertyName the name of this element
     * @param title the title of the component
     * @param uid the component uid value
     * @return {object} the reference element object for wcm
     *
     */
    generateReferenceElementForWCM(propertyName, title, uid) {
        return {
            "name": propertyName,
            "title": title,
            "type": "ReferenceComponent",
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "reference": this.wcmRestPath + 'item/' + uid
            }
        };
    };

    /**
     * @summary Make a call to send an action.
     * @param url - url to modify the current content
     * @param comment - custom message to add to the PoC
     * @return {Promise} a promise that the piece of content was changed
     *
     */
    sendAction(url, comment = 'Action triggered by (REST API)') {
        return new Promise((resolve, reject) => {
            this.sendData("text/plain", comment, url, "POST")
                .then(function (successMsg) {
                    resolve(successMsg);
                }, function (failMsg) {
                    reject(failMsg);
                });
        });
    }

    /**
     * @summary Move an item to the next stage.
     * @param pieceOfContentUuid the uuid of the piece of content created
     * @param comment
     * @return {Promise} a promise that the piece of content was changed
     *
     */
    moveToTheNextStage(pieceOfContentUuid, comment = 'Moved to the Next Stage (REST API)') {
        let url = "Item/" + pieceOfContentUuid + "/next-stage";
        return this.sendAction(url, comment);

    };

    moveToPreviousStage(pieceOfContentUuid, comment = 'Moved to the previous stage (REST API)') {
        let url = "Item/" + pieceOfContentUuid + "/previous-stage";
        return this.sendAction(url, comment);
    };


    approveItem(pieceOfContentUuid, comment = 'Approved Content (REST API)') {
        let url = "Item/" + pieceOfContentUuid + "/approve";
        return this.sendAction(url, comment);
    };

    rejectItem(pieceOfContentUuid, comment = 'Reject Content (REST API)') {
        let url = "Item/" + pieceOfContentUuid + "/reject";
        return this.sendAction(url, comment);
    };

    restartWorkflow(pieceOfContentUuid, comment = 'Restart Workflow (REST API)') {
        let url = "Item/" + pieceOfContentUuid + "/restart";
        return this.sendAction(url, comment);
    };

    submitForReview(pieceOfContentUuid, comment = 'Submitted for Review (REST API)') {
        let url = "Item/" + pieceOfContentUuid + "/submit-for-review";
        return this.sendAction(url, comment);
    };

    publishItem(pieceOfContentUuid, comment = 'Publish Item (REST API)') {
        let url = "Item/" + pieceOfContentUuid + "/publish";
        return this.sendAction(url, comment);
    };

    /**
     * @summary send all the data for updating the piece of content(files and images mainly)
     * @param data -  the data that will be piped to the next defered then instead of the data of the last deferred object
     * @return function(*): Promise<any> function with the injected data
     *
     */
    pipeData(data) {
        return function () {
            return Promise.resolve(data)
        }
    };

    /**
     * @summary Ajax call to create de new piece of content.
     * @return {Promise<any>} a promise that the data was sent
     *
     */
    createPieceOfContent() {
        return this.sendData('application/json', JSON.stringify(this.entryObject), 'Content', 'POST');
    };

    updatePieceOfContent() {
        let id = this.entryObject.entry.id.replace('wcmrest:', '');
        let contentId = this.pieceOfContentID ? this.pieceOfContentID : id;
        return this.sendData('application/json', JSON.stringify(this.entryObject), 'Content/' + contentId, 'PUT');
    };

    updateWCMItem(id, type, entry, vp) {
        if (vp) this.wcmRestPath = "/wps/contenthandler/" + vp + "!ut/p/wcmrest/";
        return this.sendData('application/json', JSON.stringify(entry), type + '/' + id, 'PUT');
    };


    setElementsArray(elements) {
        this.entryObject.entry.content.elements.element = Utils.cloneObject(elements, true);
    };

    /**
     * @summary create an ajax call that will send data to the wcm rest api
     * @param contentType the type of content that will be send to the rest api
     * @param data the data that will be sent to the rest api
     * @param url the url in which we will send the request
     * @param method in which we want to send the request
     * @return {Promise<any>} a promise that the data was sent
     *
     */
    sendData(contentType, data, url, method) {
        return HttpClient.makeRequest(url, {
            "headers": {
                "accept": "application/json",
                "content-type": contentType,
                "cache-control": "no-cache"
            },
            "xhrFields": {
                "withCredentials": true
            },
            "method": method,
            "contentType": contentType,
            "processData": false,
            "url": this.wcmRestPath + url,
            "data": data
        });
    };

    /**
     * @summary create an ajax call that will send data to the wcm rest api
     * @param contentType the type of content that will be send to the rest api
     * @param data the data that will be sent to the rest api
     * @param url the url in which we will send the request
     * @param method in which we want to send the request
     * @return {Promise<any>} a promise that the data was sent
     *
     */
    sendDataToRestApi(contentType, data, url, method) {
        HttpClient.makeRequest(url, {
            "headers": {
                "accept": "application/json",
                "content-type": contentType,
                "cache-control": "no-cache"
            },
            "xhrFields": {
                "withCredentials": true
            },
            "method": method,
            "contentType": contentType,
            "processData": false,
            "url": url,
            "data": data
        });
    };

    /**
     * @summary put in the owners array the id of the distinguished names
     * @return {Array<any>} a owners array
     *
     */
    generateOwnerArray() {
        let ownersArray = [];
        let length = this.approverDistinguishedName.length;
        for (let i = 0; i < length; i++) {
            let newUser = {
                "distinguishedName": this.approverDistinguishedName[i]
            };
            ownersArray.push(newUser);
        }
        return ownersArray;
    };

    /**
     * @summary create the function that request all the data of the authoring template
     * @param authoringTemplateUuid the uuid of the authoring template
     * @return {Promise<any>} a promise that will request all the data of the authoring template
     *
     */
    getDataFromAuthoringTemplate(authoringTemplateUuid) {
        let url = "ContentTemplate/" + authoringTemplateUuid + "/new-content";
        return this.sendData("application/json", {}, url, "GET")
    };

//TODO Document This

    getDataFromItem(itemUuid, itemType, vp) {
        if (vp) this.wcmRestPath = "/wps/contenthandler/" + vp + "!ut/p/wcmrest/";
        let url = itemType + "/" + itemUuid;
        return this.sendData("application/json", {}, url, "GET")
    };

    getDataFromPieceOfContent(pieceOfContentUID) {
        return this.getDataFromItem(pieceOfContentUID, "Content");
    };

    /**
     * @summary create the function that request all the data of the authoring template
     * @param elementsFromAuthoringTemplate the list of elements that the authorign template has with their corresponding default values
     *
     */
    processDataFromAuthoringTemplate(elementsFromAuthoringTemplate) {
        for (let element in elementsFromAuthoringTemplate.element) {
            if (elementsFromAuthoringTemplate.element.hasOwnProperty(element)) {
                switch (elementsFromAuthoringTemplate.element[element].type) {
                    case "ShortTextComponent":
                        this.authoringTemplateData[elementsFromAuthoringTemplate.element[element].name] = this.generateShortTextElementForWCM(elementsFromAuthoringTemplate.element[element].name, "", "", false, false);
                        break;
                    case "TextComponent":
                        this.authoringTemplateData[elementsFromAuthoringTemplate.element[element].name] = this.generateShortTextElementForWCM(elementsFromAuthoringTemplate.element[element].name, "", "", false, true);
                        break;
                    case "RichTextComponent":
                        this.authoringTemplateData[elementsFromAuthoringTemplate.element[element].name] = this.generateRichTextElementForWCM(elementsFromAuthoringTemplate.element[element].name, "", "");
                        break;
                    case "OptionSelectionComponent":
                        this.authoringTemplateData[elementsFromAuthoringTemplate.element[element].name] = this.generateOptionElementForWCM(elementsFromAuthoringTemplate.element[element].name, "", elementsFromAuthoringTemplate.element[element].data.optionselection.options.option);
                        break;
                    case "ImageComponent"://propertyName, base64value, title, imageType, imageName
                        this.authoringTemplateData[elementsFromAuthoringTemplate.element[element].name] = this.generateImageElementForWCM(elementsFromAuthoringTemplate.element[element].name, null, "", null, null);
                        break;
                    case "FileComponent"://propertyName, base64value, title, fileName, fileType
                        this.authoringTemplateData[elementsFromAuthoringTemplate.element[element].name] = this.generateFileElementForWCM(elementsFromAuthoringTemplate.element[element].name, null, "", null, null);
                        break;
                    case "ReferenceComponent":
                        this.authoringTemplateData[elementsFromAuthoringTemplate.element[element].name] = this.generateReferenceElementForWCM(elementsFromAuthoringTemplate.element[element].name, "", "");
                        break;
                    case "LinkComponent":
                        this.authoringTemplateData[elementsFromAuthoringTemplate.element[element].name] = this.generateLinkElementForWCM(elementsFromAuthoringTemplate.element[element].name, "", "");
                        break;
                }
            }
        }
    };

    /**
     * @summary create the function that request all the data of the authoring template
     * @param authoringTemplateUuid the uuid of the authoring template
     * @return Promise<any> promise that will request all the data of the authoirng template
     */
//TODO TO BE DEPRECATED
    getElementsFromAuthoringTemplate(authoringTemplateUuid) {
        return new Promise((resolve, reject) => {
            this.getDataFromAuthoringTemplate(authoringTemplateUuid)
                .then((data) => {
                    this.processDataFromAuthoringTemplate(data.entry.content.content.elements);
                    resolve(data);
                })
                .catch((msg) => {
                    reject(msg);
                })
        });
    };

    /**
     * @summary process the image and convert it to a buferr array
     * @param name - the name of the image
     * @param imageNode -  the node that contains the image and the metod toblob
     * @param fileType - the file type of the image
     * @return {Promise<any>} a promise that will process the image
     *
     */
    processImage(name, imageNode, fileType) {
        return new Promise(((resolve) => {

            if (typeof imageNode !== 'undefined') {
                let reader = new FileReader();

                let getBlob = (blob) => {
                    reader.onload = (event) => {
                        let result = event.target.hasOwnProperty('result') ? event.target.result : {};
                        resolve({"data": result, "name": name, "fileType": fileType});
                    };
                    reader.onerror = (error) => {
                        console.log(error);
                        resolve({"data": null, "name": name});
                    };

                    reader.readAsArrayBuffer(blob);
                };
                imageNode.toBlob(getBlob);
            }
            return resolve({"data": null, "name": name});
        }));
    };

    /**
     * @summary process the file and convert it to base64
     * @param name - the name of the file
     * @param fileNode - the node that contain the file
     * @return {Promise<any>} a promise that will process the image
     *
     */
    processFile(name, fileNode) {
        return new Promise(((resolve) => {
            if (typeof fileNode !== 'undefined') {
                if (fileNode.files.length > 0) {
                    let reader = new FileReader();
                    reader.onload = (event) => {
                        let data = event.target.hasOwnProperty('result') ? event.target.result.split(",")[1] : null;
                        resolve({
                            "data": data,
                            "name": name,
                            "type": fileNode.files[0].type,
                            "fileName": fileNode.files[0].name
                        });
                    };

                    reader.onerror = () => {
                        console.log(error);
                        resolve({"data": null, "name": name, "type": ""});
                    };

                    reader.readAsDataURL(fileNode.files[0]);
                }
            }
            resolve({"data": null, "name": name, "type": ""});
        }));
    };

    createForm(elements, $formWrapper, $fieldWrapper) {
        let $container = DOMUtils.createElement("form", {className: 'newPieceOfContentForm'});
        let $fieldSet = $formWrapper ? $formWrapper : DOMUtils.createElement("fieldset");
        if (!Utils.isEmpty(elements)) {
            for (let element in elements) {
                if (elements.hasOwnProperty(element)) {
                    if (elements[element].hasOwnProperty('wcmType') && typeof elements[element]['wcmType'] === "string") {
                        let $elementWraper = $fieldWrapper ? $fieldWrapper : DOMUtils.createElement("div");
                        let $element;
                        switch (elements[element]['wcmType']) {
                            case "ShortTextComponent":
                            case "TextComponent":
                            case "RichTextComponent":
                            case "ImageComponent":
                            case "FileComponent":
                            case "ReferenceComponent"://need to check how to create elements of reference component
                            case "LinkComponent"://need to check how to create elements of reference component
                                $element = elements[element]['$domElement'] ? elements[element]['$domElement'] : DOMUtils.createElement("input", {type: 'text'});
                                DOMUtils.assignAttributes($element, elements[element]);
                                $elementWraper.appendChild($element);
                                break;
                            case "OptionComponent":
                                $element = elements[element]['$domElement'] ? elements[element]['$domElement'] : DOMUtils.createElement("select");
                                DOMUtils.assignAttributes($element, elements[element]);
                                $elementWraper.appendChild($element);
                                break;
                        }
                        $fieldSet.appendChild($elementWraper);
                    }
                }
            }
        }
        $container.appendChild($fieldSet);
        return $container;
    };

    generateOptionsDomElement($domElement, element) {
        let selected = false;
        for (let i = 0; i < element.options.length; i++) {
            selected = !!element.options[i].selected;

            $domElement.appendChild(DOMUtils.createElement('option', {
                value: element.options[i].key,
                selected: selected
            }, element.options[i].value));
        }
        return $domElement;
    };


    addAttributes($domElement, element) {
        if (element.id) {
            $domElement.attr("id", element.id);
        }
        if (element.class) {
            if (element.class.length) {
                let classes = [];
                for (let i = 0; i < element.class.length; i++) {
                    classes.push(element.class[i]);
                }
                $domElement.attr("class", element.class.join(" "));
            }
        }
        if (element.hasOwnProperty('xWidgetData')) {
            //TODO: find how to integrate with xWidget and not jQuery depended
            //this.executeXWidget(element.hasXWidget.xWidgetObject, element.hasXWidget.callbackData, element.hasXWidget.contextBinded);
        }

        if (element.hasOwnProperty('dataAttributesForDomElement')) {
            for (let i = 0; i < element.dataAttributesForDomElement.length; i++) {
                $domElement.attr("data-" + element.dataAttributesForDomElement[i]["dataName"], element.dataAttributesForDomElement[i]["dataValue"]);
            }
        }
        //all elements must have the unique name attribute
        $domElement.attr("data-name", element.name);
        return $domElement;
    };

    executeXWidget(xWidgetObject, callbackData, context) {
        /*if (typeof context === "undefined") {
            context = this;
        }
        let dinamicDefferreds = $.when(xWidgetObject.render());
        for (let i = 0; i < callbackData.length; i++) {
            dinamicDefferreds = dinamicDefferreds.then(WCMRESTAPI.pipeData(callbackData["data"])).then(callbackData["callback"]).bind(context);
        }
*/
    };

//TODO END: REFACTOR OR DEPRECATE SINCE THERE IS FUNCTIONALITY OUT OF WCM REST API
    /**
     * Retrieve the List of elements from the current entry object
     * **/
//TODO: CREATE THE DOC FOR THIS AND ADD ALL THE TYPES
    updateElementFromPieceOfContent(pieceOfContentUUID, elementName, elementType, newValue, virtualPortal) {
        virtualPortal = typeof virtualPortal !== 'undefined' ? virtualPortal : '';
        let wcmRestPath = '/wps/contenthandler/' + virtualPortal + '/!ut/p/wcmrest/';

        if (!pieceOfContentUUID) {
            console.error('The piece of content UUID is mandatory');
            return;
        }

        if (!elementName) {
            console.error('You need to specify the element name.');
            return;
        }

        if (!elementType) {
            console.error('Element type must be specified');
            return;
        }

        if (typeof newValue === 'undefined') {
            console.error('You need to specify a new value. Undefined found.');
            return;
        }

        let entryObject = {
            entry: {}
        };

        switch (elementType) {
            case 'ShortTextComponent':
            case 'TextComponent':
                entryObject.entry.content = {
                    type: 'text/plain',
                    value: newValue
                };
                break;
            case 'HTMLComponent':
            case 'RichTextComponent':
            case 'ReferenceComponent':
            case 'DateComponent':
            case 'ImageComponent':
            case 'FileComponent':
            case 'JSPComponent':
            case 'LinkComponent':
            case 'NumericComponent':
            case 'UserSelectionComponent':
            case 'OptionSelectionComponent':
            default:
                console.log('The type "' + type + '" is not supported yet.');
                break;
        }

        return this.sendDataToRestApi('application/json', JSON.stringify(entryObject), wcmRestPath + 'Content/' + pieceOfContentUUID + '/elements/' + elementName, 'PUT');


    };

    setParent(uuid) {
        let link = this.entryObject.entry.link;
        let parent = this.getLinkElementByName('parent', this.entryObject);
        if (parent) {
            parent.href = this.wcmRestPath + '/item/' + uuid;
        } else {
            link.push({
                rel: 'parent',
                href: this.wcmRestPath + '/item/' + uuid
            });
        }
    };

    addCategory(uuid) {
        if (!this.entryObject.entry.profile.category) {
            this.entryObject.entry.profile.category = [];
        }
        let categoriesArray = this.entryObject.entry.profile.category ? this.entryObject.entry.profile.category : [];
        let length = categoriesArray.length;
        for (let i = 0; i < length; i++) {
            if (categoriesArray[i].indexOf(uuid) >= 0) {
                return;
            }
        }

        categoriesArray.push(this.wcmRestPath + '/Category/' + uuid);

    };


    setWorkFlow(uuid) {
        let link = this.entryObject.entry.link;
        let workflow = this.getLinkElementByName('workflow', this.entryObject);
        if (workflow) {
            workflow.href = this.wcmRestPath + '/item/' + uuid;
        } else {
            link.push({
                rel: 'workflow',
                href: this.wcmRestPath + '/item/' + uuid
            });
        }
    };

    getLinkElementByName(name, object) {
        if (!object.entry.hasOwnProperty('link')) return;
        let linkObject = object.entry.link;
        let length = linkObject.length;
        for (let i = 0; i < length; i++) {
            let objectName = linkObject[i].rel;
            if (objectName === name) {
                return linkObject[i];
            }
        }

    };

    /* UPDATE SECTION */

    /* Add New Elements */
    addNewElement(elementName, type, title, options) {
        let elements = this.entryObject.entry.content.content.elements.element;
        let newObject;
        switch (type) {
            case 'ShortTextComponent':
                newObject = this.createShortTextComponentElement(elementName, title);
                break;
            case 'TextComponent':
                newObject = this.createTextComponentElement(elementName, title);
                break;
            case 'HTMLComponent':
                newObject = this.createHTMLComponentElement(elementName, title);
                break;
            case 'RichTextComponent':
                newObject = this.createRichTextComponentElement(elementName, title);
                break;
            case 'ReferenceComponent':
                newObject = this.createComponentReferenceElement(elementName, title);
                break;
            case 'DateComponent':
                newObject = this.createDateComponentElement(elementName, title);
                break;
            case 'ImageComponent':
                newObject = this.createImageComponentElement(elementName, title);
                break;
            case 'FileComponent':
                newObject = this.createFileComponentElement(elementName, title);
                break;
            case 'JSPComponent':
                newObject = this.createJSPComponentElement(elementName, title);
                break;
            case 'LinkComponent':
                newObject = this.createLinkComponentElement(elementName, title);
                break;
            case 'NumericComponent':
                newObject = this.createShortTextComponentElement(elementName, title);
                break;
            case 'UserSelectionComponent':
                newObject = this.createUserSelectionElement(elementName, title);
                break;
            case 'OptionSelectionComponent':
                //newObject = this.createShortTextComponentElement( elementName, title );
                //newObject = this.createOptionSelectionComponentElement( elementName, title, options );
                //break;
                console.log('Option Selection will be stored as text');
                newObject = this.createShortTextComponentElement(elementName, title);
            default:
                console.log('The type "' + type + '" is not supported yet.');
                break;
        }


        if (newObject) {
            elements.push(newObject);
        }


    };

    createOptionSelectionComponentElement(elementName, title, options) {
        if (!options) return;
        let optionsArray = [];
        for (let i = 0, length = options.length; i < length; i++) {
            optionsArray.push({
                id: options.value,
                value: options.name,
                selected: false
            });
        }

        return {
            "name": elementName,
            "title": {
                "lang": "en",
                "value": title
            },
            "type": "OptionSelectionComponent",
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "optionselection": {
                    "displaytype": "CheckboxesOrRadioButtons",
                    "selection": "UserDefined",
                    "options": {
                        "mode": "Singleselect",
                        "option": optionsArray
                    }
                }
            }
        };
    };

    createComponentReferenceElement(elementName, title) {
        return {
            "name": elementName,
            "title": {
                "value": title ? title : elementName
            },
            "type": "ReferenceComponent",
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "reference": ""
            }
        };
    };

    createDateComponentElement(elementName, title) {
        return {
            "name": elementName,
            "title": {
                "value": title ? title : elementName
            },
            "type": "DateComponent",
            "data": {
                "type": "application/vnd.ibm.wcm+xml"
            }
        };
    };

    createFileComponentElement(elementName, title) {
        return {
            "name": elementName,
            "title": {
                "value": title ? title : elementName
            },
            "type": "FileComponent",
            "data": {
                "type": "application/vnd.ibm.wcm+xml"
            }
        };
    };

    createHTMLComponentElement(elementName, title) {
        return {
            "name": elementName,
            "title": {
                "value": title ? title : elementName
            },
            "type": "HTMLComponent",
            "data": {
                "type": "text/html",
                "value": ""
            }
        };
    };

    createImageComponentElement(elementName, title) {
        return {
            "name": elementName,
            "title": {
                "value": title ? title : elementName
            },
            "type": "ImageComponent",
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "image": {
                    "dimension": {
                        "height": "",
                        "width": "",
                        "border": "0"
                    },
                    "altText": "",
                    "tagName": ""
                }
            }
        };
    };

    createJSPComponentElement(elementName, title) {
        return {
            "name": elementName,
            "title": {
                "value": title ? title : elementName
            },
            "type": "JSPComponent",
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "jsp": {
                    "path": ""
                }
            }
        };
    };

    createLinkComponentElement(elementName, title) {
        return {
            "name": elementName,
            "title": {
                "value": title ? title : elementName
            },
            "type": "LinkComponent",
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "linkElement": {
                    "destination": {
                        "type": "external",
                        "allowClear": false,
                        "value": ""
                    },
                    "display": {
                        "type": "title"
                    },
                    "description": {
                        "useDestination": false,
                        "value": ""
                    },
                    "target": "None",
                    "additionalAttributes": ""
                }
            }
        };
    };

    createRichTextComponentElement(elementName, title) {
        return {
            "name": elementName,
            "title": {
                "value": title ? title : elementName
            },
            "type": "RichTextComponent",
            "data": {
                "type": "text/html",
                "value": ""
            }
        };
    };

    createShortTextComponentElement(elementName, title) {
        return {
            "name": elementName,
            "title": {
                "value": title ? title : elementName
            },
            "type": "ShortTextComponent",
            "data": {
                "type": "text/plain",
                "value": ""
            }
        };
    };

    createTextComponentElement(elementName, title) {
        return {
            "name": elementName,
            "title": {
                "value": title ? title : elementName
            },
            "type": "TextComponent",
            "data": {
                "type": "text/plain",
                "value": ""
            }
        };
    };

    createUserSelectionElement(elementName, title) {
        return {
            "name": elementName,
            "title": {
                "value": title ? title : elementName
            },
            "type": "UserSelectionComponent",
            "data": {
                "type": "application/vnd.ibm.wcm+xml",
                "userSelection": {}
            }
        };
    };


    getElementValueByName(name) {
        if (!name) return;

        let elements = [];

        try {
            elements = this.entryObject.entry.content.content.elements.element;
        } catch (e) {
            console.error(e);
        }

        let length = elements.length;

        for (let i = 0; i < length; i++) {
            let item = elements[i];
            if (item.name === name) {
                return item;
            }
        }

    };

    getElementValue(element) {
        switch (element.type) {
            case 'ShortTextComponent':
            case 'TextComponent':
                return element.data.value;
            case 'RichTextComponent':
            case 'HTMLComponent':
                return this.htmlEncode(element.data.value);
            case 'ReferenceComponent':
                return element.data.reference;
            case 'DateComponent':
                return element.data.date ? element.data.date.value : undefined;
            case 'ImageComponent':
                return element.data;
            //return element.data.image.resourceUri ? element.data.image.resourceUri.value : '';
            case 'FileComponent':
                return element.data;
            //return element.data.resourceUri ? element.data.resourceUri.value : '';
            case 'JSPComponent':
                return element.data.jsp.path;
            case 'LinkComponent':
                return element.data.linkElement.destination.value;
            case 'NumericComponent':
                return element.data.double;
            case 'UserSelectionComponent':
                console.log(element);
                return element.data.userSelection.user;
            case 'OptionSelectionComponent':
                return element.data.optionselection.options.option;
            default:
                console.log('The type "' + element.type + '" is not supported yet.');
                return '';
        }
    };

    htmlEncode(value) {
        const auxElement = DOMUtils.createElement('div');
        auxElement.innerText = value;
        return auxElement.innerHTML;
    };

    htmlDecode(value) {
        const auxElement = DOMUtils.createElement('div');
        auxElement.innerHTML = value;
        return auxElement.innerText;
    };

}

export {WCMRestAPI};



