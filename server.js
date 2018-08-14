// Send SQL Server events through an SSE socket

const express = require("express");
const SSE = require("sse-node");
const sqlServerEvents = require("./work.js");
const path = require("path");

const app = express();

function getRemoteAddr(request) {
    let ip = request.headers["x-forwarded-for"]
        || request.connection.remoteAddress
        || request.socket.remoteAddress
        || request.connection.socket.remoteAddress;
    let remotePort = request.connection.remotePort;
    let remoteAddr = ip + ":" + remotePort;
    return remoteAddr;
}

exports.boot = function (config, options) {
    let port = config.webPort;
    if (port == undefined) {
        return new Error("no webPort config variable");
    }

    if (options.rootDir !== undefined) {
        app.use("/", express.static(path.join(__dirname, "www")));
    }

    const connections = {};

    let queuePath = "/queue/" + config.dbName + "/" + config.queueName;
    console.log("queuePath", queuePath);
    app.get(queuePath, function (req, response) {
        let remoteAddr = getRemoteAddr(req);
        console.log("wiring up comms from", remoteAddr);

        let connection = SSE(req, response, {ping: 10*1000});
        connection.onClose(closeEvt => {
            console.log("sse closed");
            delete connections[remoteAddr];
        });

        connections[remoteAddr] = connection;
        connection.send({remote: remoteAddr}, "meta");
    });

    let sendAll = function (sentDate, data) {
        Object.keys(connections).forEach(connectionKey => {
            let connection = connections[connectionKey];
            connection.send({
                SqlServerEvent: data,
                sentDate: sentDate
            }, "sqlserverevent");
        });
    };

    app.listen(port, "localhost", async function () {
        sqlServerEvents.waitFor(config, sendAll);
        console.log("serving on ", port);
    });
}



const fs = require("./fsasync.js");
const os = require("os");

async function getConfig(port, dbName, queueName) {
    console.log(port, dbName, queueName);
    let password = await fs.promises.readFile(path.join(__dirname, ".password"));
    let webRootPath = path.join(__dirname, "www");
    return [{
        user: os.userInfo().username,
        domain: os.hostname(),
        server: "localhost",
        password: password,
        database: dbName,
        dbName: dbName,
        queueName: queueName,
        requestTimeout: 60 * 1000,
        trustServerCertificates: true,
        webPort: port
    },  (fs.promises.exists(webRootPath) ? webRootPath : undefined)];
}

if (require.main === module) {
    getConfig
        .apply(null, process.argv.slice(2))
        .then(([config, webRoot]) => {
            exports.boot(config, { rootDir: webRoot });
        });
}
else {
    // Just a module - use exports.boot
}

// End
