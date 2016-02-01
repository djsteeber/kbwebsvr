# KBWEBSERVER
This is a nodejs based rest resource server for the kenosha bowmen archery web site.

The rest endpoints do not care about versioning, since the main client is a single page application.
If more integration is ever needed, the it will be added.

filtering and pagination on the get request should be accomplished by json body.
added to the schema for each entity is start and count.
Arrays returned that are less then count should be assumed to be end of recordset.

Errors are also sent as json.  Standard structure is
{error:  ###, message: 'some error message'}

##TODO
need to add in logging
should add some simple queries so that mongo queries are not sent directly.  Some sort of conversion algorithm
This will take some time
example
schedule.date > now() order by schedule.date limit 5

