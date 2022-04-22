import {entity} from './entity.js';


export const ui_controller = (() => {

  const _PHRASES = [
    [' ', 5],
    ['SimonDev: All wings report in.', 10],
    ['O-Boy: I am a leaf on the wind...', 10],
    ['O-Boy: Watch how I fly.', 10],
    ["SimonDev: Hey uhhh don't forget to subscribe.", 10],
    ["Jinjie: I'm coming in hot!", 10],
    ["SimonDev: Please subscribe, I need subscribers.", 10],
    ["Zozo: Moya... come in.", 10],
    ["Zozo: It's a ship, a LIVING ship.", 10],
    ["SimonDev: Also, contribute to my Patreon.", 10],
    ['Kai: I am Kai, last of the Brunnen-G.', 10],
    ["SimonDev: Really need a steady supply of coffee and beer. And groceries.", 10],
    ['Kai: Today is my day of death. The day our story begins.', 10],
    ["SimonDev: Yeah so, Patreon and subscribe.", 10],
    ['Kai: The dead do not contribute to Patreon.', 10],
    ['SimonDev: Shutup Meg.', 10],
  ];

  class UIController extends entity.Component {
    constructor(params) {
      super();
      this.params_ = params;
      this.timeout_ = 0.0;
      this.textArea_ = document.getElementById('chat-ui-text-area');
      this.text_ = null;
    }

    AddText(txt) {
      if (this.text_) {
        this.text_ = null;
      }

      this.text_ = document.createElement('DIV');
      this.text_.className = 'chat-text';
      this.text_.innerText = txt;
      this.text_.classList.toggle('fadeOut');

      this.textArea_.appendChild(this.text_);

      const dead = [];
      for (let i = 0; i < this.textArea_.children.length; ++i) {
        const s = window.getComputedStyle(this.textArea_.children[i]);
        if (s.visibility == 'hidden') {
          dead.push(this.textArea_.children[i]);
        }
      }
      for (let d of dead) {
        this.textArea_.removeChild(d);
      }
    }

    Update(timeElapsed) {
      if (_PHRASES.length == 0) {
        return;
      }

      this.timeout_ -= timeElapsed;
      if (this.timeout_ < 0) {
        const [phrase, timeout] = _PHRASES.shift();
        this.timeout_ = timeout;
        this.AddText(phrase);
        return;
      }
    }
  };

  return {
    UIController: UIController,
  };

})();