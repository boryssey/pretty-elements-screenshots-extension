import { getStorageData, setStorageData } from "@src/utils/storage";
import { CLASSNAME_PREFIX } from ".";
import { createElementWithAttributes } from "@src/utils/helpers";

export const CANVAS_ID = "pretty-screenshots-canvas";

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
    this.canvas.id = CANVAS_ID;
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
    this.getStoredOptions()
      .then(() => {
        this.draw();
        this.createControlPanel();
      })
      .catch((err) => console.error("error while getting stored options", err));
  }

  getStoredOptions = async () => {
    return getStorageData([
      "frameOptions.padding",
      "frameOptions.frameColor",
      "frameOptions.borderRadius",
    ])
      .then((res) => {
        const storedPadding = parseInt(`${res["frameOptions.padding"] ?? ""}`);
        const storedFrameColor = res["frameOptions.frameColor"] ?? "";
        const storedBorderRadius = parseInt(
          `${res["frameOptions.borderRadius"] ?? ""}`,
        );
        this.frameOptions = {
          padding: Number.isNaN(storedPadding) ? 20 : storedPadding,
          frameColor: String(storedFrameColor) || "#FFFFFF",
          borderRadius: Number.isNaN(storedBorderRadius)
            ? 8
            : storedBorderRadius,
        };
      })
      .catch((err) =>
        console.error("Something went wrong while loading stored option", err),
      );
  };

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
    const paddingContainer = document.createElement("div");
    const paddingLabel = document.createElement("label");
    paddingLabel.innerText = "Frame thickness:";

    const paddingInput = createElementWithAttributes("input", {
      id: "padding-input",
      type: "range",
      value: this.frameOptions.padding.toString(),
      min: "0",
      max: "100",
    });
    paddingInput.addEventListener("input", (e) => {
      const value = Number((e.target as HTMLInputElement).value);
      (
        (e.target as HTMLElement).previousElementSibling as HTMLOutputElement
      ).value = String(value);
      this.changeFrameOptionValue(
        "padding",
        Number((e.target as HTMLInputElement).value),
      );
      this.draw();
    });
    paddingInput.addEventListener(
      "change",
      (e: Event) =>
        void setStorageData({
          "frameOptions.borderRadius": Number(
            (e.target as HTMLInputElement).value,
          ),
        }).catch((err) =>
          console.error("error whils saving frame color option", err),
        ),
    );
    const paddingOutput = createElementWithAttributes("output", {
      for: "padding-input",
    }) as HTMLOutputElement;
    paddingOutput.value = this.frameOptions.padding.toString();
    paddingContainer.appendChild(paddingLabel);
    paddingContainer.appendChild(paddingOutput);
    paddingContainer.appendChild(paddingInput);

    const borderRadiusContainer = document.createElement("div");

    const borderRadiusLabel = document.createElement("label");
    borderRadiusLabel.innerText = "Border radius:";

    const borderRadiusInput = createElementWithAttributes("input", {
      for: "border-radius-input",
      type: "range",
      value: this.frameOptions.borderRadius.toString(),
      min: "0",
      max: "50",
    });
    borderRadiusInput.addEventListener("input", (e) => {
      const value = Number((e.target as HTMLInputElement).value);
      (
        (e.target as HTMLElement).previousElementSibling as HTMLOutputElement
      ).value = String(value);
      this.changeFrameOptionValue(
        "borderRadius",
        Number((e.target as HTMLInputElement).value),
      );
    });
    borderRadiusInput.addEventListener(
      "change",
      (e: Event) =>
        void setStorageData({
          "frameOptions.borderRadius": Number(
            (e.target as HTMLInputElement).value,
          ),
        }).catch((err) =>
          console.error("error whils saving frame color option", err),
        ),
    );
    const borderRadiusOutput = createElementWithAttributes("output", {
      for: "padding-input",
    }) as HTMLOutputElement;
    borderRadiusOutput.value = this.frameOptions.borderRadius.toString();

    borderRadiusContainer.appendChild(borderRadiusLabel);
    borderRadiusContainer.appendChild(borderRadiusOutput);
    borderRadiusContainer.appendChild(borderRadiusInput);

    const hexColorContainer = document.createElement("div");
    const hexColorLabel = document.createElement("label");
    hexColorLabel.innerText = "Frame color:";

    const hexColorInput = createElementWithAttributes("input", {
      id: "color-input",
      type: "color",
      value: this.frameOptions.frameColor,
    });

    hexColorInput.addEventListener("input", (e: Event) => {
      const value = (e.target as HTMLInputElement).value ?? "";
      (
        (e.target as HTMLElement).previousElementSibling as HTMLOutputElement
      ).value = value;
      this.changeFrameOptionValue("frameColor", value);
    });
    hexColorInput.addEventListener(
      "change",
      (e: Event) =>
        void setStorageData({
          "frameOptions.frameColor": (e.target as HTMLInputElement).value ?? "",
        }).catch((err) =>
          console.error("error whils saving frame color option", err),
        ),
    );

    const colorOutput = createElementWithAttributes("output", {
      for: "color-input",
    }) as HTMLOutputElement;
    colorOutput.value = this.frameOptions.frameColor;
    hexColorContainer.appendChild(hexColorLabel);
    hexColorContainer.appendChild(colorOutput);
    hexColorContainer.appendChild(hexColorInput);
    return [paddingContainer, borderRadiusContainer, hexColorContainer];
  };

  createControlPanel = () => {
    const controlPanel = createElementWithAttributes(
      "div",
      null, //   { draggable: "true" },
      `${CLASSNAME_PREFIX}-control-panel`,
    );
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
