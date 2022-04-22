import {THREE} from './three-defs.js';

import {particle_system} from "./particle-system.js";
import {entity} from './entity.js';


export const tie_fighter_controller = (() => {

  class FlashFXEmitter extends particle_system.ParticleEmitter {
    constructor(offset, parent) {
      super();
      this.offset_ = offset;
      this.parent_ = parent;
      this.blend_ = 0.0;
      this.light_ = null;
      this.life_ = 1.0;
      this.maxLife_ = 1.0;
    }

    OnDestroy() {
      this.light_.parent.remove(this.light_);
    }

    OnUpdate_(timeElapsed) {
      if (!this.light_) {
        return;
      }
      this.life_ = Math.max(0.0, this.life_ - timeElapsed);
      this.light_.intensity = 20.0 * (this.life_ / this.maxLife_);
    }

    AddParticles(num) {
      for (let i = 0; i < num; ++i) {
        this.particles_.push(this.CreateParticle_());
      }
    }

    CreateParticle_() {
      const origin = this.offset_.clone();

      const life = 0.2;
      const p = origin;

      const d = new THREE.Vector3(0, 0, 0);

      // DEMO
      this.light_ = new THREE.PointLight(0xFF8080, 20.0, 20.0, 2.0);
      this.light_.position.copy(origin);
      this.life_ = life;
      this.maxLife_ = life;
      this.parent_.add(this.light_);

      return {
          position: p,
          size: 2.0,
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

  class TieFighterController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.cooldownTimer_ = 0.0;
      this.cooldownRate_ = 0.1;
      this.powerLevel_ = 0.0;

      const x = 0.6 * 4;
      const y1 = 0.0  * 4;
      const z = 0.8 * 4;
      this.offsets_ = [
          new THREE.Vector3(-x, y1, -z),
          new THREE.Vector3(x, y1, -z),
      ];
      this.shots_ = [];
      this.offsetIndex_ = 0;
    }

    Destroy() {
      this.blasterFX_.Destroy();
      this.blasterFX_ = null;
    }

    InitComponent() {
      this.RegisterHandler_('player.fire', (m) => this.OnFire_(m));
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
          texture: './resources/textures/fx/blaster.jpg',
      });
    }

    SetupFlashFX_(index) {
      const group = this.GetComponent('RenderComponent').group_;
      const emitter = new FlashFXEmitter(this.offsets_[index], group);
      emitter.alphaSpline_.AddPoint(0.0, 0.0);
      emitter.alphaSpline_.AddPoint(0.5, 1.0);
      emitter.alphaSpline_.AddPoint(1.0, 0.0);
      
      emitter.colourSpline_.AddPoint(0.0, new THREE.Color(0x80FF80));
      emitter.colourSpline_.AddPoint(1.0, new THREE.Color(0x6AA84F));
      
      emitter.sizeSpline_.AddPoint(0.0, 0.5);
      emitter.sizeSpline_.AddPoint(0.25, 2.0);
      emitter.sizeSpline_.AddPoint(1.0, 0.25);
      emitter.SetEmissionRate(0);
      emitter.blend_ = 0.0;  
      this.blasterFX_.AddEmitter(emitter);
      emitter.AddParticles(1);
    }

    OnFire_() {
      if (this.cooldownTimer_ > 0.0) {
        return;
      }

      if (this.powerLevel_ < 0.4) {
        return;
      }

      this.powerLevel_ = Math.max(this.powerLevel_ - 0.4, 0.0);

      this.cooldownTimer_ = this.cooldownRate_;
      this.offsetIndex_ = (this.offsetIndex_ + 1) % 2;

      const fx = this.FindEntity('fx').GetComponent('BlasterSystem');
      const p1 = fx.CreateParticle();
      p1.Start = this.offsets_[this.offsetIndex_].clone();
      p1.Start.applyQuaternion(this.Parent.Quaternion);
      p1.Start.add(this.Parent.Position);
      p1.End = p1.Start.clone();
      p1.Velocity = this.Parent.Forward.clone().multiplyScalar(2000.0);
      p1.Length = 50.0;
      p1.Colours = [
          new THREE.Color(0.5, 4.0, 0.5), new THREE.Color(0.0, 0.0, 0.0)];
      p1.Life = 5.0;
      p1.TotalLife = 5.0;
      p1.Width = 2.5;

      const loader = this.FindEntity('loader').GetComponent('LoadController');
      loader.LoadSound('./resources/sounds/', 'laser.ogg', (s) => {
        const group = this.GetComponent('RenderComponent').group_;
        group.add(s);
        s.play();  
      });
      
      this.shots_.push(p1);
      this.SetupFlashFX_(this.offsetIndex_);
    }

    UpdateShots_() {
      this.shots_ = this.shots_.filter(p => {
        return p.Life > 0.0;
      });

      const physics = this.FindEntity('physics').GetComponent('AmmoJSController');
      for (let s of this.shots_) {
        const hits = physics.RayTest(s.Start, s.End);
        for (let h of hits) {
          if (h.name == this.Parent.Name) {
            continue;
          }
          const e = this.FindEntity(h.name);
          e.Broadcast({topic: 'player.hit', value: this.params_.blasterStrength});
          s.Life = 0.0;

          const explosion = this.FindEntity('spawners').GetComponent('TinyExplosionSpawner')
          explosion.Spawn(h.position);    
        }
      }
    }

    Update(timeElapsed) {
      this.cooldownTimer_ = Math.max(this.cooldownTimer_ - timeElapsed, 0.0);
      this.powerLevel_ = Math.min(this.powerLevel_ + timeElapsed, 4.0);

      this.UpdateShots_();
      this.blasterFX_.Update(timeElapsed);
    }
  };

  return {
    TieFighterController: TieFighterController,
  };
})();