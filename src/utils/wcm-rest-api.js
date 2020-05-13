class WCMRestAPI {

}
export { WCMRestAPI };
/*
export const restAPI = (function() {
	window.WCMRestAPI = class WCMRestAPI {

		constructor( virtualPortal ) {
			this.virtualPortal = virtualPortal ? `${virtualPortal}/` : "";
			this.wcmRestContext = `/wps/contenthandler/${this.virtualPortal}!ut/p/wcmrest/`;
		}

		static makeAjaxCall( params ) {
			const requestParams = {
				method: params.method || "GET",
				cache: "no-cache",
				credentials: "same-origin",
				headers: {
					"Content-Type": params.contentType || "application/json",
					"Accept": params.contentType || "application/json"
				},
				referrerPolicy: "no-referrer"
			};

			if( params.body ) requestParams.body = JSON.stringify( params.body );

			const fetchCall = fetch( params.url, requestParams );
			return new Promise( ( resolve, reject ) => {
				fetchCall.then( response => response.json() ).then( data => resolve( data ) );
			} )
		};

	}

})
();*/
