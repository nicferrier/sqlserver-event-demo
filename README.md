# SQL Server events with NodeJs

It's very useful to get events out of databases. Oracle has
OracleDatabaseChangeNotifications and PostgreSQL has LISTEN/NOTIFY.

SQLServer seems to have good .NET support but can you do it in other
languages?

Yes.

This is a nodejs version which is just calling SQL basically. It does
hang a connection, I think. Not sure the connection can be used for
anything other than waiting on the event.

That's ok. It's still just waiting. Not actively hammering the
database.


## Setting up an environment that you can test this with

You need SQL Server and some config. See [this documentation](Setup.md).


## How to *send* an event

Use SQLCMD with the [post script](post.sql):

```
SQLCMD -i post.sql
```

this also presumes a database called `nicdev2`.


## How to test the nodejs

Run the SSE server with enough db information to start it up:

```
npm install
node server.js 8004 nicdev2 MyRecvQueue
```

where the args are: `port` `database` and `queue`

the password has to be in a file called `.password` in the current
directory.

Visiting `http://localhost:8004` in your brower will now open a demo
webapp which subscribes to the queue-bridge and displays the JSON of
the arriving events.

DB connections timeout after a minute and are automatically
reestablished.

