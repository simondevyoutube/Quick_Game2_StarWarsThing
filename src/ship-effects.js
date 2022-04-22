import {THREE} from './three-defs.js';

import {particle_system} from "./particle-system.js";
import {entity} from "./entity.js";

export const ship_effect = (() => {

  class SmokeFXEmitter extends particle_system.ParticleEmitter {
    constructor(offset, parent) {
      super();
      this.parent_ = parent;
      this.offset_ = offset;
      this.blend_ = 1.0;
    }

    OnUpdate_() {
    }

    AddParticles(num) {
      for (let i = 0; i < num; ++i) {
        this.particles_.push(this.CreateParticle_());
      }
    }

    CreateParticle_() {
      const life = (Math.random() * 0.85 + 0.15) * 4.0;
      const p = this.offset_.clone().applyQuaternion(this.parent_.Quaternion).add(this.parent_.Position);
      const d = new THREE.Vector3(0, 0, 0);

      return {
          position: p,
          size: (Math.random() * 0.5 + 0.5) * 5.0,
          colour: new THREE.Color(),
          alpha: 1.0,
          life: life,
          maxLife: life,
          rotation: Math.random() * 2.0 * Math.PI,
          velocity: d,
          blend: this.blend_,
          drag: 1.0,
      };
    }
  };


  class ShipEffects extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.particles_ = null;
      this.emitter_ = null;
    }


    Destroy() {
      this.particles_.Destroy();
      this.particles_ = null;
    }

    InitEntity() {
      this.particles_ = new particle_system.ParticleSystem({
          camera: this.params_.camera,
          parent: this.params_.scene,
          texture: './resources/textures/fx/smoke.png',
      });
      this.OnDamaged_();
    }

    OnDamaged_() {
      const emitter = new SmokeFXEmitter(new THREE.Vector3(0, 0, 5), this.Parent);
      emitter.alphaSpline_.AddPoint(0.0, 0.0);
      emitter.alphaSpline_.AddPoint(0.7, 1.0);
      emitter.alphaSpline_.AddPoint(1.0, 0.0);
      
      emitter.colourSpline_.AddPoint(0.0, new THREE.Color(0x808080));
      emitter.colourSpline_.AddPoint(1.0, new THREE.Color(0x404040));
      
      emitter.sizeSpline_.AddPoint(0.0, 0.5);
      emitter.sizeSpline_.AddPoint(0.25, 2.0);
      emitter.sizeSpline_.AddPoint(0.75, 4.0);
      emitter.sizeSpline_.AddPoint(1.0, 10.0);
      emitter.SetEmissionRate(50);
      emitter.SetLife(3.0);
      emitter.blend_ = 1.0;
      this.particles_.AddEmitter(emitter);
      emitter.AddParticles(10);

      this.emitter_ = emitter;
    }

    Update(timeElapsed) {
      this.particles_.Update(timeElapsed);

      if (!this.emitter_.IsAlive) {
        this.Parent.SetDead(true);
        return;
      }
      if (this.params_.target.IsDead) {
        this.emitter_.SetLife(0.0);
        return;
      }
      this.Parent.SetPosition(this.params_.target.Position);
    }
  }
  
  return {
    ShipEffects: ShipEffects,
  };
})();