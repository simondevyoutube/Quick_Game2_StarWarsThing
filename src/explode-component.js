import {THREE} from './three-defs.js';

import {entity} from './entity.js';

import {particle_system} from "./particle-system.js";
import {math} from './math.js';


export const explode_component = (() => {

  class ExplosionEffectEmitter extends particle_system.ParticleEmitter {
    constructor(origin) {
      super();
      this.origin_ = origin.clone();
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
      const radius = 1.0;
      const life = (Math.random() * 0.75 + 0.25) * 2.0;
      const p = new THREE.Vector3(
          (Math.random() * 2 - 1) * radius,
          (Math.random() * 2 - 1) * radius,
          (Math.random() * 2 - 1) * radius);

      const d = p.clone().normalize();
      p.copy(d);
      p.multiplyScalar(radius);
      p.add(this.origin_);
      d.multiplyScalar(50.0);

      return {
          position: p,
          size: (Math.random() * 0.5 + 0.5) * 5.0,
          colour: new THREE.Color(),
          alpha: 0.0,
          life: life,
          maxLife: life,
          rotation: Math.random() * 2.0 * Math.PI,
          velocity: d,
          blend: this.blend_,
          drag: 0.9,
      };
    }
  };

  class TinyExplosionEffectEmitter extends particle_system.ParticleEmitter {
    constructor(origin) {
      super();
      this.origin_ = origin.clone();
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
      const radius = 1.0;
      const life = (Math.random() * 0.75 + 0.25) * 2.0;
      const p = new THREE.Vector3(
          (Math.random() * 2 - 1) * radius,
          (Math.random() * 2 - 1) * radius,
          (Math.random() * 2 - 1) * radius);

      const d = p.clone().normalize();
      p.copy(d);
      p.multiplyScalar(radius);
      p.add(this.origin_);
      d.multiplyScalar(25.0);

      return {
          position: p,
          size: (Math.random() * 0.5 + 0.5) * 5.0,
          colour: new THREE.Color(),
          alpha: 0.0,
          life: life,
          maxLife: life,
          rotation: Math.random() * 2.0 * Math.PI,
          velocity: d,
          blend: this.blend_,
          drag: 0.75,
      };
    }
  };

  class ExplodeEffect extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;

      this.group_ = new THREE.Group();
      params.scene.add(this.group_);

      this.particles_ = new particle_system.ParticleSystem({
          camera: params.camera,
          parent: params.scene,
          texture: './resources/textures/fx/fire.png',
      });
      this.timer_ = 10.0;
    }

    Destroy() {
      this.particles_.Destroy();
      this.group_.parent.remove(this.group_);
    }

    InitEntity() {
      this.group_.position.copy(this.Parent.Position);
      const loader = this.FindEntity('loader').GetComponent('LoadController');
      loader.LoadSound('./resources/sounds/', 'explosion.ogg', (s) => {
        this.group_.add(s);
        s.setRefDistance(100);
        s.setMaxDistance(1000);
        s.play();  
      });

      for (let i = 0; i < 3; ++i) {
        const r = 4.0;
        const p = new THREE.Vector3(
            (Math.random() * 2 - 1) * r,
            (Math.random() * 2 - 1) * r,
            (Math.random() * 2 - 1) * r);
        p.add(this.Parent.Position);

        let emitter = new ExplosionEffectEmitter(p);
        emitter.alphaSpline_.AddPoint(0.0, 0.0);
        emitter.alphaSpline_.AddPoint(0.5, 1.0);
        emitter.alphaSpline_.AddPoint(1.0, 0.0);
        
        emitter.colourSpline_.AddPoint(0.0, new THREE.Color(0x800000));
        emitter.colourSpline_.AddPoint(0.3, new THREE.Color(0xFF0000));
        emitter.colourSpline_.AddPoint(0.4, new THREE.Color(0xdeec42));
        emitter.colourSpline_.AddPoint(1.0, new THREE.Color(0xf4a776));
        
        emitter.sizeSpline_.AddPoint(0.0, 0.5);
        emitter.sizeSpline_.AddPoint(0.5, 3.0);
        emitter.sizeSpline_.AddPoint(1.0, 0.5);
        emitter.blend_ = 0.0;
        emitter.delay_ = i * 0.5;
        emitter.AddParticles(200);
  
        this.particles_.AddEmitter(emitter);
  
        emitter = new ExplosionEffectEmitter(p);
        emitter.alphaSpline_.AddPoint(0.0, 0.0);
        emitter.alphaSpline_.AddPoint(0.7, 1.0);
        emitter.alphaSpline_.AddPoint(1.0, 0.0);
        
        emitter.colourSpline_.AddPoint(0.0, new THREE.Color(0x000000));
        emitter.colourSpline_.AddPoint(1.0, new THREE.Color(0x000000));
        
        emitter.sizeSpline_.AddPoint(0.0, 0.5);
        emitter.sizeSpline_.AddPoint(0.5, 4.0);
        emitter.sizeSpline_.AddPoint(1.0, 4.0);
        emitter.blend_ = 1.0;
        emitter.delay_ = i * 0.5 + 0.25;
        emitter.AddParticles(50);
  
        this.particles_.AddEmitter(emitter);
      }
    }

    Update(timeElapsed) {
      this.particles_.Update(timeElapsed);
      this.timer_ -= timeElapsed;
      if (this.timer_ <= 0) {
        this.Parent.SetDead(true);
      }
    }
  };

  class TinyExplodeEffect extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;

      this.group_ = new THREE.Group();
      params.scene.add(this.group_);

      this.particles_ = new particle_system.ParticleSystem({
          camera: params.camera,
          parent: params.scene,
          texture: './resources/textures/fx/fire.png',
      });
      this.timer_ = 10.0;
    }

    Destroy() {
      this.particles_.Destroy();
      this.group_.parent.remove(this.group_);
    }

    InitEntity() {
      this.group_.position.copy(this.Parent.Position);
      const loader = this.FindEntity('loader').GetComponent('LoadController');
      loader.LoadSound('./resources/sounds/', 'explosion.ogg', (s) => {
        this.group_.add(s);
        s.setRefDistance(10);
        s.setMaxDistance(5000);
        s.play();  
      });

      const p = this.Parent.Position.clone();

      let emitter = new TinyExplosionEffectEmitter(p);
      emitter.alphaSpline_.AddPoint(0.0, 0.0);
      emitter.alphaSpline_.AddPoint(0.5, 1.0);
      emitter.alphaSpline_.AddPoint(1.0, 0.0);
      
      emitter.colourSpline_.AddPoint(0.0, new THREE.Color(0x800000));
      emitter.colourSpline_.AddPoint(0.3, new THREE.Color(0xFF0000));
      emitter.colourSpline_.AddPoint(0.4, new THREE.Color(0xdeec42));
      emitter.colourSpline_.AddPoint(1.0, new THREE.Color(0xf4a776));
      
      emitter.sizeSpline_.AddPoint(0.0, 0.5);
      emitter.sizeSpline_.AddPoint(0.5, 3.0);
      emitter.sizeSpline_.AddPoint(1.0, 0.5);
      emitter.blend_ = 0.0;
      emitter.AddParticles(100);

      this.particles_.AddEmitter(emitter);

      emitter = new TinyExplosionEffectEmitter(p);
      emitter.alphaSpline_.AddPoint(0.0, 0.0);
      emitter.alphaSpline_.AddPoint(0.7, 1.0);
      emitter.alphaSpline_.AddPoint(1.0, 0.0);
      
      emitter.colourSpline_.AddPoint(0.0, new THREE.Color(0x000000));
      emitter.colourSpline_.AddPoint(1.0, new THREE.Color(0x000000));
      
      emitter.sizeSpline_.AddPoint(0.0, 0.5);
      emitter.sizeSpline_.AddPoint(0.5, 4.0);
      emitter.sizeSpline_.AddPoint(1.0, 4.0);
      emitter.blend_ = 1.0;
      emitter.delay_ = 0.25;
      emitter.AddParticles(50);

      this.particles_.AddEmitter(emitter);
    }

    Update(timeElapsed) {
      this.particles_.Update(timeElapsed);
      this.timer_ -= timeElapsed;
      if (this.timer_ <= 0) {
        this.Parent.SetDead(true);
      }
    }
  };

  return {
    ExplodeEffect: ExplodeEffect,
    TinyExplodeEffect: TinyExplodeEffect,
  };
})();