import {THREE, OrbitControls} from './three-defs.js';

import {entity} from "./entity.js";


export const threejs_component = (() => {

    const _NOISE_GLSL = `
  vec3 mod289(vec3 x)
  {
      return x - floor(x / 289.0) * 289.0;
  }

  vec4 mod289(vec4 x)
  {
      return x - floor(x / 289.0) * 289.0;
  }

  vec4 permute(vec4 x)
  {
      return mod289((x * 34.0 + 1.0) * x);
  }

  vec4 taylorInvSqrt(vec4 r)
  {
      return 1.79284291400159 - r * 0.85373472095314;
  }

  vec4 snoise(vec3 v)
  {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);

      // First corner
      vec3 i  = floor(v + dot(v, vec3(C.y)));
      vec3 x0 = v   - i + dot(i, vec3(C.x));

      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.x;
      vec3 x2 = x0 - i2 + C.y;
      vec3 x3 = x0 - 0.5;

      // Permutations
      i = mod289(i); // Avoid truncation effects in permutation
      vec4 p =
        permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                              + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      // Gradients: 7x7 points over a square, mapped onto an octahedron.
      // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
      vec4 j = p - 49.0 * floor(p / 49.0);  // mod(p,7*7)

      vec4 x_ = floor(j / 7.0);
      vec4 y_ = floor(j - 7.0 * x_); 

      vec4 x = (x_ * 2.0 + 0.5) / 7.0 - 1.0;
      vec4 y = (y_ * 2.0 + 0.5) / 7.0 - 1.0;

      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 g0 = vec3(a0.xy, h.x);
      vec3 g1 = vec3(a0.zw, h.y);
      vec3 g2 = vec3(a1.xy, h.z);
      vec3 g3 = vec3(a1.zw, h.w);

      // Normalize gradients
      vec4 norm = taylorInvSqrt(vec4(dot(g0, g0), dot(g1, g1), dot(g2, g2), dot(g3, g3)));
      g0 *= norm.x;
      g1 *= norm.y;
      g2 *= norm.z;
      g3 *= norm.w;

      // Compute noise and gradient at P
      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      vec4 m2 = m * m;
      vec4 m3 = m2 * m;
      vec4 m4 = m2 * m2;
      vec3 grad =
        -6.0 * m3.x * x0 * dot(x0, g0) + m4.x * g0 +
        -6.0 * m3.y * x1 * dot(x1, g1) + m4.y * g1 +
        -6.0 * m3.z * x2 * dot(x2, g2) + m4.z * g2 +
        -6.0 * m3.w * x3 * dot(x3, g3) + m4.w * g3;
      vec4 px = vec4(dot(x0, g0), dot(x1, g1), dot(x2, g2), dot(x3, g3));
      return 42.0 * vec4(grad, dot(m4, px));
  }

  float FBM(vec3 p, int octaves) {
    float w = length(fwidth(p));
    float G = pow(2.0, -1.0);
    float amplitude = 1.0;
    float frequency = 1.0;
    float lacunarity = 2.0;
    float normalization = 0.0;
    float total = 0.0;
    
    for (int i = 0; i < octaves; ++i) {
      float noiseValue = snoise(p * frequency).w * smoothstep(1.0, 0.5, w);

      // noiseValue = abs(noiseValue);
      // noiseValue *= noiseValue;

      total += noiseValue * amplitude;
      normalization += amplitude;
      amplitude *= G;
      frequency *= lacunarity;
    }

    total = total * 0.5 + 0.5;

    // total = pow(total, exponeniation);

    return total;
  }
  `;


  const _SKY_VS = `
  varying vec3 vWorldPosition;
  
  void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
  
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }`;
  
  
  const _SKY_FS = `
  uniform samplerCube background;
  
  varying vec3 vWorldPosition;
  
  void main() {
    vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
    vec3 stars = textureCube(background, viewDirection).xyz;
  
    gl_FragColor = vec4(stars, 1.0);
  }`;

  const _PLANET_VS = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  
  void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
  
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vNormal = normal;
  }`;

  const _PLANET_FS = _NOISE_GLSL + `

  uniform float time;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  
  float map(vec3 pos) {
    return FBM(pos, 10);
  }

  vec3 calcNormal(vec3 pos) {
    vec2 eps = vec2( 0.0005, 0.0 );
    vec3 nor = vec3(map(pos+eps.xyy) - map(pos-eps.xyy),
                    map(pos+eps.yxy) - map(pos-eps.yxy),
                    map(pos+eps.yyx) - map(pos-eps.yyx));
    return normalize(nor);
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vNormal);
    vec3 noiseCoords = vec3(atan(normal.x, normal.z) * 0.5, asin(normal.y) * 2.0, time * 0.0025);

    vec3 n1 = vec3(
        FBM(noiseCoords + vec3(0.0), 8),
        FBM(noiseCoords + vec3(1.2, 1.3, 0.0), 8), 0.0);
    vec3 n2 = vec3(
        FBM(noiseCoords + 2.0 * n1 + vec3(1.7, 9.2, 0.0), 8),
        FBM(noiseCoords + 2.0 * n1 + vec3(8.3, 2.8, 0.0), 8), 0.0);

    float n3 = FBM(noiseCoords + 2.0 * n2, 8);

    vec3 col1 = vec3(0.24, 0.58, 0.67);
    vec3 col2 = vec3(0.08, 0.25, 0.72);

    vec3 col3 = vec3(1.0);
    vec3 col4 = vec3(0.26, 0.68, 0.11);

    vec3 albedo = vec3(0.0);
    vec3 c1 = mix(col1, col2, smoothstep(0.0, 1.0, n3));
    vec3 c2 = mix(col3, col4, smoothstep(0.0, 1.0, n3));
    albedo = mix(c1, c2, smoothstep(0.75, 1.0, length(n2)));
    albedo *= (0.1 * n3 + 0.9);

    vec3 lightDir = vec3(0.0, 1.0, 0.0);
    vec3 reflectionDir = reflect(viewDir, normal);

    vec3 scatterColour = vec3(1.0, 0.25, 0.25);
    vec3 extinctColour = vec3(0.35, .75, .90);

    float wrap = 0.1;
    float diffuse = max(0.0, ((dot(normal, lightDir)) + wrap) / (1.0 + wrap));
    float spec = max(0.0, dot(-reflectionDir, lightDir));
    float extinct = diffuse * pow(1.0 - max(0.0, dot(viewDir, normal)), 2.0);

    vec3 colour = vec3(0.0);

    vec3 scatterLight = mix(scatterColour, vec3(1.0), smoothstep(0.0, 0.4, diffuse)) * diffuse;
    
    colour = (scatterLight + 0.02) * albedo;
    colour = mix(colour, extinctColour, extinct);

    // vec3 norm = calcNormal(noiseCoords * 0.5);
    // vec3 clouds = diffuse * max(0.0, dot(norm, lightDir)) * vec3(1.0);

    // colour += clouds;

    // Color += Sun*RGB(255,250,230);

    gl_FragColor = vec4(colour, 1.0);

    // vec3 normal = normalize(vNormal);
    // float fbm = map(normal * 10.0);

    // vec3 sandy = vec3(.73, .63, .43);
    // vec3 vegetation = vec3(.06, .73, .19);
    // vec3 diffuse = mix(sandy, vegetation, fbm);

    // normal = normalize(normal + 0.5 * calcNormal(normal * 10.0));
    // float lighting = dot(normal, vec3(0.0, 1.0, 0.0));
    // gl_FragColor = vec4(diffuse * lighting, 1.0);
  }`;

  class ThreeJSController extends entity.Component {
    constructor() {
      super();
    }

    InitEntity() {
      this.threejs_ = new THREE.WebGLRenderer({
        antialias: true,
      });
      this.threejs_.outputEncoding = THREE.sRGBEncoding;
      // this.threejs_.gammaFactor = 2.2;
      this.threejs_.shadowMap.enabled = true;
      this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
      this.threejs_.setPixelRatio(window.devicePixelRatio);
      this.threejs_.setSize(window.innerWidth, window.innerHeight);
      this.threejs_.domElement.id = 'threejs';
      this.threejs_.physicallyCorrectLights = true;
  
      document.getElementById('container').appendChild(this.threejs_.domElement);
  
      window.addEventListener('resize', () => {
        this.OnResize_();
      }, false);
  
      const fov = 60;
      const aspect = 1920 / 1080;
      const near = 1.0;
      const far = 10000.0;
      this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this.camera_.position.set(20, 5, 15);
      this.scene_ = new THREE.Scene();

      this.listener_ = new THREE.AudioListener();
      this.camera_.add(this.listener_);

      this.crawlCamera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this.crawlScene_ = new THREE.Scene();

      this.uiCamera_ = new THREE.OrthographicCamera(
          -1, 1, 1 * aspect, -1 * aspect, 1, 1000);
      this.uiScene_ = new THREE.Scene();
  
      let light = new THREE.DirectionalLight(0x8088b3, 1.0);
      light.position.set(-10, 500, 10);
      light.target.position.set(0, 0, 0);
      light.castShadow = true;
      light.shadow.bias = -0.001;
      light.shadow.mapSize.width = 4096;
      light.shadow.mapSize.height = 4096;
      light.shadow.camera.near = 1.0;
      light.shadow.camera.far = 1000.0;
      light.shadow.camera.left = 500;
      light.shadow.camera.right = -500;
      light.shadow.camera.top = 500;
      light.shadow.camera.bottom = -500;
      this.scene_.add(light);

      this.sun_ = light;

      light = new THREE.AmbientLight(0xFFFFFF, 0.035);
      this.scene_.add(light);

      this.LoadBackground_();
      // this.LoadPlanet_();
      this.OnResize_();
    }

    LoadBackground_() {
      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load([
          './resources/terrain/space-posx.jpg',
          './resources/terrain/space-negx.jpg',
          './resources/terrain/space-posy.jpg',
          './resources/terrain/space-negy.jpg',
          './resources/terrain/space-posz.jpg',
          './resources/terrain/space-negz.jpg',
      ]);
      texture.encoding = THREE.sRGBEncoding;
  
      const uniforms = {
        "background": { value: texture },
      };
  
      const skyGeo = new THREE.SphereBufferGeometry(5000, 32, 15);
      const skyMat = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: _SKY_VS,
          fragmentShader: _SKY_FS,
          side: THREE.BackSide
      });

      this.sky_ = new THREE.Mesh(skyGeo, skyMat);
      this.scene_.add(this.sky_);
    }

    LoadPlanet_() {
      const planetGeo = new THREE.SphereBufferGeometry(5000, 48, 48);
      const planetMat = new THREE.ShaderMaterial({
          uniforms: {
            'time': { value: 0.0 },
          },
          vertexShader: _PLANET_VS,
          fragmentShader: _PLANET_FS,
          side: THREE.FrontSide
      });

      const planet = new THREE.Mesh(planetGeo, planetMat);
      planet.position.set(6000, -1000, 0);
      this.planet_ = planet;
      this.sky_.add(planet);
    }

    OnResize_() {
      this.camera_.aspect = window.innerWidth / window.innerHeight;
      this.camera_.updateProjectionMatrix();
      this.crawlCamera_.aspect = window.innerWidth / window.innerHeight;
      this.crawlCamera_.updateProjectionMatrix();

      this.uiCamera_.left = -this.camera_.aspect;
      this.uiCamera_.right = this.camera_.aspect;
      this.uiCamera_.updateProjectionMatrix();

      this.threejs_.setSize(window.innerWidth, window.innerHeight);
    }

    Render() {
      this.threejs_.autoClearColor = true;
      this.threejs_.render(this.scene_, this.camera_);
      this.threejs_.autoClearColor = false;
      this.threejs_.render(this.crawlScene_, this.crawlCamera_);
      this.threejs_.autoClearColor = false;
      this.threejs_.render(this.uiScene_, this.uiCamera_);
    }

    Update(timeElapsed) {
      const player = this.FindEntity('player');
      if (!player) {
        return;
      }
      const pos = player._position;
  
      this.sun_.position.copy(pos);
      this.sun_.position.add(new THREE.Vector3(-10, 500, 10));
      this.sun_.target.position.copy(pos);
      this.sun_.updateMatrixWorld();
      this.sun_.target.updateMatrixWorld();

      if (this.planet_) {
        this.planet_.material.uniforms.time.value += timeElapsed;
      }

      this.sky_.position.copy(pos);
    }
  }

  return {
      ThreeJSController: ThreeJSController,
  };
})();