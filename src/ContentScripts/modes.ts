import {
  CLASSNAME_PREFIX,
  getShadowHost,
  TOGGLED_CLASSNAME,
  TOGGLED_SELECTOR,
} from ".";
import { debounce } from "lodash";
import { domToCanvas } from "modern-screenshot";
import { sendFetchImageRequest } from "../utils/events";
import FrameController from "./FrameController";
import { createElementWithClassNames } from "../utils/helpers";

export type ScreenshotMode = "element" | "page" | "area";

export const clearAllSelections = () => {
  const toggledElement = document.querySelectorAll(TOGGLED_SELECTOR);
  if (toggledElement.length) {
    toggledElement.forEach((element) => {
      element.classList.remove(TOGGLED_CLASSNAME);
    });
  }
};

const handleMouseMoveEvent = debounce((e: Event) => {
  if (!(e instanceof MouseEvent)) return;
  const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
  if (!(elementAtPoint instanceof HTMLElement)) {
    return;
  }

  if (!elementAtPoint.classList.contains(TOGGLED_CLASSNAME)) {
    const { shadowHost } = getShadowHost();
    if (shadowHost.contains(elementAtPoint)) {
      return;
    }
    clearAllSelections();
    elementAtPoint.classList.add(TOGGLED_CLASSNAME);
  }
}, 10);

const fetchImage = async (url: string): Promise<string | false> => {
  return await sendFetchImageRequest({
    url,
  });
};

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

const buildScreenshotOverlay = (screenshot: HTMLCanvasElement) => {
  const { shadowRoot } = getShadowHost();
  const overlay = shadowRoot.appendChild(
    createElementWithClassNames("div", `${CLASSNAME_PREFIX}-overlay`),
  );
  overlay.id = "pretty-screenshots-overlay";
  new FrameController(screenshot, overlay);

  overlay.addEventListener("click", (e) => {
    if ((e.target as Element).id !== "pretty-screenshots-overlay") {
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    shadowRoot.removeChild(overlay);
    switchScreenshotMode(currentScreenshotMode);
  });
};

const handleElementClick = (e: Event) => {
  if (!(e instanceof MouseEvent)) return;
  const { shadowHost } = getShadowHost();

  const asyncHandler = async () => {
    if (shadowHost.contains(e.target as Node)) {
      return;
    }
    e.preventDefault();
    const selectedElement = document.querySelector(TOGGLED_SELECTOR);
    if (!selectedElement || !(selectedElement instanceof HTMLElement)) {
      return;
    }
    selectedElement.classList.remove(TOGGLED_CLASSNAME);
    const clonedNode = selectedElement.cloneNode(true);
    if (!(clonedNode instanceof HTMLElement)) {
      return;
    }

    const screenshotCanvas = await domToCanvas(selectedElement, {
      backgroundColor: getElementBackgroundColor(selectedElement),
      fetchFn: fetchImage,
      scale: 2,
      onCloneNode: (node) => {
        if (!(node instanceof HTMLElement)) {
          return;
        }
        node.style.marginBlockStart = "0px";
        node.style.marginBlockEnd = "0px";
        node.style.marginBlock = "0px";
        node.style.marginInlineStart = "0px";
        node.style.marginInlineEnd = "0px";
      },
    });
    document.removeEventListener("mousemove", handleMouseMoveEvent);
    document.removeEventListener("click", handleElementClick, {
      capture: true,
    });
    buildScreenshotOverlay(screenshotCanvas);
  };
  asyncHandler().catch((error) => console.error(error));
};

const screenshotModeHandlers: Record<
  ScreenshotMode,
  Record<
    string,
    {
      handler: (e: Event) => void;
      options?: AddEventListenerOptions;
    }
  >
> = {
  element: {
    mousemove: { handler: handleMouseMoveEvent },
    click: { handler: handleElementClick, options: { capture: true } },
  },
  page: {
    mousemove: {
      handler: () => {
        console.log("mouseMoveHandler");
      },
    },
    click: {
      handler: () => {
        console.log("mouseClickHandler");
      },
    },
  },
  area: {
    mousemove: {
      handler: () => {
        console.log("mouseMoveHandler");
      },
    },
    click: {
      handler: () => {
        console.log("mouseMoveHandler");
      },
    },
  },
};

let currentScreenshotMode: ScreenshotMode = "element";

export const switchScreenshotMode = (mode: ScreenshotMode) => {
  const currentHandlers = screenshotModeHandlers[currentScreenshotMode];
  Object.entries(currentHandlers).forEach(
    ([eventName, { handler, options }]) => {
      document.removeEventListener(eventName, handler, options);
    },
  );
  const newEventHandlers = screenshotModeHandlers[mode];
  Object.entries(newEventHandlers).forEach(
    ([eventName, { handler, options }]) => {
      document.addEventListener(eventName, handler, options);
    },
  );
  currentScreenshotMode = mode;
};

export const clearMode = () => {
  const currentHandlers = screenshotModeHandlers[currentScreenshotMode];
  Object.entries(currentHandlers).forEach(
    ([eventName, { handler, options }]) => {
      document.removeEventListener(eventName, handler, options);
    },
  );
};
