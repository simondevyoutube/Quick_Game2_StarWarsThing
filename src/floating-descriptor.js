import {THREE} from './three-defs.js';
import {entity} from './entity.js';


export const floating_descriptor = (() => {

  class FloatingDescriptor extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.visible_ = true;
    }

    Destroy() {
      if (!this.sprite_) {
        this.visible_ = false;
        return;
      }

      this.sprite_.traverse(c => {
        if (c.material) {
          let materials = c.material;
          if (!(c.material instanceof Array)) {
            materials = [c.material];
          }
          for (let m of materials) {
            m.dispose();
          }
        }

        if (c.geometry) {
          c.geometry.dispose();
        }
      });
      if (this.sprite_.parent) {
        this.sprite_.parent.remove(this.sprite_);
      }
    }

    InitComponent() {
      this.RegisterHandler_(
          'render.loaded', (m) => this.OnCreateSprite_(m));
      this.RegisterHandler_(
          'health.death', (m) => { this.OnDeath_(m); });
    }

    OnDeath_() {
      this.Destroy();
    }

    OnCreateSprite_(msg) {
      if (!this.visible_) {
        return;
      }

      const size = 128;
      const hexSize = 0.4;
      const crosshairSize = 0.4;
      const offset = -8;
      this.element_ = document.createElement('canvas');
      this.context2d_ = this.element_.getContext('2d');
      this.context2d_.canvas.width = size;
      this.context2d_.canvas.height = size;
      this.context2d_.beginPath();
      this.context2d_.moveTo(
        size * 0.5 + size * hexSize * Math.sin(0),
        size * 0.5 + offset + size * hexSize * Math.cos(0));
      for (let i = 0; i < 7; ++i) {
        this.context2d_.lineTo(
          size * 0.5 + size * hexSize * Math.sin(i * 2 * Math.PI / 6),
          size * 0.5 + offset + size * hexSize * Math.cos(i * 2 * Math.PI / 6));
      }
      this.context2d_.fillStyle = "#FF0000";
      this.context2d_.fill();
      this.context2d_.beginPath();
      this.context2d_.arc(
          size * 0.5, size * 0.5 + offset, size * 0.5 * crosshairSize,
          0, 2 * Math.PI);
      this.context2d_.strokeStyle = '#FFFFFF';
      this.context2d_.lineWidth = 5;
      this.context2d_.stroke();
      this.context2d_.beginPath();
      this.context2d_.moveTo(size * 0.5, size * 0.2 + offset);
      this.context2d_.lineTo(size * 0.5, size * 0.8 + offset);
      this.context2d_.stroke();
      this.context2d_.beginPath();
      this.context2d_.moveTo(size * 0.2, size * 0.5 + offset);
      this.context2d_.lineTo(size * 0.8, size * 0.5 + offset);
      this.context2d_.stroke();
      this.context2d_.fillStyle = '#FFF';
      this.context2d_.font = "bold 24px Arial";
      this.context2d_.textAlign = 'center';
      this.context2d_.fillText('DESTROY', size * 0.5, size - 0);

      const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');

      const map = new THREE.CanvasTexture(this.context2d_.canvas);
      map.anisotropy = 2;

      this.sprite_ = new THREE.Sprite(
          new THREE.SpriteMaterial({
              map: map,
              color: 0xffffff,
              fog: false,
              depthTest: false,
              depthWrite: false,
          }));
      // this.sprite_.scale.set(0.2, 0.2, 1)
      this.sprite_.scale.set(8, 8, 1)
      this.sprite_.position.set(0, 20, 0);

      // msg.value.parent.add(this.sprite_);
      threejs.uiScene_.add(this.sprite_);
    }

    Update() {
      if (!this.sprite_) {
        return;
      }
      const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
      const camera = threejs.camera_;
      const ndc = new THREE.Vector3(0, 30, 0);
      ndc.applyQuaternion(camera.quaternion);
      ndc.add(this.Parent.Position);
      ndc.project(camera);

      this.sprite_.visible = true;

      if (ndc.z < -1 || ndc.z > 1) {
        this.sprite_.visible = false;
      }
      ndc.unproject(threejs.uiCamera_);
      ndc.z = -10;

      this.sprite_.scale.set(0.15 / camera.aspect, 0.15, 1);
      this.sprite_.position.copy(ndc);
    }
  };

  return {
    FloatingDescriptor: FloatingDescriptor,
  };
})();