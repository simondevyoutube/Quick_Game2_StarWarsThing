import {THREE} from './three-defs.js';
import {entity} from './entity.js';


export const ammojs_component = (() => {

  class AmmoJSRigidBody {
    constructor() {
    }

    Destroy() {
      Ammo.destroy(this.body_);
      Ammo.destroy(this.info_);
      Ammo.destroy(this.shape_);
      Ammo.destroy(this.inertia_);
      Ammo.destroy(this.motionState_);
      Ammo.destroy(this.transform_);
      Ammo.destroy(this.userData_);

      if (this.mesh_) {
        Ammo.destroy(this.mesh_);
      }
    }

    InitBox(pos, quat, size, userData) {
      this.transform_ = new Ammo.btTransform();
      this.transform_.setIdentity();
      this.transform_.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      this.transform_.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
      this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);

      let btSize = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
      this.shape_ = new Ammo.btBoxShape(btSize);
      this.shape_.setMargin(0.05);

      this.inertia_ = new Ammo.btVector3(0, 0, 0);
      this.shape_.calculateLocalInertia(10, this.inertia_);

      this.info_ = new Ammo.btRigidBodyConstructionInfo(10, this.motionState_, this.shape_, this.inertia_);
      this.body_ = new Ammo.btRigidBody(this.info_);

      this.userData_ = new Ammo.btVector3(0, 0, 0);
      this.userData_.userData = userData;
      this.body_.setUserPointer(this.userData_);

      Ammo.destroy(btSize);
    }

    InitMesh(src, pos, quat, userData) {
      const A0 = new Ammo.btVector3(0, 0, 0);
      const A1 = new Ammo.btVector3(0, 0, 0);
      const A2 = new Ammo.btVector3(0, 0, 0);

      const V0 = new THREE.Vector3();
      const V1 = new THREE.Vector3();
      const V2 = new THREE.Vector3();

      this.mesh_ = new Ammo.btTriangleMesh(true, true);

      src.traverse(c => {
        c.updateMatrixWorld(true);
        if (c.geometry) {
          const p = c.geometry.attributes.position.array;
          for (let i = 0; i < c.geometry.index.count; i+=3) {
            const i0 = c.geometry.index.array[i] * 3;
            const i1 = c.geometry.index.array[i+1] * 3;
            const i2 = c.geometry.index.array[i+2] * 3;

            V0.fromArray(p, i0).applyMatrix4(c.matrixWorld);
            V1.fromArray(p, i1).applyMatrix4(c.matrixWorld);
            V2.fromArray(p, i2).applyMatrix4(c.matrixWorld);

            A0.setX(V0.x);
            A0.setY(V0.y);
            A0.setZ(V0.z);
            A1.setX(V1.x);
            A1.setY(V1.y);
            A1.setZ(V1.z);
            A2.setX(V2.x);
            A2.setY(V2.y);
            A2.setZ(V2.z);
            this.mesh_.addTriangle(A0, A1, A2, false);
          }
        }
      });

      this.inertia_ = new Ammo.btVector3(0, 0, 0);
      this.shape_ = new Ammo.btBvhTriangleMeshShape(this.mesh_, true, true);
      this.shape_.setMargin(0.05);
      this.shape_.calculateLocalInertia(10, this.inertia_);

      this.transform_ = new Ammo.btTransform();
      this.transform_.setIdentity();
      this.transform_.getOrigin().setValue(pos.x, pos.y, pos.z);
      this.transform_.getRotation().setValue(quat.x, quat.y, quat.z, quat.w);
      this.motionState_ = new Ammo.btDefaultMotionState(this.transform_);

      this.info_ = new Ammo.btRigidBodyConstructionInfo(10, this.motionState_, this.shape_, this.inertia_);
      this.body_ = new Ammo.btRigidBody(this.info_);

      this.userData_ = new Ammo.btVector3(0, 0, 0);
      this.userData_.userData = userData;
      this.body_.setUserPointer(this.userData_);

      Ammo.destroy(A0);
      Ammo.destroy(A1);
      Ammo.destroy(A2);
    }
  }

  class AmmoJSController extends entity.Component {
    constructor() {
      super();
    }

    Destroy() {
      Ammo.Destroy(this.physicsWorld_);
      Ammo.Destroy(this.solver_);
      Ammo.Destroy(this.broadphase_);
      Ammo.Destroy(this.dispatcher_);
      Ammo.Destroy(this.collisionConfiguration_);
    }

    InitEntity() {
      this.collisionConfiguration_ = new Ammo.btDefaultCollisionConfiguration();
      this.dispatcher_ = new Ammo.btCollisionDispatcher(this.collisionConfiguration_);
      this.broadphase_ = new Ammo.btDbvtBroadphase();
      this.solver_ = new Ammo.btSequentialImpulseConstraintSolver();
      this.physicsWorld_ = new Ammo.btDiscreteDynamicsWorld(
          this.dispatcher_, this.broadphase_, this.solver_, this.collisionConfiguration_);

      this.tmpRayOrigin_ = new Ammo.btVector3();
      this.tmpRayDst_ = new Ammo.btVector3();
      this.rayCallback_ = new Ammo.ClosestRayResultCallback(this.tmpRayOrigin_, this.tmpRayDst_);
    }

    RayTest(start, end) {
      const rayCallback = Ammo.castObject(this.rayCallback_, Ammo.RayResultCallback);
      rayCallback.set_m_closestHitFraction(1);
      rayCallback.set_m_collisionObject(null);

      this.tmpRayOrigin_.setValue(start.x, start.y, start.z);
      this.tmpRayDst_.setValue(end.x, end.y, end.z);
      this.rayCallback_.get_m_rayFromWorld().setValue(start.x, start.y, start.z);
      this.rayCallback_.get_m_rayToWorld().setValue(end.x, end.y, end.z);

      this.physicsWorld_.rayTest(this.tmpRayOrigin_, this.tmpRayDst_, this.rayCallback_);

      const hits = [];
      if (this.rayCallback_.hasHit()) {
        const obj = this.rayCallback_.m_collisionObject;
        const ud0 = Ammo.castObject(obj.getUserPointer(), Ammo.btVector3).userData;

        const point = this.rayCallback_.get_m_hitPointWorld();

        hits.push({
          name: ud0.name,
          position: new THREE.Vector3(point.x(), point.y(), point.z())
        });
      }
      return hits;
    }

    RemoveRigidBody(body) {
      this.physicsWorld_.removeRigidBody(body.body_);
      body.Destroy();
    }

    CreateBox(pos, quat, size, userData) {
      const box = new AmmoJSRigidBody();

      box.InitBox(pos, quat, size, userData);

      this.physicsWorld_.addRigidBody(box.body_);

      box.body_.setActivationState(4);
      box.body_.setCollisionFlags(2);

      return box;
    }

    CreateMesh(src, pos, quat, userData) {
      const mesh = new AmmoJSRigidBody();

      mesh.InitMesh(src, pos, quat, userData);

      this.physicsWorld_.addRigidBody(mesh.body_);

      mesh.body_.setActivationState(4);
      mesh.body_.setCollisionFlags(2);

      return mesh;
    }

    StepSimulation(timeElapsedS) {
      this.physicsWorld_.stepSimulation(timeElapsedS, 10);

      const dispatcher = this.physicsWorld_.getDispatcher();
      const numManifolds = this.dispatcher_.getNumManifolds();
    
      const collisions = {};

      for (let i=0; i < numManifolds; i++) {
        const contactManifold = dispatcher.getManifoldByIndexInternal(i);
        const numContacts = contactManifold.getNumContacts();

        if (numContacts > 0) {
          const rb0 = contactManifold.getBody0();
          const rb1 = contactManifold.getBody1();
          const ud0 = Ammo.castObject(rb0.getUserPointer(), Ammo.btVector3).userData;
          const ud1 = Ammo.castObject(rb1.getUserPointer(), Ammo.btVector3).userData;

          if (!(ud0.name in collisions)) {
            collisions[ud0.name] = [];
          }
          collisions[ud0.name].push(ud1.name);

          if (!(ud1.name in collisions)) {
            collisions[ud1.name] = [];
          }
          collisions[ud1.name].push(ud0.name);
        }
      }

      for (let k in collisions) {
        const e = this.FindEntity(k);
        e.Broadcast({topic: 'physics.collision', value: collisions[k]});
      }
    }

    Update(_) {
    }
  }

  return {
      AmmoJSController: AmmoJSController,
  };
})();