import * as PIXI from "pixi.js";

const app = new PIXI.Application({
  background: "#000000",
  resizeTo: window,
});

document.body.appendChild(app.view as HTMLCanvasElement);

app.stage.eventMode = "static";
app.stage.hitArea = app.screen;

const view = new PIXI.Container();

app.stage.addChild(view);

class Box extends PIXI.Graphics {
  size: number;
  mass: number;
  velocity: number;
  newVelocity: number;
  uuid: string;

  constructor(x: number, mass: number, velocity: number = 0) {
    super();
    const size = Math.sqrt(mass);
    this.size = size;
    this.mass = mass;
    this.velocity = velocity;
    this.newVelocity = velocity;

    this.beginFill(0xffffff);
    this.drawRoundedRect(0, 0, size * 100, size * 100, 5);
    this.endFill();
    this.pivot.x = 0;
    this.pivot.y = size * 100;
    this.x = x * 100;
    this.y = window.innerHeight;
    this.uuid = crypto.randomUUID();
  }
  tick(timeDelta: number, boxes: Box[]) {
    if (this.x < 0) {
      this.x = 0;
      this.velocity *= -1;
      this.newVelocity = this.velocity;
    }
    if (this.x + this.size * 100 > window.innerWidth) {
      this.x = window.innerWidth - this.size * 100;
      this.velocity *= -1;
      this.newVelocity = this.velocity;
    }
    this.x += this.velocity * (timeDelta / 1000) * 100;

    const filteredBoxes = boxes.filter((box) => box.uuid != this.uuid);
    filteredBoxes.forEach((box) => {
      if (this.isCollide(box)) {
        if (this.x < box.x) {
          this.x = box.x - this.size * 100 - 2;
        } else {
          this.x = box.x + box.size * 100 + 2;
        }
        const velocityX =
          ((this.mass - box.mass) / (this.mass + box.mass)) * this.velocity +
          ((2 * box.mass) / (this.mass + box.mass)) * box.velocity;
        const velocityY =
          ((2 * this.mass) / (this.mass + box.mass)) * this.velocity +
          ((box.mass - this.mass) / (this.mass + box.mass)) * box.velocity;
        this.newVelocity = velocityX;
        box.newVelocity = velocityY;
      }
    });
  }
  applyVelocity() {
    this.velocity = this.newVelocity;
  }
  isCollide(box: Box): boolean {
    if (
      (this.x < box.x && this.x + this.size * 100 > box.x) ||
      (box.x < this.x && box.x + box.size * 100 > this.x)
    ) {
      return true;
    }
    return false;
  }
}

const boxes: Box[] = [];

boxes.push(new Box(0, 2, 3));
boxes.push(new Box(7, 10, -2));
boxes.forEach((box) => view.addChild(box));
window.onresize = () => {
  boxes.forEach((box) => (box.y = window.innerHeight));
};

const stop = document.getElementById("stop") as HTMLDivElement;
const container = document.getElementById("container") as HTMLDivElement;
const newButton = document.getElementById("new") as HTMLButtonElement;
const startButton = document.getElementById("start") as HTMLButtonElement;

interface IForm {
  uuid: string;
  form: HTMLFormElement;
}
const forms: IForm[] = [];
const generateForm = (x: number, mass: number, velocity: number) => {
  const form = document.createElement("form");
  const massSpan = document.createElement("span");
  const massInput = document.createElement("input");
  const velocitySpan = document.createElement("span");
  const velocityInput = document.createElement("input");
  const xSpan = document.createElement("span");
  const xInput = document.createElement("input");
  const removeSpan = document.createElement("span");
  massInput.type = "number";
  massInput.name = "mass";
  massInput.value = String(mass);
  velocityInput.name = "velocity";
  velocityInput.type = "number";
  velocityInput.value = String(velocity);
  xInput.type = "number";
  xInput.name = "x";
  xInput.value = String(x);
  massSpan.textContent = "mass(kg) ";
  massSpan.appendChild(massInput);
  velocitySpan.textContent = "velocity(ms/s) ";
  velocitySpan.appendChild(velocityInput);
  xSpan.textContent = "start position(m) ";
  removeSpan.textContent = "[x]";
  removeSpan.className = "remove";
  xSpan.appendChild(xInput);
  form.appendChild(massSpan);
  form.appendChild(velocitySpan);
  form.appendChild(xSpan);
  form.appendChild(removeSpan);
  container.insertBefore(form, newButton);
  const uuid = crypto.randomUUID();
  forms.push({ form: form, uuid: uuid });

  removeSpan.onclick = () => {
    container.removeChild(form);
    const i = forms.findIndex((form) => form.uuid == uuid);
    if (i != -1) {
      forms.splice(i, 1);
    }
  };
};
generateForm(0, 2, 3);
generateForm(7, 10, -2);
stop.onclick = () => {
  paused = true;
  stop.className = "hidden";
  container.className = "";
};

newButton.onclick = () => {
  generateForm(0, 0, 0);
};

let paused = false;
startButton.onclick = () => {
  const formData = forms.map((form) => new FormData(form.form));

  boxes.forEach((box) => view.removeChild(box));
  boxes.splice(0);
  formData.forEach((data) => {
    const mass = Number(data.get("mass"));
    const velocity = Number(data.get("velocity"));
    const x = Number(data.get("x"));
    const box = new Box(x, mass, velocity);
    boxes.push(box);
    view.addChild(box);
  });
  stop.className = "";
  container.className = "hidden";
  paused = false;
};

let lastTime = Date.now();
app.ticker.add(() => {
  const currentTime = Date.now();

  if (!paused) {
    boxes.forEach((box) => box.tick(currentTime - lastTime, boxes));
    boxes.forEach((box) => box.applyVelocity());
  }

  lastTime = currentTime;
});
