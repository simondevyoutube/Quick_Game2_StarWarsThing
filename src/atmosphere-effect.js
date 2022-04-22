import {THREE} from './three-defs.js';

import {particle_system} from "./particle-system.js";
import {entity} from "./entity.js";


export const atmosphere_effect = (() => {

  class AtmosphereFXEmitter extends particle_system.ParticleEmitter {
    constructor(parent) {
      super();
      this.parent_ = parent;
      this.blend_ = 0.0;
    }

    OnUpdate_() {
    }

    AddParticles(num) {
      for (let i = 0; i < num; ++i) {
        this.particles_.push(this.CreateParticle_());
      }
    }

    CreateParticle_() {
      const radius = 50.0;
      const p = new THREE.Vector3(
          (Math.random() * 2 - 1) * radius,
          (Math.random() * 2 - 1) * radius,
          (Math.random() * 2 - 1) * radius).add(this.parent_.Position);

      const life = 1.0;

      const d = this.parent_.Forward.clone().multiplyScalar(-100);

      return {
          position: p,
          size: (Math.random() * 0.75 + 0.25) * 1.0,
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


  class AtmosphereEffect extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    InitEntity() {
      this.particles_ = new particle_system.ParticleSystem({
          camera: this.params_.camera,
          parent: this.params_.scene,
          texture: './resources/textures/fx/smoke.png',
      });

      this.SetupFX_();
    }

    Destroy() {
      this.particles_.Destroy();
      this.particles_ = null;
    }

    SetupFX_() {
      const emitter = new AtmosphereFXEmitter(this.Parent);
      emitter.alphaSpline_.AddPoint(0.0, 0.0);
      emitter.alphaSpline_.AddPoint(0.1, 0.5);
      emitter.alphaSpline_.AddPoint(1.0, 0.0);
      
      emitter.colourSpline_.AddPoint(0.0, new THREE.Color(0xFFFFFF));
      emitter.colourSpline_.AddPoint(1.0, new THREE.Color(0xFFFFFF));
      
      emitter.sizeSpline_.AddPoint(0.0, 2.0);
      emitter.sizeSpline_.AddPoint(1.0, 2.0);
      emitter.blend_ = 1.0;
      this.particles_.AddEmitter(emitter);
      emitter.SetEmissionRate(200);
      emitter.AddParticles(1);
    }

    Update(timeElapsed) {
      this.particles_.Update(timeElapsed);
    }
  }
  
  return {
    AtmosphereEffect: AtmosphereEffect,
  };
})();