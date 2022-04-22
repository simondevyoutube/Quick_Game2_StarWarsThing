import {THREE} from './three-defs.js';

import {particle_system} from "./particle-system.js";
import {entity} from './entity.js';


export const turret_controller = (() => {

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

      this.light_ = new THREE.PointLight(0x80FF80, 1.0, 50.0, 2.0);
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

  const _MAX_POWER = 4.0;
  const _POWER_PER_SHOT = 2.0;
  const _MAX_TARGET_DISTANCE = 500;
  const _MAX_ANGLE = 0.707;

  const _TMP_M0 = new THREE.Matrix4();
  const _TMP_Q0 = new THREE.Quaternion();

  class TurretController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.cooldownTimer_ = 0.0;
      this.cooldownRate_ = 0.2;
      this.powerLevel_ = _MAX_POWER;

      this.offset_ = new THREE.Vector3(0, 0, -18),
      this.shots_ = [];
      this.target_ = null;
    }

    Destroy() {
      this.blasterFX_.Destroy();
      this.blasterFX_ = null;
    }

    InitEntity() {
      const group = this.GetComponent('RenderComponent').group_;
      this.blasterFX_ = new particle_system.ParticleSystem({
          camera: this.params_.camera,
          parent: group,
          texture: './resources/textures/fx/blaster.jpg',
      });
      this.up_ = this.Parent.Quaternion.clone();

      // DEMO
      // const _TMP_M1 = new THREE.Matrix4();

      // _TMP_M0.makeRotationFromQuaternion(this.up_);
      // _TMP_M0.multiply(_TMP_M1.makeRotationX((Math.random() * 2 - 1) * 0.25));
      // _TMP_M0.multiply(_TMP_M1.makeRotationY((Math.random() * 2 - 1) * 0.25));
      // _TMP_M0.multiply(_TMP_M1.makeRotationZ((Math.random() * 2 - 1) * 0.25));
      
      // _TMP_Q0.setFromRotationMatrix(_TMP_M0);

      // this.Parent.SetQuaternion(_TMP_Q0);
    }

    SetupFlashFX_() {
      const group = this.GetComponent('RenderComponent').group_;
      const emitter = new FlashFXEmitter(this.offset_, group);
      emitter.alphaSpline_.AddPoint(0.0, 0.0);
      emitter.alphaSpline_.AddPoint(0.5, 1.0);
      emitter.alphaSpline_.AddPoint(1.0, 0.0);
      
      emitter.colourSpline_.AddPoint(0.0, new THREE.Color(0x80FF80));
      emitter.colourSpline_.AddPoint(1.0, new THREE.Color(0x6AA84F));

      emitter.sizeSpline_.AddPoint(0.0, 0.5);
      emitter.sizeSpline_.AddPoint(0.25, 5.0);
      emitter.sizeSpline_.AddPoint(1.0, 0.25);
      emitter.SetEmissionRate(0);
      emitter.blend_ = 0.0;  
      this.blasterFX_.AddEmitter(emitter);
      emitter.AddParticles(1);
    }

    Fire_() {
      if (this.cooldownTimer_ > 0.0) {
        return;
      }

      if (this.powerLevel_ < _POWER_PER_SHOT) {
        return;
      }

      this.powerLevel_ = Math.max(this.powerLevel_ - _POWER_PER_SHOT, 0.0);

      this.cooldownTimer_ = this.cooldownRate_;

      const fx = this.FindEntity('fx').GetComponent('BlasterSystem');
      const p1 = fx.CreateParticle();
      p1.Start = this.offset_.clone();
      p1.Start.applyQuaternion(this.Parent.Quaternion);
      p1.Start.add(this.Parent.Position);
      p1.End = p1.Start.clone();
      p1.Velocity = this.Parent.Forward.clone().multiplyScalar(2000.0);
      p1.Length = 50.0;
      p1.Colours = [
          new THREE.Color(0.5, 4.0, 0.5), new THREE.Color(0.0, 0.0, 0.0)];
      p1.Life = 2.0;
      p1.TotalLife = 2.0;
      p1.Width = 1.5;

      const loader = this.FindEntity('loader').GetComponent('LoadController');
      loader.LoadSound('./resources/sounds/', 'laser.ogg', (s) => {
        const group = this.GetComponent('RenderComponent').group_;
        group.add(s);
        s.play();  
      });

      this.shots_.push(p1);
      this.SetupFlashFX_();
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

    AcquireTarget_() {
      const pos = this.Parent.Position;
      const colliders = this.params_.grid.FindNear(
          [pos.x, pos.z], [1000, 1000]).filter(
          c => c.entity.Attributes.team == 'allies'
      );

      if (colliders.length == 0) {
        return;
      }

      this.target_ = colliders[0].entity;
    }

    TrackTargets_(timeElapsed) {
      if (!this.target_) {
        this.AcquireTarget_();
        return;
      }

      if (this.target_.Position.distanceTo(this.Parent.Position) > _MAX_TARGET_DISTANCE) {
        this.target_ = null;
        return;
      }

      if (this.target_.IsDead) {
        this.target_ = null;
        return;
      }


      _TMP_M0.lookAt(
        this.Parent.Position, this.target_.Position, THREE.Object3D.DefaultUp);
      _TMP_Q0.setFromRotationMatrix(_TMP_M0);

      const angle = _TMP_Q0.dot(this.up_);
      if (Math.abs(angle) < _MAX_ANGLE) {
        this.target_ = null;
        return;
      }

      const t = 1.0 - Math.pow(0.25, timeElapsed);
      this.Parent.Quaternion.slerp(_TMP_Q0, t);
      this.Parent.SetQuaternion(this.Parent.Quaternion);
      
      if (this.powerLevel_ >= _POWER_PER_SHOT) {
        // Meh
        if (Math.random() < 0.1) {
          this.Fire_();
        }
      }
    }

    Update(timeElapsed) {     
      // DEMO
      // if (Math.random() < 0.005) {
      //   this.Fire_();
      // } 
      this.cooldownTimer_ = Math.max(this.cooldownTimer_ - timeElapsed, 0.0);
      this.powerLevel_ = Math.min(
          this.powerLevel_ + timeElapsed, _MAX_POWER);

      this.TrackTargets_(timeElapsed);
      this.UpdateShots_();

      this.blasterFX_.Update(timeElapsed);
    }
  };

  return {
    TurretController: TurretController,
  };
})();