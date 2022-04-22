import {THREE} from './three-defs.js';

import {entity} from './entity.js';


export const health_controller = (() => {

  class HealthController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    InitEntity() {
      this.Parent.Attributes.health = this.params_.maxHealth;
      this.Parent.Attributes.maxHealth = this.params_.maxHealth;
      this.Parent.Attributes.shields = 0;
      this.Parent.Attributes.maxShields = 0;

      if (this.params_.shields) {
        this.Parent.Attributes.shields = this.params_.shields;
        this.Parent.Attributes.maxShields = this.params_.shields;
      }
      this.Parent.Attributes.dead = false;
    }

    InitComponent() {
      this.RegisterHandler_('player.hit', (m) => { this.OnHit_(m); });
      this.RegisterHandler_('physics.collision', (m) => { this.OnCollision_(m); });
    }

    OnCollision_() {
      if (this.Parent.Attributes.dead) {
        return;
      }

      if (this.params_.ignoreCollisions) {
        return;
      }

      this.TakeDamage_(1000000);
    }

    OnHit_(msg) {
      if (this.Parent.Attributes.dead) {
        return;
      }

      const spawner = this.FindEntity('spawners').GetComponent('ShipSmokeSpawner');
      spawner.Spawn(this.Parent);

      this.TakeDamage_(msg.value);
    }

    TakeDamage_(dmg) {
      if (this.Parent.Attributes.maxShields) {
        this.Parent.Attributes.shields -= dmg;
        if (this.Parent.Attributes.shields < 0) {
          dmg = Math.abs(this.Parent.Attributes.shields);
          this.Parent.Attributes.shields = 0;
        } else {
          dmg = 0;
        }
      }
      this.Parent.Attributes.health -= dmg;

      this.Broadcast({topic: 'health.damage'});

      if (this.Parent.Attributes.health <= 0) {
        this.Parent.Attributes.dead = true;
        this.Broadcast({topic: 'health.dead'});
        this.Parent.SetDead(true);
        const e = this.FindEntity('spawners').GetComponent('ExplosionSpawner').Spawn(this.Parent.Position);
        e.Broadcast({topic: 'health.dead'});
      }
    }

    Update(_) {
      // DEMO
      // if (Math.random() < 0.0005) {
      //   this.OnHit_({value: 0});
      // }
    }
  };

  return {
    HealthController: HealthController
  };
})();