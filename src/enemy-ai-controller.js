import {THREE} from './three-defs.js';

import {entity} from './entity.js';
import {math} from './math.js';


export const enemy_ai_controller = (() => {
  
  const _TMP_V3_0 = new THREE.Vector3();

  const _COLLISION_FORCE = 25;
  const _WANDER_FORCE = 1;
  const _ATTACK_FORCE = 25;
  const _MAX_TARGET_DISTANCE = 1500;
  const _MAX_ANGLE = 0.9;

  const _TMP_M0 = new THREE.Matrix4();
  const _TMP_Q0 = new THREE.Quaternion();

  class EnemyAIController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.grid_ = params.grid;
      this.Init_();
    }
  
    Init_() {
      this.maxSteeringForce_ = 30;
      this.maxSpeed_  = 100;
      this.acceleration_ = 10;
      this.velocity_ = new THREE.Vector3(0, 0, -1);
      this.wanderAngle_ = 0.0;
      this.quaternion_ = new THREE.Quaternion();
      this.target_ = null;
    }

    ApplySteering_(timeElapsed) {
      // const separationVelocity = this._ApplySeparation(local);
  
      // // Only apply alignment and cohesion to allies
      // const allies = local.filter((e) => {
      //   return (e.Enemy && this._seekGoal.equals(e._seekGoal));
      // });
  
      // const alignmentVelocity = this._ApplyAlignment(allies);
      const originVelocity = this.ApplySeek_(
          this.FindEntity('star-destroyer'));
      const wanderVelocity = this.ApplyWander_();
      const collisionVelocity = this.ApplyCollisionAvoidance_();
      const attackVelocity = this.ApplyAttack_();
  
      const steeringForce = new THREE.Vector3(0, 0, 0);
      // steeringForce.add(separationVelocity);
      // steeringForce.add(alignmentVelocity);
      // steeringForce.add(cohesionVelocity);
      steeringForce.add(originVelocity);
      steeringForce.add(wanderVelocity);
      steeringForce.add(collisionVelocity);
      steeringForce.add(attackVelocity);

      steeringForce.multiplyScalar(this.acceleration_ * timeElapsed);
  
      // // Clamp the force applied
      if (steeringForce.length() > this.maxSteeringForce_ * timeElapsed) {
        steeringForce.normalize();
        steeringForce.multiplyScalar(this.maxSteeringForce_ * timeElapsed);
      }
  
      this.velocity_.add(steeringForce);
  
      // // Clamp velocity
      this.velocity_.normalize();
      const forward = this.velocity_.clone();
      this.velocity_.multiplyScalar(this.maxSpeed_);

      const frameVelocity = this.velocity_.clone();
      frameVelocity.multiplyScalar(timeElapsed);
      frameVelocity.add(this.Parent.Position);

      this.Parent.SetPosition(frameVelocity);

      const t = 1.0 - Math.pow(0.05, timeElapsed);

      _TMP_M0.lookAt(
          new THREE.Vector3(), forward, THREE.Object3D.DefaultUp);
      _TMP_Q0.setFromRotationMatrix(_TMP_M0);
      this.Parent.SetQuaternion(_TMP_Q0);

      // this.quaternion_.setFromUnitVectors(
      //   new THREE.Vector3(0, 1, 0), forward);
      // this.Parent.Quaternion.slerp(this.quaternion_, t);
      // this.Parent.SetQuaternion(this.Parent.Quaternion);
    }

    Update(timeElapsed) {
      if (!this.Parent.Attributes.roughRadius) {
        return;
      }
      this.ApplySteering_(timeElapsed);
      this.MaybeFire_();
    }

    MaybeFire_() {
      // DEMO
      // if (Math.random() < 0.01) {
      //   this.Broadcast({topic: 'player.fire'});
      //   return;
      // }
      if (!this.target_) {
        return;
      }

      const forward = this.Parent.Forward;
      const dirToTarget = this.target_.Position.clone().sub(
          this.Parent.Position);
      dirToTarget.normalize();

      const angle = dirToTarget.dot(forward);
      if (angle > _MAX_ANGLE) {
        this.Broadcast({topic: 'player.fire'});
        return;
      }
    }
  
    ApplyCollisionAvoidance_() {
      const pos = this.Parent.Position;
      const colliders = this.grid_.FindNear([pos.x, pos.z], [500, 500]).filter(
          c => c.entity.ID != this.Parent.ID
      );
  
      // Hardcoded is best
      const starDestroyer = this.FindEntity('star-destroyer');
      if (starDestroyer.Attributes.roughRadius) {
        colliders.push({entity: starDestroyer});
      }

      const force = new THREE.Vector3(0, 0, 0);
  
      for (const c of colliders) {
        const entityPos = c.entity.Position;
        const entityRadius = c.entity.Attributes.roughRadius;
        const dist = entityPos.distanceTo(pos);

        if (dist > (entityRadius + 500)) {
          continue;
        }

        const directionFromEntity = _TMP_V3_0.subVectors(
            pos, entityPos);
        const multiplier = (entityRadius + this.Parent.Attributes.roughRadius) / Math.max(1, (dist - 200));
        directionFromEntity.normalize();
        directionFromEntity.multiplyScalar(multiplier * _COLLISION_FORCE);
        force.add(directionFromEntity);
      }
  
      return force;
    }
  
    ApplyWander_() {
      this.wanderAngle_ += 0.1 * math.rand_range(-2 * Math.PI, 2 * Math.PI);
      const randomPointOnCircle = new THREE.Vector3(
          Math.cos(this.wanderAngle_),
          0,
          Math.sin(this.wanderAngle_));
      const pointAhead = this.Parent.Forward.clone();
      pointAhead.multiplyScalar(20);
      pointAhead.add(randomPointOnCircle);
      pointAhead.normalize();
      return pointAhead.multiplyScalar(_WANDER_FORCE);
    }

    ApplySeek_(destroyer) {
      if (!destroyer.Attributes.roughRadius) {
        return new THREE.Vector3(0, 0, 0);
      }
      const dist = this.Parent.Position.distanceTo(destroyer.Position);
      const radius = destroyer.Attributes.roughRadius;
      const distFactor = Math.max(
          0, ((dist - radius) / (radius * 0.25))) ** 2;
      const direction = destroyer.Position.clone().sub(this.Parent.Position);
      direction.normalize();
  
      const forceVector = direction.multiplyScalar(distFactor);
      return forceVector;
    }

    AcquireTarget_() {
      const pos = this.Parent.Position;
      const enemies = this.params_.grid.FindNear(
          [pos.x, pos.z], [1000, 1000]).filter(
          c => c.entity.Attributes.team == 'allies'
      );

      if (enemies.length == 0) {
        return;
      }

      this.target_ = enemies[0].entity;
    }

    ApplyAttack_() {
      if (!this.target_) {
        this.AcquireTarget_();
        return new THREE.Vector3(0, 0, 0);
      }

      if (this.target_.Position.distanceTo(this.Parent.Position) > _MAX_TARGET_DISTANCE) {
        this.target_ = null;
        return new THREE.Vector3(0, 0, 0);
      }

      if (this.target_.IsDead) {
        this.target_ = null;
        return new THREE.Vector3(0, 0, 0);
      }

      const direction = this.target_.Position.clone().sub(this.Parent.Position);
      direction.normalize();
  
      const dist = this.Parent.Position.distanceTo(this.target_.Position);
      const falloff = math.sat(dist / 200);

      const forceVector = direction.multiplyScalar(_ATTACK_FORCE * falloff);
      return forceVector;
    }
  };

  return {
    EnemyAIController: EnemyAIController,
  };

})();