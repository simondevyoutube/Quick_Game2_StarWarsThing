import {entity} from './entity.js';


export const spatial_grid_controller = (() => {

  class SpatialGridController extends entity.Component {
    constructor(params) {
      super();

      this.grid_ = params.grid;
    }

    Destroy() {
      this.grid_.Remove(this.client_);
      this.client_ = null;
    }

    InitEntity() {
      this.RegisterHandler_('physics.loaded', () => this.OnPhysicsLoaded_());

      const pos = [
        this.Parent.Position.x,
        this.Parent.Position.z,
      ];

      this.client_ = this.grid_.NewClient(pos, [1, 1]);
      this.client_.entity = this.parent_;
    }

    OnPhysicsLoaded_() {
      this.RegisterHandler_('update.position', (m) => this.OnPosition_());
      this.OnPosition_();
    }

    OnPosition_() {
      const pos = this.Parent.Position;
      this.client_.position = [pos.x, pos.z];
      this.grid_.UpdateClient(this.client_);
    }

    FindNearbyEntities(range) {
      const results = this.grid_.FindNear(
          [this.parent_._position.x, this.parent_._position.z], [range, range]);
          
      return results.filter(c => c.entity != this.parent_);
    }
  };

  return {
      SpatialGridController: SpatialGridController,
  };
})();