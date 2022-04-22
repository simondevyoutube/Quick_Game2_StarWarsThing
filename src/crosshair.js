import {THREE} from './three-defs.js';
import {entity} from './entity.js';


export const crosshair = (() => {

  class Crosshair extends entity.Component {
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
      this.element_ = document.createElement('canvas');
      this.context2d_ = this.element_.getContext('2d');
      this.context2d_.canvas.width = size;
      this.context2d_.canvas.height = size;

      this.context2d_.fillStyle = "#FFFFFF";
      this.context2d_.lineWidth = 5;

      this.context2d_.translate(size * 0.5, size * 0.5);
      this.context2d_.rotate(Math.PI / 4);
      this.context2d_.translate(-size * 0.5, -size * 0.5);

      const _DrawLine = () => {
        this.context2d_.translate(size * 0.5, size * 0.5);
        this.context2d_.rotate(Math.PI / 2);
        this.context2d_.translate(-size * 0.5, -size * 0.5);
        this.context2d_.beginPath();
        this.context2d_.moveTo(size * 0.48, size * 0.25);
        this.context2d_.moveTo(size * 0.495, size * 0.45);
        this.context2d_.lineTo(size * 0.505, size * 0.45);
        this.context2d_.lineTo(size * 0.52, size * 0.25);
        this.context2d_.lineTo(size * 0.48, size * 0.25);
        this.context2d_.fill();
      }

      for (let i = 0; i < 4; ++i) {
        _DrawLine();
      }

      this.context2d_.strokeStyle = '#FFFFFF';
      this.context2d_.lineWidth = 3;
      this.context2d_.setTransform(1, 0, 0, 1, 0, 0);
      this.context2d_.beginPath();
      this.context2d_.arc(
          size * 0.5, size * 0.5, size * 0.4,
          Math.PI * -0.25, Math.PI * 0.25);
      this.context2d_.stroke();

      this.context2d_.beginPath();
      this.context2d_.arc(
          size * 0.5, size * 0.5, size * 0.4,
          Math.PI * 0.75, Math.PI * 1.25);
      this.context2d_.stroke();

      const map = new THREE.CanvasTexture(this.context2d_.canvas);
      map.anisotropy = 2;

      this.sprite_ = new THREE.Sprite(
          new THREE.SpriteMaterial({map: map, color: 0xffffff, fog: false}));
      this.sprite_.scale.set(4, 4, 1)
      this.sprite_.position.set(0, 5, 0);
      // msg.value.parent.add(this.sprite_);

      const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
      threejs.uiScene_.add(this.sprite_);
    }

    Update() {
      if (!this.sprite_) {
        return;
      }
      const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');
      const camera = threejs.camera_;

      const ndc = new THREE.Vector3(0, 0, -10);

      this.sprite_.scale.set(0.15, 0.15 * camera.aspect, 1);
      this.sprite_.position.copy(ndc);

      const physics = this.FindEntity('physics').GetComponent('AmmoJSController');
      const forward = this.Parent.Forward.clone();
      forward.multiplyScalar(1000);
      forward.add(this.Parent.Position);

      const hits = physics.RayTest(this.Parent.Position, forward).filter(
          (h) => {
            return h.name != this.Parent.Name;
          }
      );
      if (hits.length > 0) {
        this.sprite_.material.color.setRGB(1, 0, 0);
      } else {
        this.sprite_.material.color.setRGB(1, 1, 1);
      }
    }
  };

  return {
    Crosshair: Crosshair,
  };
})();