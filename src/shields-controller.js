import {THREE} from './three-defs.js';

import {entity} from './entity.js';
import {math} from './math.js';
import {noise} from './noise.js';


export const shields_controller = (() => {

  const _SHIELD_VS = `
  varying vec3 vNormal;
  varying vec3 vNoiseCoords;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vec3 worldNormal = normalize(
        mat3(modelMatrix[0].xyz,
             modelMatrix[1].xyz,
             modelMatrix[2].xyz) * normal);
    vNormal = worldNormal;

    vec3 noiseCoords = normalize(
        mat3(modelMatrix[0].xyz,
             modelMatrix[1].xyz,
             modelMatrix[2].xyz) * (normal * vec3(0.5, 1.0, 1.0)));
    vNoiseCoords = noiseCoords;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
  
  
  const _SHIELD_FS = `
  varying vec3 vNormal;
  varying vec3 vNoiseCoords;
  varying vec3 vWorldPosition;
  uniform float time;
  uniform float visibility;
  
  // Taken from https://www.shadertoy.com/view/4sfGzS
  float hash(vec3 p)  // replace this by something better
  {
    p  = fract( p*0.3183099+.1 );
    p *= 17.0;
    return fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
  }

  float noise( in vec3 x )
  {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
  
    return mix(mix(mix( hash(i+vec3(0,0,0)), 
                        hash(i+vec3(1,0,0)),f.x),
                   mix( hash(i+vec3(0,1,0)), 
                        hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix( hash(i+vec3(0,0,1)), 
                        hash(i+vec3(1,0,1)),f.x),
                   mix( hash(i+vec3(0,1,1)), 
                        hash(i+vec3(1,1,1)),f.x),f.y),f.z);
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
      float noiseValue = noise(p * frequency);

      noiseValue = abs(noiseValue);
      // noiseValue *= noiseValue;

      total += noiseValue * amplitude;
      normalization += amplitude;
      amplitude *= G;
      frequency *= lacunarity;
    }

    // total = total * 0.5 + 0.5;
    // total = pow(total, 1.0);

    return total;
  }

  vec2  hash2( vec2  p ) { p = vec2( dot(p,vec2(117.13,313.74)), dot(p,vec2(269.5,183.3)) ); return fract(sin(p)*43758.5453); }

  // The parameter w controls the smoothness
  float voronoi( in vec3 coords)
  {
    vec2 x = coords.xy;
    float w = 0.0;
      vec2 n = floor( x );
      vec2 f = fract( x );

    vec4 m = vec4( 8.0, 0.0, 0.0, 0.0 );
      for( int j=-2; j<=2; j++ )
      for( int i=-2; i<=2; i++ )
      {
          vec2 g = vec2( float(i),float(j) );
          // vec2 o = hash2( n + g );
          vec3 ng = vec3(n + g, coords.z);
          vec2 o = vec2(
              noise(ng + vec3(217.3, 325.3, 0.0)),
              noise(ng));
      
          // distance to cell		
      float d = length(g - f + o);
      d = pow(d, 1.25);
      
      float h = smoothstep( 0.0, 1.0, 0.5 + 0.5*(m.x-d)/w );
      
        m.x   = mix( m.x,     d, h ) - h*(1.0-h)*w/(1.0+3.0*w); // distance
      }
    
    return clamp(m.x, 0.0, 1.0);
  }

  void main() {
    vec3 norm = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = clamp(dot(viewDirection, norm), 0.0, 1.0);
    fresnel = 1.0 - fresnel;
    fresnel *= fresnel;
    fresnel = smoothstep(0.0, 1.0, fresnel);

    float fbm1 = FBM(vNoiseCoords * 5.0, 8);
    float fbm2 = FBM(vNoiseCoords * 5.0 + vec3(fbm1 + time * 2.0), 8);

    fbm2 = clamp(fbm2, 0.0, 1.0) * 2.0 - 1.0;
    fbm2 = (1.0 - abs(fbm2)) * 0.5 + 0.75 * fbm1;
    // float n2 = voronoi(vNoiseCoords * 5.0);
    vec3 col = vec3(0.25, 0.25, 0.75) * (fbm2) * fresnel;

    // float edgeGlow = fresnel * fresnel;
    // edgeGlow *= edgeGlow;
    // edgeGlow *= 0.5;
    // col += vec3(edgeGlow);
  
    gl_FragColor = vec4(col * visibility, 1.0);
  }`;


  function easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (x < 1 / d1) {
      return n1 * x * x;
    } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
  }

  class ShieldsController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.timeElapsed_ = 0.0;
      this.shieldsVisible_ = false;
      this.shieldsTimer_ = 0.0;
      this.noise_ = new noise.Noise({
        octaves: 6,
        persistence: 0.5,
        lacunarity: 1.6,
        exponentiation: 1.0,
        height: 1.0,
        scale: 0.1,
        seed: 1
      });
    }

    InitEntity() {
      const sphereGeo = new THREE.SphereBufferGeometry(1, 32, 32);
      const shieldMat = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0.0 },
            visibility: { value: 0.0 },
          },
          vertexShader: _SHIELD_VS,
          fragmentShader: _SHIELD_FS,
          side: THREE.FrontSide,
          depthTest: true,
          depthWrite: false,
          transparent: true,
          blending: THREE.AdditiveBlending,
      });

      this.shields_ = new THREE.Mesh(sphereGeo, shieldMat);
      this.shields_.scale.set(20, 10, 10);

      const group = this.GetComponent('RenderComponent').group_;
      group.add(this.shields_);
    }

    InitComponent() {
      this.RegisterHandler_('health.damage', () => { this.OnHit_(); });
    }

    OnHit_() {
      if (this.Parent.Attributes.dead) {
        return;
      }

      if (this.Parent.Attributes.shields > 0) {
        const loader = this.FindEntity('loader').GetComponent('LoadController');
        loader.LoadSound('./resources/sounds/', 'shields.ogg', (s) => {
          const group = this.GetComponent('RenderComponent').group_;
          group.add(s);
          s.play();  
        });

        this.shieldsVisible_ = true;
        this.shieldsTimer_ = 0.0;
      }
    }

    Update(timeElapsed) {
      this.timeElapsed_ += timeElapsed;
      this.shieldsTimer_ += timeElapsed;
      this.shields_.material.uniforms.time.value = this.timeElapsed_;

      this.Parent.Attributes.shields += timeElapsed * 0.5;
      this.Parent.Attributes.shields = Math.min(
        this.Parent.Attributes.shields, this.Parent.Attributes.maxShields);

      if (this.shieldsVisible_) {
        const e = 1.0 - math.sat(easeOutBounce(this.shieldsTimer_ * 0.2)) ** 2;
        const t = this.noise_.Get(this.shieldsTimer_, 21.4, 53.2);
        this.shields_.material.uniforms.visibility.value = t * e;
      }
    }
  };

  return {
    ShieldsController: ShieldsController
  };
})();