import {Utils} from "../utils/utils";

test("it checks Utils loads correctly", () => {
    const utilsInstance = Utils;
    const anyUtilshMethod = typeof utilsInstance.cloneObject;

    expect(anyUtilshMethod).not.toBe("undefined");
});

test("it checks Utils cloneObject correctly", () => {
    const utilsInstance = Utils;
    const oldObject = {a: 'test'};
    const clonedObject = utilsInstance.cloneObject(oldObject);

    expect(clonedObject).not.toBe(oldObject);
});

test("it checks Utils cloneObject with nested Objects correctly", () => {
    const utilsInstance = Utils;
    const nestedObject = {c: test};
    const oldObject = {a: 'test', b: nestedObject};
    const clonedObject = utilsInstance.cloneObject(oldObject);

    expect(clonedObject.b).toBe(nestedObject);
});

test("it checks Utils deep cloneObject with nested Objects correctly", () => {
    const utilsInstance = Utils;
    const nestedObject = {c: test};
    const oldObject = {a: 'test', b: nestedObject};
    const clonedObject = utilsInstance.cloneObject(oldObject, true);

    expect(clonedObject.b).not.toBe(nestedObject);
});
