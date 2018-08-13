const sql = require("mssql");
const fs = require("./fsasync");
const path = require("path");
const DOMParser = require("xmldom").DOMParser;

function parseMessage(message) {
    let dom = new DOMParser().parseFromString(message);
    return dom.childNodes[0].childNodes[0].textContent;
}

function waitIt(pool, queueName) {
    let request = pool.request();
    return request.query(`waitfor( 
  receive top(1) convert(xml, message_body ) [message]
  FROM ${queueName}
);`);
}

async function doit (queueName) {
    let password = await fs.promises.readFile(path.join(__dirname, ".password"));
    try {
        let config = {
            user: "nicferrier",
            domain: "DESKTOP-89L3QJF",
            server: "localhost",
            password: password,
            port: 1433,
            database: "nicdev2",
            requestTimeout: 60000,
            options: {
                requestTimeout: 60000,
                database: "nicdev2",
                encrypt: true,
                trustServerCertificates: true
            }
        };
        let pool = await sql.connect(config);
        let queryResult = await waitIt(pool, queueName);
        if (queryResult.recordset.length > 1) {
            let msg = new String(queryResult.recordset[0].message);
        }
        pool.close();
    }
    catch (e) {
        console.log("blah", e);
    }
}


doit("MyReceivingQueue");

// End
