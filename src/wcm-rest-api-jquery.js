(function( $ ) {
	var BASE22 = window.BASE22 || {};
	// Expose object
	if( typeof window.BASE22 === 'undefined' ) {
		window.BASE22 = BASE22;
	}

	BASE22.WCMRESTAPI = (function() {
		function WCMRESTAPI() {
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
		 * Initialize the api with the config given in order to create pieces of content
		 *
		 * @param  config   an object that contains all the specifications of the entry object that will be created:
		 wcmRestPath : the path for the wcm to create the content, if itÂ´s a project or not
		 contentTemplateID: authoring template uuid
		 parentID: site area uuid
		 virtualPortal : Virtual Portal Name
		 workflowID : workflow uuid
		 categoriesIDArray : all the categories uuidÂ´s to be tagged to the piece of content
		 approverDistinguishedName : approvers uuidÂ´s
		 userID : the user uuid to publish the piece of content
		 projectID : project uuid
		 projectName : project name
		 */
		WCMRESTAPI.prototype.initForCreation = function( config ) {
			var deferred = $.Deferred();
			this.virtualPortal = typeof config.virtualPortal === 'undefined' || config.virtualPortal === '' ? '' : config.virtualPortal + '/';
			this.wcmRestPath = window.location.href.indexOf( '$project' ) < 0 ? "/wps/contenthandler/" + this.virtualPortal + "!ut/p/wcmrest/" : "/wps/contenthandler/" + this.virtualPortal + "$project/" + config.projectName + "/!ut/p/wcmrest/";
			this.contentTemplateID = typeof config.contentTemplateID !== 'undefined' ? config.contentTemplateID : null;
			this.parentID = typeof config.parentID !== 'undefined' ? config.parentID : null;
			this.workflowID = typeof config.workflowID !== 'undefined' ? config.workflowID : null;
			this.categoriesIDArray = typeof config.categoriesIDArray !== 'undefined' ? config.categoriesIDArray : [];
			this.approverDistinguishedName = typeof config.approverDistinguishedName !== 'undefined' ? config.approverDistinguishedName : [];
			this.userID = typeof config.userID !== 'undefined' ? config.userID : null;
			this.projectID = typeof config.projectID !== 'undefined' ? config.projectID : null;
			this.authoringTemplateRestricted = typeof config.authoringTemplateRestricted !== 'undefined' ? config.authoringTemplateRestricted : false;

			if( ! this.contentTemplateID ) {
				console.error( 'In order to create a new piece of content you must specify a Content Template' );
				deferred.reject( 'In order to create a new piece of content you must specify a Content Template' );
			}

			var _this = this;
			this.getDataFromAuthoringTemplate( this.contentTemplateID ).then( function( response ) {
				_this.entryObject = $.extend( true, {}, response );

				_this.updateLinkElement( 'parent', _this.parentID );
				_this.updateLinkElement( 'workflow', _this.workflowID );
				_this.updateLinkElement( 'project', _this.projectID );

				deferred.resolve( response );
			}, function( error ) {
				deferred.reject( error );
			} );

			return deferred.promise();
		};
		//TODO DOCUMENT THIS
		WCMRESTAPI.prototype.initForUpdate = function( config ) {
			var deferred = $.Deferred();
			this.virtualPortal = typeof config.virtualPortal === 'undefined' || config.virtualPortal === '' ? '' : config.virtualPortal + '/';
			this.wcmRestPath = window.location.href.indexOf( '$project' ) < 0 ? "/wps/contenthandler/" + this.virtualPortal + "!ut/p/wcmrest/" : "/wps/contenthandler/" + this.virtualPortal + "$project/" + config.projectName + "/!ut/p/wcmrest/";
			this.pieceOfContentID = typeof config.pieceOfContentID !== 'undefined' ? config.pieceOfContentID : null;

			if( ! this.pieceOfContentID ) {
				console.error( 'In order to update a piece of content you must specify the Content UID' );
				deferred.reject( 'In order to update a piece of content you must specify the Content UID' );
			}

			var _this = this;
			this.getDataFromPieceOfContent( this.pieceOfContentID ).then( function( response ) {
				_this.entryObject = $.extend( true, {}, response );
				deferred.resolve( response );
			}, function( error ) {
				deferred.reject( error );
			} );

			return deferred.promise();

		};
		/**
		 * Used to get a copy of the entry object.
		 */
		WCMRESTAPI.prototype.getEntryObject = function() {
			return $.extend( true, {}, this.entryObject );
		};

		WCMRESTAPI.prototype.setEntryObject = function( entry ) {
			this.entryObject = $.extend( true, {}, entry );
		};
		/**
		 * Set the new content property value by name.
		 * @param {string} property - The property to set the new value.
		 * @param {string} value - The value to set.
		 */
		WCMRESTAPI.prototype.setPropertyValueByName = function( property, value ) {
			switch( property ) {
				case "name":
					this.entryObject.entry.name = value;
					break;
				case "title":
					this.entryObject.entry.title = { lang: "en", value: value };
					break;
				case "description" :
					this.entryObject.entry.summary = { lang: "en", value: value };
					break;
				default:
					console.log( 'The property "' + property + '" is not supported yet' );
			}
		};
		/**
		 * Set the skeleton element value by Name.
		 * @param {string} name - The element name in the authoring template to set.
		 * @param {string} value - The value to set.
		 */




		WCMRESTAPI.prototype.setElementValueByName = function( name, value, extra ) {
			var elements = this.entryObject.entry.content.content.elements.element;
			//var value = $.isArray( value ) ? value.toString() : value;
			var length = elements.length;
			var found = false;
			for( var i = 0; i < length; i ++ ) {
				if( elements[ i ].name === name ) {
					var type = elements[ i ].type;
					this.setElementValueByType( elements[ i ], type, value, extra );
					found = true;
					return 0;
				}
			}

			if( ! found && ! this.authoringTemplateRestricted ) {
				console.warn( 'Element ' + name + ' does not exist on the Authoring Template' );
				return - 1;
				//var newElement = this.generateShortTextElementForWCM( name, value, name );
				//elements.push( newElement );
			}

		};
		/**
		 * Set the value of an element value based in it's type.
		 * @param {string} element - The element to set the new value.
		 * @param {string} type - The element type.
		 * @param {string|object} value - The value to set. String in case of ShortText,Text and RichtText, object in case of optionSelection.
		 */
		WCMRESTAPI.prototype.setElementValueByType = function( element, type, value, extra ) {
			if( element.data && element.data.hasOwnProperty( 'elementName' ) ) {
				delete element.data.elementName;
			}
			switch( type ) {
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

					if( ! value ) {
						delete element.data.date.value;
					}
					break;
				case 'ImageComponent':
					if( $.isEmptyObject( value ) ) {
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
					if( value.hasOwnProperty( 'image' ) ) {
						element.data = value;
					} else {
						element.data.image.binaryresource = value;
						if( element.data.image.hasOwnProperty( 'resourceUri' ) ) {
							delete element.data.image.resourceUri;
						}
					}

					if( element.data && element.data.elementName ) {
						delete element.data.elementName;
					}
					break;
				case 'FileComponent':
					if( value.hasOwnProperty( 'resourceUri' ) ) {
						element.data = value;
					} else {
						element.data.binaryresource = value;
						if( element.data.hasOwnProperty( 'resourceUri' ) ) {
							delete element.data.resourceUri;
						}
					}

					if( element.data && element.data.elementName ) {
						delete element.data.elementName;
					}
					break;
				case 'JSPComponent':
					element.data.jsp.path = value;
					if( typeof extra !== 'undefined' ) element.data.jsp.errorMessage = extra;
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
					var options = element.data.optionselection.options.option;
					var mode = element.data.optionselection.options.mode;
					var selection = element.data.optionselection.selection;

					if( selection !== 'UnrestrictedCategory' && ! options ) break;

					if( selection === 'UnrestrictedCategory' ) {
						element.data.optionselection.options.option = [];
					}

					options = element.data.optionselection.options.option;

					var length = element.data.optionselection.options.option.length;

					var newValue = [];

					for( var m = 0; m < length; m ++ ) {
						options[ m ].selected = false;
					}


					if( ! $.isArray( value ) ) {
						newValue.push( $.extend( true, [], value ) );
					} else {
						newValue = $.extend( true, [], value );
					}

					var valuesLength = newValue.length;


					for( var j = 0; j < valuesLength; j ++ ) {
						if( newValue[ j ].hasOwnProperty( 'namePath' ) ) delete newValue[ j ].id;

						var found = false;
						for( var i = 0; i < length; i ++ ) {
							if( element.data.optionselection.options.option[ i ].value !== newValue[ j ].value ) {
								if( mode === 'Singleselect' ) element.data.optionselection.options.option[ i ].selected = false;
								continue;
							}
							found = true;
							element.data.optionselection.options.option[ i ].selected = true;
						}

						if( ! found ) {
							var optionSelected = {};
							optionSelected.selected = true;
							if( typeof newValue[ j ].category !== 'undefined' )
								optionSelected.category = this.wcmRestPath + 'Category/' + newValue[ j ].category;
							if( typeof newValue[ j ].id !== 'undefined' )
								optionSelected.id = newValue[ j ].id;

							if( newValue[ j ].value ) {
								optionSelected.value = newValue[ j ].value;
							}
							element.data.optionselection.options.option.push( optionSelected );
						}
					}

					if( valuesLength === 0 ) {
						for( var k = 0; k < length; k ++ ) {
							element.data.optionselection.options.option[ k ].selected = false;
						}
					}


					break;
				default:
					console.log( 'The type "' + type + '" is not supported yet.' );
					break;
			}
		};
		WCMRESTAPI.prototype.deleteElementByName = function( name ) {
			var elements = this.entryObject.entry.content.content.elements.element;
			for( var i = elements.length - 1; i >= 0; i -- ) {
				var elementName = elements[ i ].name;
				if( elementName === name ) {
					elements.splice( i, 1 );
					return;
				}
			}
		};
		/**
		 * converts all the data that is on the authoringTemplateData object to element list to send it to WCM
		 * @return  elementList of the piece of content
		 */
		WCMRESTAPI.prototype.convertAuthoringTemplateDataToElementArray = function() {
			var elementList = [];
			for( var element in this.authoringTemplateData ) {
				elementList.push( this.authoringTemplateData[ element ] );
			}
			return elementList;
		};
		/**
		 * Append an element to the Link object.
		 * @param  rel     the type of the link element (parent, project, workflow, contentTemplate....)
		 * @param  uid    the uid of the link element
		 * @return  element the element added
		 */
		WCMRESTAPI.prototype.updateLinkElement = function( rel, uid ) {

			if( ! uid ) return;

			var element = {
				rel: rel,
				href: this.wcmRestPath + 'item/' + uid
			};


			//Update if exists, append if it's not
			var length = this.entryObject.entry.link.length;
			var linkArray = this.entryObject.entry.link;

			for( var i = 0; i < length; i ++ ) {
				if( linkArray[ i ].rel === rel ) {
					linkArray[ i ] = element;
					return element;
				}
			}

			//Not exist
			this.entryObject.entry.link.push( element );
			return element;
		};
		/**
		 * create the JSON object to be sent to wcm
		 *
		 * @param  name     the name that the piece of content will have
		 * @param  arrayElements  array that contains all the elements for the wcm
		 * @param  customID  customId if they want the unique name to have that customID
		 * @return the jsonEntry for the wcm
		 */
		WCMRESTAPI.prototype.createJSONDataForWCM = function( name, arrayElements, customID ) {
			this.uniqueName = typeof customID === 'undefined' ? this.formatName( name ) + '-' + this.generateUUID() : customID;
			var jsonEntry = {
				"entry": {
					"title": { "lang": "en", "value": name },
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

			if( this.projectID ) {
				jsonEntry.entry.link.push( {
					"rel": "project",
					"href": this.wcmRestPath + 'Project/' + this.projectID
				} );
			}

			return jsonEntry
		};
		/**
		 * concatenate and calculate four random numbers for the uuid
		 *
		 * @return random and "unique" uuid
		 */
		WCMRESTAPI.prototype.generateUUID = function() {
			function s4() {
				return Math.floor( (1 + Math.random()) * 0x10000 ).toString( 16 ).substring( 1 );
			}

			return s4() + s4() + "-" + s4() + "-" + s4();
		};
		/**
		 * concatenate and calculate four random numbers for the uuid
		 *
		 * @param name the name given to the piece of content
		 * @return the name replacing all empty spaces and removing all non alpha numeric characters
		 */
		WCMRESTAPI.prototype.formatName = function( name ) {
			return name.replace( /\s/g, '-' ).replace( /[^0-9a-zA-Z\-]/g, '' ).toLowerCase();
		};
		/**
		 * generate workflow href
		 *
		 * @return the workflow href
		 *
		 */
		WCMRESTAPI.prototype.generateWorkflowHref = function() {
			return this.wcmRestPath + 'item/' + this.workflowID;
		};
		/**
		 * push all the categories uuid the the categories array with the full path of the categorie
		 *
		 * @return the categories array
		 *
		 */
		WCMRESTAPI.prototype.generateCategoriesArray = function() {
			var categoriesArray = [];
			var length = this.categoriesIDArray.length;
			for( var i = 0; i < length; i ++ ) {
				categoriesArray.push( this.wcmRestPath + 'Category/' + this.categoriesIDArray[ i ] );
			}
			return categoriesArray;
		};
		//TODO need to check this method to function properly
		/**
		 * create the object of the links element
		 *
		 * @param propertyName the name of this element
		 * @param destination the destination of the link
		 * @param title the tile por the element
		 * @return the link object for wcm
		 *
		 */
		WCMRESTAPI.prototype.generateLinkElementForWCM = function( propertyName, destination, title ) {
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
		 * create the object for file element
		 *
		 * @param propertyName the name of this element
		 * @param base64value the value
		 * @param title the destination of the link
		 * @param fileName the destination of the link
		 * @param fileType the destination of the link
		 *
		 * @return the file element object for wcm
		 *
		 */
		WCMRESTAPI.prototype.generateFileElementForWCM = function( propertyName, base64value, title, fileName, fileType ) {
			var data = {
				"name": propertyName,
				"type": "FileComponent",
				"title": title,
				"data": {
					"type": "application/vnd.ibm.wcm+xml",
					"binaryresource": {}
				}
			};
			if( typeof base64value !== 'undefined' && base64value !== null ) {
				data.data.binaryresource = {
					"type": typeof fileType === 'undefined' ? 'image/jpg' : fileType,
					"fileName": typeof fileName === 'undefined' ? '' : fileName,
					"value": base64value
				};
			}

			return data;
		};
		/**
		 * create the object for Image element
		 *
		 * @param propertyName the name of this element
		 * @param base64value the value
		 * @param title the destination of the link
		 * @param imageType the image type
		 * @param imageName the image name
		 *
		 * @return the file element object for wcm
		 *
		 */
		WCMRESTAPI.prototype.generateImageElementForWCM = function( propertyName, base64value, title, imageType, imageName ) {
			var data = {
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

			if( typeof base64value !== 'undefined' && base64value !== null ) {
				data.data.image.fileName = typeof imageName !== 'undefined' ? '' : imageName;
				data.data.image.resourceUri = {
					"type": imageType,
					"value": base64value
				};
			}

			return data;
		};
		/**
		 * create the object for short text element
		 *
		 * @param propertyName the name of this element
		 * @param value the value of the element
		 * @param title the title of the short or text component
		 * @param update if itÂ´s an update element or for create
		 * @param textComponent flag to know if itÂ´s a text component
		 *
		 * @return the file element object for wcm
		 *
		 */
		WCMRESTAPI.prototype.generateShortTextElementForWCM = function( propertyName, value, title, update, textComponent ) {
			var type = typeof textComponent !== 'undefined' && textComponent ? "TextComponent" : "ShortTextComponent";
			var object = {
				"name": propertyName,
				"type": type,
				"title": typeof title === 'undefined' ? '' : title
			};

			if( typeof update !== 'undefined' && update ) {
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
		 * create the object for rich text element
		 *
		 * @param propertyName the name of this element
		 * @param value the value of the element
		 * @param title the title of the component
		 *
		 * @return the file element object for wcm
		 *
		 */
		WCMRESTAPI.prototype.generateRichTextElementForWCM = function( propertyName, value, title ) {
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
		 * create the object for date element
		 *
		 * @param propertyName the name of this element
		 * @param value the value of the element
		 * @param title the title of the component
		 *
		 * @return the file element object for wcm
		 *
		 */
		WCMRESTAPI.prototype.generateDateElementForWCM = function( propertyName, value, title ) {
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
		 * create the object for option selection element
		 *
		 * @param propertyName the name of this element
		 * @param value the value of the element
		 * @param title the title of the component
		 * @param options the set of options to send to wcm
		 * @param multiSelect flag to know if the selection uas multiselect
		 *
		 * @return the file element object for wcm
		 *
		 */
		WCMRESTAPI.prototype.generateOptionElementForWCM = function( propertyName, title, options, multiSelect ) {
			var optionMode = multiSelect === true ? "Multiselect" : "Singleselect";
			var options = $.map( options, function( node ) {
				return {
					"selected": node.selected,
					"id": node.id,
					"value": node.value,
					"category": node.category
				};
			} );
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
		 * create the object for file element
		 *
		 * @param propertyName the name of this element
		 * @param title the title of the component
		 * @param uid the component uid value
		 *
		 * @return the reference element object for wcm
		 *
		 */
		WCMRESTAPI.prototype.generateReferenceElementForWCM = function( propertyName, title, uid ) {
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
		 * send all the data to the wcm through the rest api
		 *
		 * @param firstRoundData the data that will be send in the first piece of content skeleton to the wcm
		 * @param secondRoundData all the files and images that will update the piece of content created by the firstRoundData
		 * @param baseUrl the domain that will send the data
		 * @param successFunctionForSkeleton the function that will be executed when the piece of content is created with the skeleton data
		 * @param successFunctionForFilesAndImagesWhenTheyAreCreating the funciton that will be executed when an image or a file is created
		 * @param successFunctionForFilesAndImages the the function that will be executed when all the images and files are created
		 * @param successFunctionForPublishPieceOfContent the function that will be executed when the piece of content is executed
		 * @param errorFunctionForSkeleton the function that will be executed when there is an error creating the piece of content skeleton
		 * @param errorFunctionForFilesAndImages the funciton that will be executed when and image or file failed to update the piece of content
		 * @param errorFunctionForPublishPieceOfContent the function that will be executed when publishing the piece of content
		 *
		 * @return a promise that all the content will be created and updated in the correct way
		 *
		 */
		/**
		 * Move an item to the next stage.
		 *
		 * @param pieceOfContentUuid the uuid of the piece of content created
		 *
		 * @return a promise that the piece of content was changed
		 *
		 */
		WCMRESTAPI.prototype.moveToTheNextStage = function( pieceOfContentUuid, comment ) {
			var defered = $.Deferred();
			var url = "Item/" + pieceOfContentUuid + "/next-stage";
			this.sendData( "text/plain", comment ? comment : 'Moved to the Next Stage (REST API)', url, "POST" ).then( function( successMsg ) {
				defered.resolve( successMsg );
			}, function( failMsg ) {
				defered.reject( failMsg );
			} );
			return defered.promise();
		};

		WCMRESTAPI.prototype.moveToPreviousStage = function( pieceOfContentUuid, comment ) {
			var defered = $.Deferred();
			var url = "Item/" + pieceOfContentUuid + "/previous-stage";
			this.sendData( "text/plain", comment ? comment : 'Moved to the previous stage (REST API)', url, "POST" ).then( function( successMsg ) {
				defered.resolve( successMsg );
			}, function( failMsg ) {
				defered.reject( failMsg );
			} );
			return defered.promise();
		};


		WCMRESTAPI.prototype.approveItem = function( pieceOfContentUuid, comment ) {
			var defered = $.Deferred();
			var url = "Item/" + pieceOfContentUuid + "/approve";
			this.sendData( "text/plain", comment ? comment : 'Approved Content (REST API)', url, "POST" ).then( function( successMsg ) {
				defered.resolve( successMsg );
			}, function( failMsg ) {
				defered.reject( failMsg );
			} );
			return defered.promise();
		};

		WCMRESTAPI.prototype.rejectItem = function( pieceOfContentUuid, comment ) {
			var defered = $.Deferred();
			var url = "Item/" + pieceOfContentUuid + "/reject";
			this.sendData( "text/plain", comment ? comment : 'Reject Content (REST API)', url, "POST" ).then( function( successMsg ) {
				defered.resolve( successMsg );
			}, function( failMsg ) {
				defered.reject( failMsg );
			} );
			return defered.promise();
		};

		WCMRESTAPI.prototype.restartWorkflow = function( pieceOfContentUuid, comment ) {
			var defered = $.Deferred();
			var url = "Item/" + pieceOfContentUuid + "/restart";
			this.sendData( "text/plain", comment ? comment : 'Restart Workflow (REST API)', url, "POST" ).then( function( successMsg ) {
				defered.resolve( successMsg );
			}, function( failMsg ) {
				defered.reject( failMsg );
			} );
			return defered.promise();
		};

		WCMRESTAPI.prototype.submitForReview = function( pieceOfContentUuid, comment ) {
			var defered = $.Deferred();
			var url = "Item/" + pieceOfContentUuid + "/submit-for-review";
			this.sendData( "text/plain", comment ? comment : 'Submitted for Review (REST API)', url, "POST" ).then( function( successMsg ) {
				defered.resolve( successMsg );
			}, function( failMsg ) {
				defered.reject( failMsg );
			} );
			return defered.promise();
		};

		WCMRESTAPI.prototype.publishItem = function( pieceOfContentUuid, comment ) {
			var defered = $.Deferred();
			var url = "Item/" + pieceOfContentUuid + "/publish";
			this.sendData( "text/plain", comment ? comment : 'Publish Item (REST API)', url, "POST" ).then( function( successMsg ) {
				defered.resolve( successMsg );
			}, function( failMsg ) {
				defered.reject( failMsg );
			} );
			return defered.promise();
		};

		/**
		 * send all the data for updating the piece of content(files and images mainly)
		 *
		 * @param data the data that will be piped to the next defered then instead of the data of the last deferred object
		 *
		 * @return a function with the injected data
		 *
		 */
		WCMRESTAPI.pipeData = function( data ) {
			return function( obj ) {
				return $.Deferred().resolve( data ).promise();
			}
		};
		/**
		 * Ajax call to create de new piece of content.
		 *
		 * @return a promise that the data was sent
		 *
		 */
		WCMRESTAPI.prototype.createPieceOfContent = function() {
			return this.sendData( 'application/json', JSON.stringify( this.entryObject ), 'Content', 'POST' );
		};
		WCMRESTAPI.prototype.updatePieceOfContent = function() {
			var id = this.entryObject.entry.id.replace( 'wcmrest:', '' );
			var contentId = this.pieceOfContentID ? this.pieceOfContentID : id;
			return this.sendData( 'application/json', JSON.stringify( this.entryObject ), 'Content/' + contentId, 'PUT' );
		};

		WCMRESTAPI.prototype.updateWCMItem = function( id, type, entry, vp ) {
			if( vp ) this.wcmRestPath = "/wps/contenthandler/" + vp + "!ut/p/wcmrest/";
			return this.sendData( 'application/json', JSON.stringify( entry ), type + '/' + id, 'PUT' );
		};


		WCMRESTAPI.prototype.setElementsArray = function( elements ) {
			this.entryObject.entry.content.elements.element = $.extend( true, [], elements );
		};
		/**
		 * create an ajax call that will send data to the wcm rest api
		 *
		 * @param contentType the type of content that will be send to the rest api
		 * @param data the data that will be sent to the rest api
		 * @param url the url in which we will send the request
		 * @param method in which we want to send the request
		 *
		 * @return a promise that the data was sent
		 *
		 */
		WCMRESTAPI.prototype.sendData = function( contentType, data, url, method ) {
			return $.ajax( {
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
			} );
		};
		WCMRESTAPI.sendDataToRestApi = function( contentType, data, url, method ) {
			return $.ajax( {
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
			} );
		};
		/**
		 * put in the owners array the id of the distinguished names
		 *
		 * @return a owners array
		 *
		 */
		WCMRESTAPI.prototype.generateOwnerArray = function() {
			var ownersArray = [];
			var length = this.approverDistinguishedName.length;
			for( var i = 0; i < length; i ++ ) {
				var newUser = {
					"distinguishedName": this.approverDistinguishedName[ i ]
				};
				ownersArray.push( newUser );
			}
			return ownersArray;
		};
		/**
		 * create the function that request all the data of the authoring template
		 * @param authoringTemplateUuid the uuid of the authoring template
		 *
		 * @return a promise that will request all the data of the authoring template
		 *
		 */
		WCMRESTAPI.prototype.getDataFromAuthoringTemplate = function( authoringTemplateUuid ) {
			var url = "ContentTemplate/" + authoringTemplateUuid + "/new-content";
			var deferred = $.Deferred();
			this.sendData( "application/json", {}, url, "GET" ).then( function( data ) {
				deferred.resolve( data );
			}, function( msg ) {
				deferred.reject( msg );
			} );
			return deferred.promise();
		};
		//TODO Document This

		WCMRESTAPI.prototype.getDataFromItem = function( itemUuid, itemType, vp ) {
			if( vp ) this.wcmRestPath = "/wps/contenthandler/" + vp + "!ut/p/wcmrest/";
			var url = itemType + "/" + itemUuid;
			var deferred = $.Deferred();
			this.sendData( "application/json", {}, url, "GET" ).then( function( data ) {
				deferred.resolve( data );
			}, function( msg ) {
				deferred.reject( msg );
			} );
			return deferred.promise();
		};

		WCMRESTAPI.prototype.getDataFromPieceOfContent = function( pieceOfContentUID ) {
			return this.getDataFromItem( pieceOfContentUID, "Content" );
		};
		/**
		 * create the function that request all the data of the authoring template
		 * @param {elementsFromAuthoringTemplate} the list of elements that the authorign template has with their corresponding default values
		 *
		 */
		WCMRESTAPI.prototype.processDataFromAuthoringTemplate = function( elementsFromAuthoringTemplate ) {
			for( element in elementsFromAuthoringTemplate.element ) {
				switch( elementsFromAuthoringTemplate.element[ element ].type ) {
					case "ShortTextComponent":
						this.authoringTemplateData[ elementsFromAuthoringTemplate.element[ element ].name ] = this.generateShortTextElementForWCM( elementsFromAuthoringTemplate.element[ element ].name, "", "", false, false );
						break;
					case "TextComponent":
						this.authoringTemplateData[ elementsFromAuthoringTemplate.element[ element ].name ] = this.generateShortTextElementForWCM( elementsFromAuthoringTemplate.element[ element ].name, "", "", false, true );
						break;
					case "RichTextComponent":
						this.authoringTemplateData[ elementsFromAuthoringTemplate.element[ element ].name ] = this.generateRichTextElementForWCM( elementsFromAuthoringTemplate.element[ element ].name, "", "" );
						break;
					case "OptionSelectionComponent":
						this.authoringTemplateData[ elementsFromAuthoringTemplate.element[ element ].name ] = this.generateOptionElementForWCM( elementsFromAuthoringTemplate.element[ element ].name, "", elementsFromAuthoringTemplate.element[ element ].data.optionselection.options.option );
						break;
					case "ImageComponent"://propertyName, base64value, title, imageType, imageName
						this.authoringTemplateData[ elementsFromAuthoringTemplate.element[ element ].name ] = this.generateImageElementForWCM( elementsFromAuthoringTemplate.element[ element ].name, null, "", null, null );
						break;
					case "FileComponent"://propertyName, base64value, title, fileName, fileType
						this.authoringTemplateData[ elementsFromAuthoringTemplate.element[ element ].name ] = this.generateFileElementForWCM( elementsFromAuthoringTemplate.element[ element ].name, null, "", null, null );
						break;
					case "ReferenceComponent":
						this.authoringTemplateData[ elementsFromAuthoringTemplate.element[ element ].name ] = this.generateReferenceElementForWCM( elementsFromAuthoringTemplate.element[ element ].name, "", "" );
						break;
					case "LinkComponent":
						this.authoringTemplateData[ elementsFromAuthoringTemplate.element[ element ].name ] = this.generateLinkElementForWCM( elementsFromAuthoringTemplate.element[ element ].name, "", "" );
						break;
				}
			}
		};
		/**
		 * create the function that request all the data of the authoring template
		 * @param authoringTemplateUuid the uuid of the authoring template
		 *
		 * @return a promise that will request all the data of the authoirng template
		 *
		 */
		//TODO TO BE DEPRECATED
		WCMRESTAPI.prototype.getElementsFromAuthoringTemplate = function( authoringTemplateUuid ) {
			var context = this;
			var deferred = $.Deferred();
			$.when( context.getDataFromAuthoringTemplate( authoringTemplateUuid ) )
				.then( function( data ) {
					context.processDataFromAuthoringTemplate( data.entry.content.content.elements );
					deferred.resolve( data );
				}, function( msg ) {
					deferred.reject( msg );
				} );
			return deferred.promise();
		};

		/**
		 * process the image and convert it to a buferr array
		 *
		 * @param {name} the name of the image
		 * @param {imageNode} the node that contains the image and the metod toblob
		 * @param {fileType} the file type of the image
		 *
		 * @return a promise that will process the image
		 *
		 */
		WCMRESTAPI.prototype.processImage = function( name, imageNode, fileType ) {
			var deferred = $.Deferred();
			if( typeof imageNode !== 'undefined' ) {
				var reader = new FileReader();
				var deferred = $.Deferred();

				var getBlob = function( blob ) {
					reader.onload = function( event ) {
						deferred.resolve( { "data": event.target.result, "name": name, "fileType": fileType } );
					};
					reader.onerror = function( error ) {
						console.log( error );
						deferred.resolve( { "data": null, "name": name } );
					};
					reader.readAsArrayBuffer( blob );
				};
				imageNode.toBlob( getBlob );
				return deferred.promise();
			}
			return deferred.resolve( { "data": null, "name": name } );
		};
		/**
		 * process the file and convert it to base64
		 *
		 * @param {name} the name of the file
		 * @param {fileNode} the node that contain the file
		 *
		 * @return a promise that will process the image
		 *
		 */
		WCMRESTAPI.prototype.processFile = function( name, fileNode ) {
			var deferred = $.Deferred();
			if( typeof fileNode !== 'undefined' ) {
				if( fileNode.files.length > 0 ) {
					var reader = new FileReader();
					var deferred = $.Deferred();
					reader.onload = function( event ) {
						var data = event.target.result.split( "," );
						deferred.resolve( { "data": data[ 1 ], "name": name, "type": fileNode.files[ 0 ].type, "fileName": fileNode.files[ 0 ].name } );
					};
					reader.onerror = function() {
						console.log( error );
						deferred.resolve( { "data": null, "name": name, "type": "" } );
					};
					reader.readAsDataURL( fileNode.files[ 0 ] );
					return deferred.promise();
				}
			}
			return deferred.resolve( { "data": null, "name": name, "type": "" } );
		};
		WCMRESTAPI.prototype.createForm = function( elements, $formWrapper, $fieldWrapper ) {
			var $container = $( "<form></form>" ).attr( "class", "newPieceOfContentForm" );
			var $fieldSet = $formWrapper ? $formWrapper : $( "<fieldset></fieldset>" );
			if( ! $.isEmptyObject( elements ) ) {
				//var temporaryElements = [];
				for( var element in elements ) {
					if( elements.hasOwnProperty( element ) ) {
						if( typeof elements[ element ].wcmType === "string" ) {
							var $elementWraper = $fieldWrapper ? $fieldWrapper : $( "<div></div>" );
							switch( elements[ element ].wcmType ) {
								case "ShortTextComponent":
									var $element = elements[ element ].$domElement ? elements[ element ].$domElement : $( "<input type='text'>" );
									$element = WCMRESTAPI.addAttributes( $element, elements[ element ] );
									$elementWraper.append( $element );
									break;
								case "TextComponent":
									var $element = elements[ element ].$domElement ? elements[ element ].$domElement : $( "<input type='text'>" );
									$element = WCMRESTAPI.addAttributes( $element, elements[ element ] );
									$elementWraper.append( $element );
									break;
								case "RichTextComponent":
									var $element = elements[ element ].$domElement ? elements[ element ].$domElement : $( "<input type='text'>" );
									$element = WCMRESTAPI.addAttributes( $element, elements[ element ] );
									$elementWraper.append( $element );
									break;
								case "ImageComponent":
									var $element = elements[ element ].$domElement ? elements[ element ].$domElement : $( "<input type='text'>" );
									$element = WCMRESTAPI.addAttributes( $element, elements[ element ] );
									$elementWraper.append( $element );
									break;
								case "FileComponent":
									var $element = elements[ element ].$domElement ? elements[ element ].$domElement : $( "<input type='text'>" );
									$element = WCMRESTAPI.addAttributes( $element, elements[ element ] );
									$elementWraper.append( $element );
									break;
								case "OptionComponent":
									var $element = elements[ element ].$domElement ? elements[ element ].$domElement : $( "<select></select>" );
									$element = WCMRESTAPI.addAttributes( $element, elements[ element ] );
									$elementWraper.append( $element );
									break;
								case "ReferenceComponent"://need to check how to create elements of reference component
									var $element = elements[ element ].$domElement ? elements[ element ].$domElement : $( "<input type='text'>" );
									$element = WCMRESTAPI.addAttributes( $element, elements[ element ] );
									$elementWraper.append( $element );
									break;
								case "LinkComponent"://need to check how to create elements of reference component
									var $element = elements[ element ].$domElement ? elements[ element ].$domElement : $( "<input type='text'>" );
									$element = WCMRESTAPI.addAttributes( $element, elements[ element ] );
									$elementWraper.append( $element );
									break;
							}
							//
							$fieldSet.append( $elementWraper );
							//temporaryElements.push($elementWraper);
						}
					}
				}
				//if(temporaryElements.length > 0 ){
				//    $fieldSet.append(temporaryElements.join(""));
				//}
			}
			$container.append( $fieldSet );
			return $container;
		};
		WCMRESTAPI.prototype.generateOptionsDomElement = function( $domElement, element ) {
			var selected = '';
			for( var i = 0; i < element.options.length; i ++ ) {
				selected = element.options[ i ].selected ? 'selected' : '';
				$domElement.append( "<option value=" + element.options[ i ].key + " " + selected + " >" + element.options[ i ].value + "</option>" );
			}
			return $domElement;
		};
		//the design for the xWidget
		//check if attr are null
		WCMRESTAPI.prototype.addAttributes = function( $domElement, element ) {
			if( element.id ) {
				$domElement.attr( "id", element.id );
			}
			if( element.class ) {
				if( element.class.length ) {
					var classes = [];
					for( var i = 0; i < element.class.length; i ++ ) {
						classes.push( element.class[ i ] );
					}
					$domElement.attr( "class", element.class.join( " " ) );
				}
			}
			if( element.xWidgetData ) {
				WCMRESTAPI.executeXWidget( element.hasXWidget.xWidgetObject, element.hasXWidget.callbackData, element.hasXWidget.contextBinded );
			}
			//
			//    [{
			//        dataName : nameForTheDataAttribute,
			//        dataValue : valueForTheDataAttribute
			//    }]
			//
			if( element.dataAttributesForDomElement ) {
				for( var i = 0; i < dataAttributesForDomElement.length; i ++ ) {
					$domElement.attr( "data-" + dataAttributesForDomElement[ i ][ "dataName" ], dataAttributesForDomElement[ i ][ "dataValue" ] );
				}
			}
			//all elements must have the unique name attribute
			$domElement.attr( "data-name", element.name );
			return $domElement;
		};
		WCMRESTAPI.prototype.executeXWidget = function( xWidgetObject, callbackData, context ) {
			if( typeof context === "undefined" ) {
				context = this;
			}
			var dinamicDefferreds = $.when( xWidgetObject.render() );
			for( var i = 0; i < callbackData.length; i ++ ) {
				dinamicDefferreds = dinamicDefferreds.then( WCMRESTAPI.pipeData( callbackData[ "data" ] ) ).then( callbackData[ "callback" ] ).bind( context );
			}

		};
		//TODO END: REFACTOR OR DEPRECATE SINCE THERE IS FUNCTIONALITY OUT OF WCM REST API
		/**
		 * Retrieve the List of elements from the current entry object
		 * **/
		//TODO: CREATE THE DOC FOR THIS AND ADD ALL THE TYPES
		WCMRESTAPI.updateElementFromPieceOfContent = function( pieceOfContentUUID, elementName, elementType, newValue, virtualPortal ) {
			virtualPortal = typeof virtualPortal !== 'undefined' ? virtualPortal : '';
			var wcmRestPath = '/wps/contenthandler/' + virtualPortal + '/!ut/p/wcmrest/';

			if( ! pieceOfContentUUID ) {
				console.error( 'The piece of content UUID is mandatory' );
				return;
			}

			if( ! elementName ) {
				console.error( 'You need to specify the element name.' );
				return;
			}

			if( ! elementType ) {
				console.error( 'Element type must be specified' );
				return;
			}

			if( typeof newValue === 'undefined' ) {
				console.error( 'You need to specify a new value. Undefined found.' );
				return;
			}

			var entryObject = {
				entry: {}
			};

			switch( elementType ) {
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
					console.log( 'The type "' + type + '" is not supported yet.' );
					break;
			}

			return WCMRESTAPI.sendDataToRestApi( 'application/json', JSON.stringify( entryObject ), wcmRestPath + 'Content/' + pieceOfContentUUID + '/elements/' + elementName, 'PUT' );


		};
		WCMRESTAPI.prototype.setParent = function( uuid ) {
			var link = this.entryObject.entry.link;
			var parent = this.getLinkElementByName( 'parent', this.entryObject );
			if( parent ) {
				parent.href = this.wcmRestPath + '/item/' + uuid;
			} else {
				link.push( {
					rel: 'parent',
					href: this.wcmRestPath + '/item/' + uuid
				} );
			}
		};

		WCMRESTAPI.prototype.addCategory = function( uuid ) {
			if( ! this.entryObject.entry.profile.category ) {
				this.entryObject.entry.profile.category = [];
			}
			var categoriesArray = this.entryObject.entry.profile.category ? this.entryObject.entry.profile.category : [];
			var length = categoriesArray.length;
			for( var i = 0; i < length; i ++ ) {
				if( categoriesArray[ i ].indexOf( uuid ) >= 0 ) {
					return;
				}
			}

			categoriesArray.push( this.wcmRestPath + '/Category/' + uuid );

		};


		WCMRESTAPI.prototype.setWorkFlow = function( uuid ) {
			var link = this.entryObject.entry.link;
			var workflow = this.getLinkElementByName( 'workflow', this.entryObject );
			if( workflow ) {
				workflow.href = this.wcmRestPath + '/item/' + uuid;
			} else {
				link.push( {
					rel: 'workflow',
					href: this.wcmRestPath + '/item/' + uuid
				} );
			}
		};

		WCMRESTAPI.prototype.getLinkElementByName = function( name, object ) {
			if( ! object.entry.hasOwnProperty( 'link' ) ) return;
			var linkObject = object.entry.link;
			var length = linkObject.length;
			for( var i = 0; i < length; i ++ ) {
				var objectName = linkObject[ i ].rel;
				if( objectName === name ) {
					return linkObject[ i ];
				}
			}

		};

		/* UPDATE SECTION */
		/* Add New Elements */
		WCMRESTAPI.prototype.addNewElement = function( elementName, type, title, options ) {
			var elements = this.entryObject.entry.content.content.elements.element;
			var newObject;
			switch( type ) {
				case 'ShortTextComponent':
					newObject = this.createShortTextComponentElement( elementName, title );
					break;
				case 'TextComponent':
					newObject = this.createTextComponentElement( elementName, title );
					break;
				case 'HTMLComponent':
					newObject = this.createHTMLComponentElement( elementName, title );
					break;
				case 'RichTextComponent':
					newObject = this.createRichTextComponentElement( elementName, title );
					break;
				case 'ReferenceComponent':
					newObject = this.createComponentReferenceElement( elementName, title );
					break;
				case 'DateComponent':
					newObject = this.createDateComponentElement( elementName, title );
					break;
				case 'ImageComponent':
					newObject = this.createImageComponentElement( elementName, title );
					break;
				case 'FileComponent':
					newObject = this.createFileComponentElement( elementName, title );
					break;
				case 'JSPComponent':
					newObject = this.createJSPComponentElement( elementName, title );
					break;
				case 'LinkComponent':
					newObject = this.createLinkComponentElement( elementName, title );
					break;
				case 'NumericComponent':
					newObject = this.createShortTextComponentElement( elementName, title );
					break;
				case 'UserSelectionComponent':
					newObject = this.createUserSelectionElement( elementName, title );
					break;
				case 'OptionSelectionComponent':
					//newObject = this.createShortTextComponentElement( elementName, title );
					//newObject = this.createOptionSelectionComponentElement( elementName, title, options );
					//break;
					console.log( 'Option Selection will be stored as text' );
					newObject = this.createShortTextComponentElement( elementName, title );
				default:
					console.log( 'The type "' + type + '" is not supported yet.' );
					break;
			}


			if( newObject ) {
				elements.push( newObject );
			}


		};

		WCMRESTAPI.prototype.createOptionSelectionComponentElement = function( elementName, title, options ) {
			if( ! options ) return;
			var optionsArray = []
			for( var i = 0, length = options.length; i < length; i ++ ) {
				optionsArray.push( {
					id: options.value,
					value: options.name,
					selected: false
				} );
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

		WCMRESTAPI.prototype.createComponentReferenceElement = function( elementName, title ) {
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
		WCMRESTAPI.prototype.createDateComponentElement = function( elementName, title ) {
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
		WCMRESTAPI.prototype.createFileComponentElement = function( elementName, title ) {
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
		WCMRESTAPI.prototype.createHTMLComponentElement = function( elementName, title ) {
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
		WCMRESTAPI.prototype.createImageComponentElement = function( elementName, title ) {
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
		WCMRESTAPI.prototype.createJSPComponentElement = function( elementName, title ) {
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
		WCMRESTAPI.prototype.createLinkComponentElement = function( elementName, title ) {
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
		WCMRESTAPI.prototype.createRichTextComponentElement = function( elementName, title ) {
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
		WCMRESTAPI.prototype.createShortTextComponentElement = function( elementName, title ) {
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
		WCMRESTAPI.prototype.createTextComponentElement = function( elementName, title ) {
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
		WCMRESTAPI.prototype.createUserSelectionElement = function( elementName, title ) {
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


		WCMRESTAPI.prototype.getElementValueByName = function( name ) {
			if( ! name ) return;

			var elements = [];

			try {
				elements = this.entryObject.entry.content.content.elements.element;
			} catch( e ) {
				console.error( e );
			}

			var length = elements.length;

			for( var i = 0; i < length; i ++ ) {
				var item = elements[ i ];
				if( item.name === name ) {
					return item;
				}
			}

		};

		WCMRESTAPI.prototype.getElementValue = function( element ) {
			switch( element.type ) {
				case 'ShortTextComponent':
				case 'TextComponent':
					return element.data.value;
				case 'RichTextComponent':
				case 'HTMLComponent':
					return this.htmlEncode( element.data.value );
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
					console.log( element );
					return element.data.userSelection.user;
				case 'OptionSelectionComponent':
					return element.data.optionselection.options.option;
				default:
					console.log( 'The type "' + element.type + '" is not supported yet.' );
					return '';
			}
		};

		WCMRESTAPI.prototype.htmlEncode = function( value ) {
			return $( '<div/>' ).text( value ).html();
		};

		WCMRESTAPI.prototype.htmlDecode = function( value ) {
			return $( '<div/>' ).html( value ).text();
		};

		return WCMRESTAPI;
	})();


})( jQuery );
