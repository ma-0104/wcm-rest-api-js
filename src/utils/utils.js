import rfdc from 'rfdc';

export class Utils {
    /**
     * @method cloneObject
     * @param {object} entryObject
     * @param {boolean} deepClone
     * @summary this functions allows you to have new object instance
     * @return {object}
     **/
    static cloneObject(entryObject, deepClone = false) {
        if (deepClone) return rfdc()(entryObject);
        return Object.assign({}, entryObject);
    };
}
