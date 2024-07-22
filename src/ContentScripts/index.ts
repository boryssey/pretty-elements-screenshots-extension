import { debounce } from "lodash";
import { createElementWithClassNames } from "../utils/helpers";
import "./contentStyles.css";
import { domToCanvas } from "modern-screenshot";
import { sendFetchImageRequest } from "../utils/makeRequest";

const CLASSNAME_PREFIX = "__pretty_screenshots";

const TOGGLED_CLASSNAME = `${CLASSNAME_PREFIX}-selected`;
const TOGGLED_SELECTOR = `.${TOGGLED_CLASSNAME}`;

const logger = (args?: unknown, ...optionalParams: unknown[]) => {
  console.log("[CSC]:", args, optionalParams);
};

logger("content script called");

const clearAllSelections = () => {
  const toggledElement = document.querySelectorAll(TOGGLED_SELECTOR);
  if (toggledElement.length) {
    toggledElement.forEach((element) => {
      element.classList.remove(TOGGLED_CLASSNAME);
    });
  }
};

const handleMouseMoveEvent = debounce((e: MouseEvent) => {
  const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
  if (!(elementAtPoint instanceof HTMLElement)) {
    return;
  }

  if (!elementAtPoint.classList.contains(TOGGLED_CLASSNAME)) {
    clearAllSelections();
    elementAtPoint.classList.add(TOGGLED_CLASSNAME);
  }
}, 10);

const transparentValues = ["rgba(0, 0, 0, 0)", "transparent"];

const getElementBackgroundColor = (element: HTMLElement) => {
  const backgroundColor = window.getComputedStyle(element).backgroundColor;

  if (!transparentValues.includes(backgroundColor)) {
    return backgroundColor;
  }
  if (!element.parentElement) {
    return "white";
  }
  return getElementBackgroundColor(element.parentElement);
};

const handleElementClick = (e: MouseEvent) => {
  const asyncHandler = async () => {
    if (
      e.target instanceof HTMLElement &&
      (e.target.id === "pretty-screenshots-overlay" ||
        e.target.classList.contains(`${CLASSNAME_PREFIX}-overlay`) ||
        e.target.tagName === "CANVAS")
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const selectedElement = document.querySelector(TOGGLED_SELECTOR);
    if (!selectedElement || !(selectedElement instanceof HTMLElement)) {
      return;
    }
    selectedElement.classList.remove(TOGGLED_CLASSNAME);
    const screenshotCanvas = await domToCanvas(selectedElement, {
      backgroundColor: getElementBackgroundColor(selectedElement),
      fetchFn: fetchImage,
      scale: 2,
    });
    const canvas = document.createElement("canvas");
    canvas.width = screenshotCanvas.width + 40;
    canvas.height = screenshotCanvas.height + 40;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 8);
    ctx.fill();
    ctx.drawImage(screenshotCanvas, 20, 20);
    document.removeEventListener("mousemove", handleMouseMoveEvent);
    document.removeEventListener("click", handleElementClick, {
      capture: true,
    });
    buildScreenshotOverlay(canvas);
    const link = document.createElement("a");
    link.download = "filename.png";
    link.href = canvas.toDataURL();
    link.click();
  };
  asyncHandler().catch((error) => console.error(error));
};

document.addEventListener("mousemove", handleMouseMoveEvent);
document.addEventListener("click", handleElementClick, {
  capture: true,
});

const buildScreenshotOverlay = (screenshot: HTMLCanvasElement) => {
  const overlay = document.body.appendChild(
    createElementWithClassNames("div", `${CLASSNAME_PREFIX}-overlay`),
  );
  overlay.id = "pretty-screenshots-overlay";
  overlay.appendChild(screenshot);
  overlay.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
};

const fetchImage = async (url: string): Promise<string | false> => {
  return await sendFetchImageRequest({
    url,
  });
};
