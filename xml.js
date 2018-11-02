const DOMParser = require("xmldom").DOMParser;
const assert = require("assert");

function make(result, Element) {
    const existing = result[Element.tagName];
    if (existing !== undefined) {
        return existing;
    }
    const object = {};
    result[Element.tagName] = object;
    return object;
}

// Depth first xml->json using xmldom
exports.parseMessage = function(message) {
    let dom = new DOMParser().parseFromString(message);

    function jsonNode(Element, result) {
        if (Element.childNodes.length > 0) {
            const list = Array.from(Element.childNodes);

            make(result, Element).content = list.map(Node => {
                // console.log("node type", Node.nodeType);
                switch (Node.nodeType) {
                case 1:
                    return jsonNode(Node, {});
                case 3:
                    return Node.data;
                }
            });
        }
        if (Element.attributes.length > 0) {
            const attrs = {};
            const attrsList = Array.from(Element.attributes)
                  .forEach(({name, value}) => attrs[name] = value);
            make(result, Element).attrs = attrs;
        }
        return result;
    }
    let result = jsonNode(dom.childNodes[0], {});
    return result;
}

const parseMessage = exports.parseMessage;

function test () {
    assert.deepStrictEqual(
        parseMessage(`<x><a>a value</a><b>b value</b></x>`),
        { x: { content: [
            { "a": { content: ["a value"]}},
            { "b": { content: ["b value"]}}
        ]}}
    );

    assert.deepStrictEqual(
        parseMessage(`<a x="1" b="2"/>`),
        { a: { attrs: { "x": "1", "b": "2" }} }
    );

    assert.deepStrictEqual(
        parseMessage(`<a><b x="1" z="2">one</b></a>`),
        {"a": {
            "content": [{ "b": {
                "content": ["one"],
                "attrs": { "x": "1", "z": "2" }
            }}]}
        }
    );
}


if (require.main === module) {
    test();
}

// ends here
