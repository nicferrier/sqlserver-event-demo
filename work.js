const sql = require("mssql");
const fs = require("./fsasync");
const path = require("path");

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
        console.log("query", queryResult, new String(queryResult.recordset[0].message));
        pool.close();
    }
    catch (e) {
        console.log("blah", e);
    }
}

doit("MyRecvQueue");

// end
