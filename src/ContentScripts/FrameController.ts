import { CLASSNAME_PREFIX } from ".";
import { createElementWithAttributes } from "../utils/helpers";

class FrameController {
  public canvas = document.createElement("canvas");
  public ctx = this.canvas.getContext("2d");
  public frameOptions = {
    padding: 20,
    frameColor: "#FFFFFF",
    borderRadius: 8,
  };

  // TODO: implement saving the frame options to storage

  constructor(
    public screenshotCanvas: HTMLCanvasElement,
    public target: HTMLElement,
  ) {
    target.appendChild(this.canvas);
    this.canvas.addEventListener("copy", (e) => {
      e.preventDefault();
      this.canvas.toBlob((blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]).catch((err) => {
          console.error("error copying to clipboard", err);
        });
      });
    });
    this.draw();
    this.createControlPanel();
  }

  changeFrameOptionValue = (
    key: keyof typeof this.frameOptions,
    value: number | string,
  ) => {
    if (typeof this.frameOptions[key] === typeof value) {
      this.frameOptions = {
        ...this.frameOptions,
        [key]: value,
      };
    }
    this.draw();
  };

  createOptionControls = () => {
    // TODO: add number values to the labels
    const paddingContainer = document.createElement("div");
    const paddingLabel = document.createElement("label");
    paddingLabel.innerText = "Frame thickness";
    const paddingInput = createElementWithAttributes("input", {
      type: "range",
      value: this.frameOptions.padding.toString(),
      min: "0",
      max: "100",
    });
    paddingInput.addEventListener("input", (e) => {
      this.changeFrameOptionValue(
        "padding",
        Number((e.target as HTMLInputElement).value),
      );
      this.draw();
    });
    paddingContainer.appendChild(paddingLabel);
    paddingContainer.appendChild(paddingInput);

    const borderRadiusContainer = document.createElement("div");

    const borderRadiusLabel = document.createElement("label");
    borderRadiusLabel.innerText = "Border radius";
    const borderRadiusInput = createElementWithAttributes("input", {
      type: "range",
      value: this.frameOptions.borderRadius.toString(),
      min: "0",
      max: "50",
    });
    borderRadiusInput.addEventListener("input", (e) => {
      this.changeFrameOptionValue(
        "borderRadius",
        Number((e.target as HTMLInputElement).value),
      );
    });
    borderRadiusContainer.appendChild(borderRadiusLabel);
    borderRadiusContainer.appendChild(borderRadiusInput);

    const hexColorContainer = document.createElement("div");
    const hexColorLabel = document.createElement("label");
    hexColorLabel.innerText = "Frame color";
    const hexColorInput = createElementWithAttributes("input", {
      type: "color",
      value: this.frameOptions.frameColor,
    });

    hexColorInput.addEventListener("input", (e: Event) =>
      this.changeFrameOptionValue(
        "frameColor",
        (e.target as HTMLInputElement).value ?? "",
      ),
    );
    hexColorContainer.appendChild(hexColorLabel);
    hexColorContainer.appendChild(hexColorInput);
    return [paddingContainer, borderRadiusContainer, hexColorContainer];
  };

  createControlPanel = () => {
    const controlPanel = createElementWithAttributes(
      "div",
      null, //   { draggable: "true" },
      `${CLASSNAME_PREFIX}-control-panel`,
    );
    // controlPanel.addEventListener("drag", (event) => {
    //   event.preventDefault();
    //   if (event.clientX === 0 && event.clientY === 0) return;
    //   const x = event.clientX;
    //   const y = event.clientY;
    //   controlPanel.style.left = `${x}px`;
    //   controlPanel.style.top = `${y}px`;
    //   controlPanel.style.right = `unset`;
    //   controlPanel.style.transform = "unset";
    // });

    // controlPanel.addEventListener(
    //   "dragstart",
    //   function (event) {
    //     const img = new Image();
    //     img.src =
    //       "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
    //     event.dataTransfer?.setDragImage(img, 0, 0);
    //   },
    //   false,
    // );
    const controls = this.createOptionControls();
    controls.forEach((control) => controlPanel.appendChild(control));
    this.target.appendChild(controlPanel);
  };

  draw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvas.width =
      this.screenshotCanvas.width + this.frameOptions.padding * 2;
    this.canvas.height =
      this.screenshotCanvas.height + this.frameOptions.padding * 2;
    this.ctx.fillStyle = this.frameOptions.frameColor;
    this.ctx.beginPath();
    this.ctx.roundRect(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      this.frameOptions.borderRadius,
    );
    this.ctx.fill();
    this.ctx.drawImage(
      this.screenshotCanvas,
      this.frameOptions.padding,
      this.frameOptions.padding,
    );
  }
}

export default FrameController;
