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


## How to setup

Presuming a database called `nicdev2`, this is how to Setup:

```sql
ALTER DATABASE nicdev2 SET TRUSTWORTHY ON;
GO

USE nicdev2;
GO

------------------------
--Create a Basic Queue--
------------------------
--Create a KEY. This is *required* in order to send / receive messages
--The database master key is a symmetric key used to protect the private keys
--of certificates and asymmetric keys that are present in the database
CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'Password1';

--Create a message type
--This could enforce a schema, but in this case enforces that it is well formed xml
CREATE MESSAGE TYPE MyMessage VALIDATION = WELL_FORMED_XML;

--Create a contract.
--This defines the messages that can be sent in a conversation
--and defines which side of the conversation can send what.
--In this case only 1 type of message can be sent,
--but both by the INITIATOR and the TARGET
CREATE CONTRACT MyContract (MyMessage SENT BY ANY );

--Creates a queue for sending the message, which is required to send a message
CREATE QUEUE MySendingQueue WITH STATUS=ON, RETENTION=OFF;

--Creates a queue which will receive the message. In this case it is local,
--but this could equally be a remote queue. In this case we could create
--a route to the queue using CREATE ROUTE
CREATE QUEUE MyReceivingQueue WITH STATUS=ON, RETENTION=OFF;

--Creates a sending service. This defines the queue that will send/receive
--messages, as defined by the contract.
--In this case it allows MySendingService to send (and receive) MyMessage
CREATE SERVICE MySendingService ON QUEUE MySendingQueue (MyContract);

--Creates a receiving service.
--In this case it allows MyReceiveService to receive (and send) MyMessage 
CREATE SERVICE MyReceivingService ON QUEUE MyReceivingQueue (MyContract);

--Creates a route to a service. This is not strictly required for local services
--but should be used to route to services on remote sql instances
CREATE ROUTE MyRoute WITH SERVICE_NAME = 'MyReceivingService', ADDRESS = 'LOCAL';
GO
```

How to send data to it with SQLCMD:

```sql
use nicdev2;
go
DECLARE @handle uniqueidentifier;
BEGIN DIALOG CONVERSATION @handle
FROM SERVICE MySendingService
TO SERVICE 'MyReceivingService'
ON CONTRACT MyContract;

--Sends a message
SEND ON CONVERSATION @handle
MESSAGE TYPE MyMessage('<message>hello world K</message>');

--And ends the conversation
END CONVERSATION @handle WITH CLEANUP;
GO
```

These are both thanks to [Microsoft's MSDN](https://blogs.msdn.microsoft.com/steven_bates/2006/01/05/service-broker-example-creation-of-a-simple-queue-and-posting-a-message/).

NB: This is *not* how the current code is actually setup; in the
current code we have:

| name above         | name the code depends on |
|--------------------|--------------------------|
| MySendingQueue     | MyQueue                  |
| MySendingService   | MyService                |
| MyReceivingQueue   | MyRecvQueue              |
| MyReceivingService | MyRecvService            |

But the above config (with fully specified names) *should* be used
because it's clearer so I will reconfigure all the scripts to work
that way.


## How to *send* an event

Use SQLCMD with the [post script](post.sql):

```
SQLCMD -i post.sql
```

this also presumes a database called `nicdev2`.

## How to test the nodejs

Do the usual:

```
npm install
node server.js 8004 nicdev1 MyRecvQueue
```

where the args are: `port` `database` and `queue`

You should see events be published if you hit the demo webapp.

DB connections timeout after a minute and are reestablished.
