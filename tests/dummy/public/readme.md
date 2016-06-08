## Installation

### Client App

The first step is to get the Ember addon installed:

```sh
ember install ember-cli-horizon
```

### Horizon Server

You're application is now ready to work against a Horizon server (and Rethink database). In your development environment you'll likely want to have the server running locally. In order to get that party started you'll want to:

```sh
npm install -g horizon
```

Now that the horizon server (and consequentially the RethinkDB), are installed as a global **npm** service you can run the server fairly easily. How you do that can vary a bit, you may decide that you want to do this manually or as part of a separate repo than you're client app. If that's the case then you're best off referring to the horizon documentation: [starting the server](http://horizon.io/docs/getting-started/#start-the-server).

If you're ok with having your server's TOML config file being a part of the client app's repo and you're a sucker for convenience than we've got a few commands we've built into Ember-CLI for you:

```sh
# initialize the server config
horizon init
# Ember-CLI command to run Ember client, Horizon server, and RethinkDB and have them all wired up
ember horizon:serve
```

> **Note:** you can use the `--port` parameter to adjust just like you would with `ember serve`; default is **4200** for Ember client, **8200** for Horizon server

The CLI is still a work in progress so while the thinking and a bit of the plumbing have been worked out the command doesn't work yet. How about a PR to push this over the line?

## Getting Started

### Adapter Configuration

For many people wanting to use this addon the first step will be to plugin the **Ember Data** Adapter. Installing an adapter is a snap with Ember-CLI and you can install it either to a particular model(s) or to the entire application by first adding it like so:

```sh
# for the entire app
ember generate adapter application
# for just the 'foo' model
ember generate adapter foo
```

The adapter file specifics will be output by the CLI and will vary based on whether you're using _pod-style_ or not. Regardless, the next step will be edit generated adapter file. You'll want to replace the file contents with the following:

```js
export { default } from 'ember-cli-horizon/adapters/horizon';
```

Ok, you're done with the configuring the adapter. Wherever the adapter's scope comes into play you'll have the Ember "model" stored back to the RethinkDB's "collection" of the same name.

It's worth noting that, at this point, the "real-time" nature of RethinkDB hasn't been turned on but all normal CRUD operations work. To

> **Note:** you do NOT need to configure the adapter at all if you're not interested in integrating to Ember Data but likely most of you are

### Real Time

As previously mentioned, base setup results in a perfectly functioning _non_-real time database. To make some or all of the collections to be updated in real-time is easy and can be accomplished in two distinct ways:

1. **Configuration** - you can start watching for changes on a model after the first `findAll(model)`
2. **Service** - you can add any watcher that Horizon would allow via the `horizon` service

For greater details see the separate "Horizon Service" and "Configuration" sections but as a quick example, if you wanted your experience to perfectly mimic the **EmberFire** experience than just the following to your configuration:

> config/environment.js

```js
var ENV = {
  horizon: {
    realTime: true
  }
}
```

That's it. Now all models which you are using the Horizon Adapter for will report back information in real-time after your first call to `findAll` for the given model.

### Horizon Service

The Horizon service -- which is used by the adapter to due to do it's job -- has a number of useful public interfaces for you to use, here's a quick summary but source code also is commented if you want to dig into it:

#### Discovery

- `status` - gives the connection status with the Horizon server. Valid statuses are: _unconnected, connected, ready, disconnected,_ and  _error_. The typical "working state" is "ready" ("connected" is very transient).
- `isLoggedIn` - a boolean flag indicating whether the user is logged in
- `currentUser` - profile information for currently logged in user
- `authEndpoint` - returns the URL for authentication against the last configured OAuth endpoint


#### Connections

In most cases this will be done for you transparently but if you ever need them you can use:

- `connect` - establish connection with Horizon server; this is done automatically the first time you try and do any CRUD operation with the backend.
- `disconnect` - does what is says on the tin

#### Watching

- `watch(cb, collection, options)` - allows you to setup a changestream to a collection, document, or query
- `isWatched(type)` - returns a boolean flag indicating whether the given "changestream" watcher is in place. Typically "type" would be the name of the collection/model but in more complex query-based changestream's you'll need to rely on _id_ passed back by `watch()`


### Configuration

config/environment.js

```js
    var ENV = {
    // ...
        horizon: {
          host: 'localhost:8181' // where is server
          authType: 'anonymous'  // how do we authorize?
          realTime: ['foo', 'bar'], // what collections should be real-time (boolean or array)

          // Any other config options: http://horizon.io/api/horizon/#constructor
        }
    // ...
    };
```

> valid authType's are _unauthenticated, _anonymous_, and _token_ where "token" implies using a 3rd party provider (google, facebook, etc.) that has appropriate server configuration



## Warnings and shortcomings

- This is currently a work in progress.
    - The fetch adapter and connection should work just fine for basic use cases.
    - I would appreciate any beta testing and feedback.
- There is a streaming adapter in progress, but it is not available yet.
- There are no tests.
    - I still need to figure out just how I'm going to set up automated testing against a real horizon instance.
    - I'm brainstorming on solutions, I promise.
