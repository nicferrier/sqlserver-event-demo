use nicdev2;
go
DECLARE @handle uniqueidentifier;
BEGIN DIALOG CONVERSATION @handle
FROM SERVICE MyService
TO SERVICE 'MyRecvService'
ON CONTRACT MyContract;

--Sends a message
SEND ON CONVERSATION @handle
MESSAGE TYPE MyMessage('<message>hello world K</message>');

--And ends the conversation
END CONVERSATION @handle WITH CLEANUP;
go
