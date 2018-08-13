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

async function setupConnection() {
    try {
        let password = await fs.promises.readFile(path.join(__dirname, ".password"));
        let config = {
            user: "nicferrier",
            domain: "DESKTOP-89L3QJF",
            server: "localhost",
            password: password,
            port: 1433,
            database: "nicdev2",
            requestTimeout: 60 * 1000,
            options: {
                requestTimeout: 60 * 1000,
                database: "nicdev2",
                encrypt: true,
                trustServerCertificates: true
            }
        };
        let pool = await sql.connect(config);
        return [undefined, pool];
    }
    catch (e) {
        return [e];
    }
}

async function doit (queueName) {
    let [err, con] = await setupConnection();
    if (err) {
        console.log("error making a connection", err);
        return;
    }
    
    // Make a function to take a promise and resolve it, with the
    // resolution calling the same function
    let recur = function (p) {
        p.then(rs => {
            try {
                if (rs.recordset.length > 0) {
                    let msg = new String(rs.recordset[0].message);
                    console.log("msg", new Date(), parseMessage(msg));
                }
            }
            catch (e) {
                console.log("result failed", e);
            }
            recur(waitIt(con, queueName));
        }).catch(e => {
            recur(waitIt(con, queueName));
        });
    };

    recur(waitIt(con, queueName));
}

doit("MyRecvQueue"); /// doit('MyReceivingQueue');

// End
