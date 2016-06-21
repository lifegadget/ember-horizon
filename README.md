# Ember-cli-horizon

[![npm](https://img.shields.io/npm/v/ember-cli-horizon.svg)](https://www.npmjs.com/package/ember-cli-horizon)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/jonesetc/ember-cli-horizon/master/LICENSE.md)

An Ember service for managing a Horizon connection, and an adapter to request data from that connection.

## Installation

### Client App

The first step is to get the Ember addon installed:

```sh
ember install ember-cli-horizon
```

### Horizon Server

You're application is now ready to work against a Horizon server (and Rethink database). To install the Horizon server is a simple matter:

```sh
npm install -g horizon
```

Installing the ReThink Database is a bit varied by operating system but straight forward. Use this link to install for your OS: 
[starting the server](http://horizon.io/docs/getting-started/#start-the-server).

Once both are installed, you're ready to start:

```sh
# initialize the server config
horizon init
# startup horizon server and rethink db
horizon serve --dev
```

All the infrastructure is now ready to be used.


## Getting Started

### Adapter Configuration

For many people wanting to use this addon the first step will be to plugin the **Ember Data** Adapter. Installing an adapter is a snap with Ember-CLI and you can install it either to a particular model(s) or to the entire application by first adding it like so:

```sh
# for the entire app
ember generate adapter application
# for just the 'foo' model
ember generate adapter foo
```

The adapter file specifics will be output by the CLI and will vary based on whether you're using _pod-style_ or not. Regardless, the next step will be to edit the generated adapter file. You'll want to replace the file contents with the following:

```js
export { default } from 'ember-cli-horizon/adapters/horizon';
```

Ok, you're done with the configuring the adapter.

> **Note:** you do NOT need to configure the adapter at all if you're not interested in integrating to Ember Data but likely most of you are

### Real Time

ReThink DB -- like Firebase -- is a "real time database" which means that immediately following a change on the server, clients can be immediately updated with "subscritions" to those changes they're interested in. By default this addon will turn on this real-time feature for each model in your application but this is entirely configurable. What this means in practice is that when your application calls `store.findAll()` for a particular model that model will "subscribe" to all future changes. This lazy loading strategy ensures you get active updates on models which you are being used while not paying the cost of getting updates to models that are not.

This approach is the default but you can manage this in your `config/environment.js` file by changing the `horizon.realTime` variable. This variable can take the following values:

- **true** (default) - turn on all models for lazy-loaded real-time participation
- **false** - turn off all models, treat Horizon/ReThink as a typical query based interaction model
- **Array** - you can add an array of models which you would like to leverage the real-time interaction, those not listed will use traditional query based interaction

All of these options relate to how the Horizon _adapter_ will behave. For most of you, the integration with Ember Data (and therefore the adapter) are likely to be all you need to consider. However, there are a fairly unlimited set of configurations available through the Horizon _service_ which comes with this addon. For more on that see the next section.


### Horizon Service

The Horizon service -- which is used by the adapter to due to do it's job -- has a number of useful public interfaces you can leverage; here's a quick summary but source code also is commented if you want to dig into it:

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
- `willWatch(type)` - returns a boolean flag indicating whether the given "changestream" watcher is in place. Typically "type" would be the name of the collection/model but in more complex query-based changestream's you'll need to rely on _id_ passed back by `watch()`


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


### Referential Integrity

Ember model's act as a client-side contract to both the attributes and relationships that a given entity has. In the case of relationships, however, Ember Data does not by itself enforce referential integrity. As an example, given the two models below:

```js
// todo model
export default Model.extend({
  name: attr('string'),
  due: attr('string'),
  ownedBy: belongsTo('person', {inverse: 'owns'})
});
// person model
export default Model.extend({
  name: attr('string'),
  owns: hasMany('todo', {inverse: 'ownedBy'})
});
```

- Use Case 1
  - You add a new TODO and while doing so you set the "belongsTo" relationship `ownedBy` a known Person record
  - Now the TODO correctly points to the owner of the TODO, but ...
  - The explicitly stated "inverse" -- Person's `owns` relationship -- is not aware of the change.
- Use Case 2
  - You delete a Person who has several TODO's assigned to them

## Warnings and shortcomings

- This is currently a work in progress.
    - The fetch adapter and connection should work just fine for basic use cases.
    - I would appreciate any beta testing and feedback.
- There is a streaming adapter in progress, but it is not available yet.
- There are no tests.
    - I still need to figure out just how I'm going to set up automated testing against a real horizon instance.
    - I'm brainstorming on solutions, I promise.
