import {THREE} from './three-defs.js';

import {particle_system} from "./particle-system.js";
import {entity} from "./entity.js";

export const xwing_effect = (() => {

  class FireFXEmitter extends particle_system.ParticleEmitter {
    constructor(offset, parent) {
      super();
      this.offset_ = offset;
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
      const origin = this.offset_.clone();

      const life = (Math.random() * 0.85 + 0.15) * 0.2;
      const p = origin;

      const d = new THREE.Vector3(0, 0, 10);

      return {
          position: p,
          size: (Math.random() * 0.5 + 0.5) * 1.0,
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


  class XWingEffects extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    InitEntity() {
      // this.fireFX_ = new particle_system.ParticleSystem({
      //     camera: params.camera,
      //     parent: params.scene,
      //     texture: './resources/textures/fire.png',
      // });

      const group = this.GetComponent('RenderComponent').group_;
      this.blasterFX_ = new particle_system.ParticleSystem({
          camera: this.params_.camera,
          parent: group,
          texture: './resources/textures/fx/fire.png',
      });

      const x = 0.8 * 4;
      const y1 = 1.65 * 4;
      const y2 = -0.75 * 4;
      const z = -2.7 * 4;
      this.offsets_ = [
          new THREE.Vector3(-x, y1, -z),
          new THREE.Vector3(x, y1, -z),
          new THREE.Vector3(-x, -y2, -z),
          new THREE.Vector3(x, -y2, -z),
      ];
      for (let i = 0; i < this.offsets_.length; ++i) {
        this.offsets_[i].add(this.params_.offset);
      }
      this.offsetIndex_ = 0;

      this.SetupFireFX_();
    }

    Destroy() {
      this.blasterFX_.Destroy();
      this.blasterFX_ = null;
    }

    SetupFireFX_() {
      for (let i = 0; i < 4; ++i) {
        const emitter = new FireFXEmitter(this.offsets_[i], this.Parent);
        emitter.alphaSpline_.AddPoint(0.0, 0.0);
        emitter.alphaSpline_.AddPoint(0.7, 1.0);
        emitter.alphaSpline_.AddPoint(1.0, 0.0);
        
        emitter.colourSpline_.AddPoint(0.0, new THREE.Color(0xbb2909));
        emitter.colourSpline_.AddPoint(1.0, new THREE.Color(0x701a08));
        
        emitter.sizeSpline_.AddPoint(0.0, 0.5);
        emitter.sizeSpline_.AddPoint(0.25, 2.0);
        emitter.sizeSpline_.AddPoint(0.75, 0.5);
        emitter.sizeSpline_.AddPoint(1.0, 0.25);
        emitter.SetEmissionRate(500);
        emitter.blend_ = 0.0;  
        this.blasterFX_.AddEmitter(emitter);
        emitter.AddParticles(10);
      }
    }

    Update(timeElapsed) {
      this.blasterFX_.Update(timeElapsed);
    }
  }
  
  return {
    XWingEffects: XWingEffects,
  };
})();