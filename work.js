const sql = require("mssql");
const fs = require("./fsasync");
const path = require("path");
const dns = require("dns");
const DOMParser = require("xmldom").DOMParser;

// Depth first xml->json using xmldom
function parseMessage(message) {
    let dom = new DOMParser().parseFromString(message);
    function jsonNode(Element, result) {
        if (Element.childNodes.length > 0) {
            let list = Array.from(Element.childNodes);
            result[Element.tagName] = list.map(Node => {
                // console.log("node type", Node.nodeType);
                switch (Node.nodeType) {
                case 1:
                    return jsonNode(Node, {});
                case 3:
                    return Node.data;
                }
            });
        }
        return result;
    }
    let result = jsonNode(dom.childNodes[0], {});
    return result;
}

function queryWait(pool, queueName) {
    let request = pool.request();
    return request.query(`waitfor(
  receive top(1) convert(xml, message_body ) [message]
  FROM ${queueName}
);`);
}

async function setupConnection({
    user,
    domain,
    server,
    password,
    port = 1433,
    database,
    queueName,
    requestTimeout = 60 * 1000,
    trustServerCertificates}) {
    try {
        let config = { // mssql config - sometimes needs hacks to pass to tedious
            user: user,
            domain: domain,
            server: server,
            password: password,
            port: port,
            database: database,
            requestTimeout: requestTimeout,
            options: {
                requestTimeout: requestTimeout,
                database: database,
                encrypt: true,
                trustServerCertificates: trustServerCertificates
            }
        };
        let pool = await sql.connect(config);
        return [undefined, {pool: pool, queueName: queueName, config: config}];
    }
    catch (e) {
        return [e];
    }
}

exports.waitFor = async function (config, eventSender) {
    let [err, connection] = await setupConnection(config);
    if (err) {
        console.error(`${config.queueName}:: can't make a connection to ${config.database}`, err);
        return;
    }

    let {pool: poolConnection, queueName, conf} = connection;
    
    // Make a function to take a promise and resolve it, with the
    // resolution calling the same function
    let recur = function (p) {
        p.then(rs => {
            try {
                if (rs.recordset.length > 0) {
                    let msg = new String(rs.recordset[0].message);
                    eventSender(new Date(), parseMessage(msg));
                }
            }
            catch (e) {
                console.error(`${queueName}:: queue wait result failed`, e);
            }
            recur(queryWait(poolConnection, queueName));
        }).catch(e => {
            recur(queryWait(poolConnection, queueName));
        });
    };

    recur(queryWait(poolConnection, queueName));
}


if (require.main === module) {
}
else {
}

// End
