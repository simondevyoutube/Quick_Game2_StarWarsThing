import {entity} from "./entity.js";


export const player_ps4_input = (() => {

  window.addEventListener("gamepadconnected", () => {
    const a = 0;
  });


  class PlayerPS4Input extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
    }
  
    InitEntity() {
      this.Parent.Attributes.InputCurrent = {
        axis1Forward: 0.0,
        axis1Side: 0.0,
        axis2Forward: 0.0,
        axis2Side: 0.0,
        pageUp: false,
        pageDown: false,
        space: false,
        shift: false,
        backspace: false,
      };
      this.Parent.Attributes.InputPrevious = {
          ...this.Parent.Attributes.InputCurrent};
    }
  
    ButtonPressed_(gp, index) {
      const curButton = gp.buttons[index];
      if (typeof(curButton) == 'object') {
        return curButton.pressed;
      }
      return curButton == 1.0;
    }

    Update(_) {
      const gamepads = navigator.getGamepads();
      if (!gamepads) {
        return;
      }

      const cur = gamepads[0];
      if (!cur) {
        return;
      }

      // X
      this.Parent.Attributes.InputCurrent.space = this.ButtonPressed_(cur, 0);

      // O
      this.Parent.Attributes.InputCurrent.shift = this.ButtonPressed_(cur, 1);

      // R/L
      this.Parent.Attributes.InputCurrent.pageUp = this.ButtonPressed_(cur, 4);
      this.Parent.Attributes.InputCurrent.pageDown = this.ButtonPressed_(cur, 5);
      this.Parent.Attributes.InputCurrent.axis1Forward = cur.axes[1];
      this.Parent.Attributes.InputCurrent.axis1Side = cur.axes[0];
      this.Parent.Attributes.InputCurrent.axis2Forward = cur.axes[3];
      this.Parent.Attributes.InputCurrent.axis2Side = cur.axes[2];

      this.Parent.Attributes.InputPrevious = {
          ...this.Parent.Attributes.InputCurrent};
    }
  };

  return {
    PlayerPS4Input: PlayerPS4Input,
  };

})();