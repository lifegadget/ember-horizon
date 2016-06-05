# Ember-cli-horizon

An Ember service for managing a Horizon connection, and an adapter to request data from that connection.

## Installation

`ember install ember-cli-horizon`

## Simple documentation

### Configuration

config/environment.js

```js
    var ENV = {
    // ...
        horizon: {
            host: 'localhost:8181'
            // Any other config options: http://horizon.io/api/horizon/#constructor
        }
    // ...
    };
```

### HorizonConnectionService

app/foo/component.js

```js
import Ember from 'ember';
import { HorizonConnectionService } from 'ember-cli-horizon/services/horizon-connection';

export default Ember.Component.extend({
    horizonConnection: Ember.inject.service(),

    init() {
        this._super(...arguments);
        const horizonConnection = this.get('horizonConnection');
        if (horizonConnection.isReady) {
            someMethodThatUsesHorizon(horizonConnection.hz);
        } else {
            horizonConnection.connect().then(hz => {
                if (this.isDestroying || this.isDestroyed) {
                    return;
                }

                someMethodThatUsesHorizon(hz);
            }); // Should also catch a connection error here and handle it
        }
    }
})
```

### HorizonAdapter

app/foo/adapter.js

```js
export { default } from 'ember-cli-horizon/adapters/horizon';
```

Now just use the foo model like any other. No other work required. Note that this naively maps EmberData model name to Horizon collection name. I haven't figured out a good way to alter this mapping without making any silly couplings that I'd like to avoid, let me know if you have any ideas.

## Warnings and shortcomings

- This is currently a work in progress.
    - The fetch adapter and connection should work just fine for basic use cases.
    - I would appreciate any beta testing and feedback.
- There is a streaming adapter in progress, but it is not available yet.
- There are no tests.
    - I still need to figure out just how I'm going to set up automated testing against a real horizon instance.
    - I'm brainstorming on solutions, I promise.
