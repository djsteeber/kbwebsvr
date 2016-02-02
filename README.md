# KBWEBSERVER
This is a nodejs based rest resource server for the kenosha bowmen archery web site.

The rest endpoints do not care about versioning, since the main client is a single page application.
If more integration is ever needed, then it will be added.

The storage for the server is a mongodb locally hosted on the same server.

The server utilizes a schema.js file to determine the collections data structures stored in each collection.
This way it validates the POST (add) and PUT (update) to the collection.

Simple authentication is put in to limit who can POST / PUT / DELETE from a collection.
Currently all reads are unrestricted.

A simple javascript file, call load_shoots.js is there to populate the mongodb, so that there is some data loaded.

In my current configuration, I run the node server using PM2 http://pm2.keymetrics.io/docs/usage/quick-start/.
to load the application into PM2, just run
```
pm2 start kbwebsvr -i 0
```

This will put it in clustering mode and create one instance per core.


Really, don't do this, but look at the script and ensure the parts are correct and run them by hand
```
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y nodejs
```

I am running mongoDB 2.4.9 as of the writing of this document


##TODO
- need to add in logging
- should add some simple queries so that mongo queries are not sent directly.  Some sort of conversion algorithm.  Long term is to write a simple sql style language that is parsed into a query the nosql store can understand.  If you know of one out there let me know.
```
any schedule.date > now() order by schedule.date limit 5
```

This will take some time.

