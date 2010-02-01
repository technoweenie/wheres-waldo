# wheres-waldo

Track what users are on which pages with redis.

## Installation

Depends on fab, ntest, redisclient, and underscore.

There's no packaging system for node.js yet, so I've just been creating symlinks
in my `~/.node_libraries` path.

    $ ln -s /path/to/fab              ~/.node_libraries/fab
    $ ln -s /path/to/redisclient      ~/.node_libraries/redisclient
    $ ln -s /path/to/underscore       ~/.node_libraries/underscore
    $ ln -s /path/to/wheres-waldo/lib ~/.node_libraries/wheres-waldo

    $ ln -s /path/to/redisclient/redisclient.js   ~/.node_libraries/redisclient/index.js
    $ ln -s /path/to/underscore/underscore-min.js ~/.node_libraries/underscore/index.js

## Usage

Display a list of users that are visiting a certain page.  Using a snippet of [javascript at the bottom of your site](http://gist.github.com/279689), you can end up with something like this:

![screenshot of user list](http://img.skitch.com/20100118-py3rmqkfw51d4ra6im7ump6wyk.png)

## TODO

* HMAC URL authentication
* Ability to store json data per user instead of just a name or ID

## Copyright

Copyright (c) 2010 rick. See LICENSE for details.
