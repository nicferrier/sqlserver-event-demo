const sql = require("mssql");

async function doit () {
    try {
        let config = {
            user: "nicferrier",
            domain: "DESKTOP-89L3QJF",
            server: "localhost",
            password: "boop",
            port: 1433,
            database: "nicdev2",
            options: {
                requestTimeout: 60000,
                database: "nicdev2",
                encrypt: true,
                trustServerCertificates: true
            }
        };
        let pool = await sql.connect(config);

        let request = await pool.request();
        // request.stream = true;

        /*
        request.on("row", row => {
            console.log(row);
        });
        */
        request.on("done", () => {
            console.log("done");
            //pool.close();
        });

        /*
        let queryResult1 = await request.query("select * from test2;");
        console.log(queryResult1);
        */

        let queryResult = await request.query(`declare @cg_id uniqueidentifier;
waitfor( 
  GET conversation group @cg_id
  FROM MyRecvQueue
);
receive top(1) conversation_group_id, message_body 
FROM MyRecvQueue
WHERE conversation_group_id=@cg_id;`);
        console.log("query", queryResult, new String(queryResult.recordset[0].message_body));
        
    }
    catch (e) {
        console.log("error", e);
    }
}

doit();

// end
