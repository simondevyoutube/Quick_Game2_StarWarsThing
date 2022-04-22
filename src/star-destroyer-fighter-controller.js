import {THREE} from './three-defs.js';

import {entity} from './entity.js';
import {math} from './math.js';


export const star_destroyer_fighter_controller = (() => {


  class StarDestroyerFighterController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.fighters_ = [];


      const down = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, -1, 0));
      const up = new THREE.Quaternion();

      this.turretOffsets_ = [
        [new THREE.Vector3(0.93 * 50, 0.65 * 50, 0), up],
        [new THREE.Vector3(1.27 * 50, 0.62 * 50, 0), up],
        [new THREE.Vector3(0.59 * 50, 0.68 * 50, 0), up],

        [new THREE.Vector3(-5.02 * 50, -1.13 * 50, 4.39 * 50), down],
        [new THREE.Vector3(-5.02 * 50, -1.13 * 50, -4.39 * 50), down],

        [new THREE.Vector3(-0.44 * 50, -1.52 * 50, 1.05 * 50), down],
        [new THREE.Vector3(-0.44 * 50, -1.52 * 50, -1.05 * 50), down],

        [new THREE.Vector3(3.6 * 50, -1.39 * 50, 0.39 * 50), down],
        [new THREE.Vector3(3.6 * 50, -1.39 * 50, -0.39 * 50), down],
      ];
    }

    SpawnFighters_() {
      const spawner = this.FindEntity('spawners').GetComponent('TieFighterSpawner');
      for (let i = 0; i < 20; ++i) {
        const n = new THREE.Vector3(
          math.rand_range(-1, 1),
          math.rand_range(-1, 1),
          math.rand_range(-1, 1),
        );
        n.normalize();
        n.multiplyScalar(800);
        n.add(this.Parent.Position);

        const e = spawner.Spawn();
        e.SetPosition(n);

        this.fighters_.push(e);
      }
    }
    
    SpawnTurrets_() {
      const turretSpawner = this.FindEntity('spawners').GetComponent(
          'StarDestroyerTurretSpawner');

      const correction = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1));

      for (let i = 0; i < this.turretOffsets_.length; ++i) {
        const [pos, quat] = this.turretOffsets_[i];
        const e = turretSpawner.Spawn(pos, quat, correction);
        this.fighters_.push(e);
      }
  }

    Update(_) {
      if (this.fighters_.length > 0) {
        return;
      }

      // DEMO
      this.SpawnFighters_();
      this.SpawnTurrets_();
    }
  };

  return {
    StarDestroyerFighterController: StarDestroyerFighterController,
  };

})();