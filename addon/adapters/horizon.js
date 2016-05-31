import Adapter from "ember-data/adapter";
import Horizon from "npm:@horizon/client";

export default Adapter.extend({
    horizon: Horizon
});
