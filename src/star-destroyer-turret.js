import {THREE} from './three-defs.js';

import {particle_system} from "./particle-system.js";
import {entity} from "./entity.js";


export const star_destroyer_turret = (() => {

  class StarDestroyerTurret extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }


    Destroy() {
      this.particles_.Destroy();
    }

    InitEntity() {
    }

    Update(timeElapsed) {
    }
  }
  
  return {
    ShipEffects: ShipEffects,
  };
})();