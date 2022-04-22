import {THREE} from "./three-defs.js";

import {entity} from "./entity.js";


export const crawl_controller = (() => {

  const _VS = `
  out vec2 v_UV;
  
  void main() {
    vec4 mvPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    v_UV = uv;
  }
  `;
  
    const _PS = `
  uniform sampler2D diffuse;
  
  in vec2 v_UV;
  
  void main() {
    vec4 t = texture(diffuse, v_UV);
    if (t.w < 0.5) {
      discard;
    }
    gl_FragColor = t;
    // gl_FragColor = vec4(1.0);
  }
  `;

  class CrawlController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }

    InitEntity() {
      const _TMP_M0 = new THREE.Matrix4();
      const _TMP_Q0 = new THREE.Quaternion();

      _TMP_M0.lookAt(
          new THREE.Vector3(), new THREE.Vector3(-5, 50, -10), THREE.Object3D.DefaultUp);
      _TMP_Q0.setFromRotationMatrix(_TMP_M0);

      this.start_ = _TMP_Q0.clone();

      _TMP_M0.lookAt(
          new THREE.Vector3(), new THREE.Vector3(0, 3, -10), THREE.Object3D.DefaultUp);
      _TMP_Q0.setFromRotationMatrix(_TMP_M0);

      this.end_ = _TMP_Q0.clone();

      this.params_.camera.quaternion.copy(this.start_);

      // const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
      // hemiLight.color.setHSL(0.6, 1, 0.6);
      // hemiLight.groundColor.setHSL(0.095, 1, 0.75);
      // this.params_.scene.add(hemiLight);

      let light = new THREE.DirectionalLight(0xFFFFFF, 0.25);
      light.position.set(0, 0, 0);
      light.target.position.set(0, 0, -1);
      light.updateMatrixWorld();
      light.target.updateMatrixWorld();
      this.params_.scene.add(light);


      const loader = this.FindEntity('loader').GetComponent('LoadController');
      const t = loader.LoadTexture('./resources/', 'crawl.png');
      t.anisotropy = 4;

      const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');

      this.material_ = new THREE.ShaderMaterial( {
        uniforms: {
          diffuse: {value: t}
        },
        vertexShader: _VS,
        fragmentShader: _PS,

        blending: THREE.NormalBlending,
        depthTest: true,
        depthWrite: true,
        transparent: true,
        vertexColors: false,
        alphaTest: 0.5,
        alphaToCoverage: true,
        side: THREE.DoubleSide,
      });

      const geometry = new THREE.PlaneBufferGeometry( 1, 1 );
      this.plane = new THREE.Mesh( geometry, this.material_ );

      // this.plane.position.set(-0.5, -0.0, 0);
      this.plane.scale.set(120, 120);
      this.plane.position.add(threejs.camera_.position);
      this.plane.rotateX(-Math.PI * 0.45);

      // const p = this.plane;
      // this.plane = new THREE.Group();
      // this.plane.add(p);
      // this.plane.scale.set(100, 100);
      // this.plane.position.add(threejs.camera_.position);
      // plane.scale.set(100, 100, 0);

      // msg.value.parent.add(this.sprite_);
      threejs.scene_.add(this.plane);

      this.timeElapsed_ = 0;
    }
  
    Update(timeElapsed) {
      this.timeElapsed_ += timeElapsed;

      const t = 1.0 - Math.pow(0.95, timeElapsed);

      this.params_.camera.quaternion.slerp(this.end_, t);
      const threejs = this.FindEntity('threejs').GetComponent('ThreeJSController');

      // const forward = new THREE.Vector3(0, 0, -1);
      // forward.applyQuaternion(this.params_.camera.quaternion);

      this.plane.position.set(0, -30, -this.timeElapsed_ * 4 + 30);
      // this.plane.position.add(threejs.camera_.position);

      // this.plane.lookAt(forward);

      // this.plane.rotation.set(-Math.PI * 0.5, 0, 0);
      // this.plane.quaternion.premultiply(threejs.camera_.quaternion);
    }
  };

  return {
    CrawlController: CrawlController,
  };

})();