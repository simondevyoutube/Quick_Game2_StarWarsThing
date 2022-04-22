import {THREE} from './three-defs.js';

import {entity} from './entity.js';


export const basic_rigid_body = (() => {

  class BasicRigidBody extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    Destroy() {
      this.FindEntity('physics').GetComponent('AmmoJSController').RemoveRigidBody(this.body_);
    }

    InitEntity() {
      const pos = this.Parent.Position;
      const quat = this.Parent.Quaternion;

      this.body_ = this.FindEntity('physics').GetComponent('AmmoJSController').CreateBox(
          pos, quat, this.params_.box, {name: this.Parent.Name});
      
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
      this.debug_ = new THREE.Mesh(geometry, material);
      this.debug_.scale.copy(this.params_.box);

      this.Parent.Attributes.roughRadius = Math.max(
          this.params_.box.x,
          Math.max(this.params_.box.y, this.params_.box.z));
      this.Broadcast({topic: 'physics.loaded'});
    }

    InitComponent() {
      this.RegisterHandler_('update.position', (m) => { this.OnPosition_(m); });
      this.RegisterHandler_('update.rotation', (m) => { this.OnRotation_(m); });
      this.RegisterHandler_('physics.collision', (m) => { this.OnCollision_(m); });
    }

    OnCollision_() {
    }

    OnPosition_(m) {
      this.OnTransformChanged_();
    }

    OnRotation_(m) {
      this.OnTransformChanged_();
    }

    OnTransformChanged_() {
      const pos = this.Parent.Position;
      const quat = this.Parent.Quaternion;
      const ms = this.body_.motionState_;
      const t = this.body_.transform_;
      
      ms.getWorldTransform(t);
      t.setIdentity();
      t.getOrigin().setValue(pos.x, pos.y, pos.z);
      t.getRotation().setValue(quat.x, quat.y, quat.z, quat.w);
      ms.setWorldTransform(t);

      const origin = pos;
      this.debug_.position.copy(origin);
      this.debug_.quaternion.copy(quat);
    }

    Update(_) {
    }
  };

  return {
    BasicRigidBody: BasicRigidBody,
  };
})();