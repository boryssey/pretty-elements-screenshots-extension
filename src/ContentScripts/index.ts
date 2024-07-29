import {
  createElementWithAttributes,
  createElementWithClassNames,
} from "@src/utils/helpers";
//@ts-expect-error style-loader
import shadowDomStyle from "./styles/shadowDom.css";
//@ts-expect-error style-loader
import globalStyle from "./styles/global.css";

// import browser from "webextension-polyfill";
import {
  capturePage,
  clearAllSelections,
  clearMode,
  switchScreenshotMode,
} from "./modes";
import {
  sendGetTabIdRequest,
  sendScriptFinishedEvent,
} from "@src/utils/events";
import { StorageValue } from "@src/utils/storage";
import { ImageType, imageTypes } from "@src/utils/constants";

export const CLASSNAME_PREFIX = "__pretty_screenshots";

export const TOGGLED_CLASSNAME = `${CLASSNAME_PREFIX}-selected`;
export const TOGGLED_SELECTOR = `.${TOGGLED_CLASSNAME}`;

const logger = (args?: unknown, ...optionalParams: unknown[]) => {
  console.log("[CSC]:", args, optionalParams);
};

logger("content script called");

let tabId: number;

sendGetTabIdRequest()
  .then((id) => {
    logger("Got tab id", id);
    if (!id || typeof id !== "number") return;
    tabId = id;
  })
  .catch((error) => console.error("Error getting tab id", error));

const createShadowRoot = () => {
  const exisitingShadowHost = document.getElementById(
    `${CLASSNAME_PREFIX}-container`,
  );

  if (exisitingShadowHost?.shadowRoot) {
    return {
      shadowHost: exisitingShadowHost,
      shadowRoot: exisitingShadowHost.shadowRoot,
    };
  }
  const shadowHost = document.createElement("div");
  shadowHost.id = `${CLASSNAME_PREFIX}-container`;
  document.body.appendChild(shadowHost);
  const shadowRoot = shadowHost.attachShadow({ mode: "open" });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  shadowDomStyle.use({ target: shadowRoot });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  globalStyle.use({ target: document.head });

  return { shadowHost, shadowRoot };
};

let shadowHost: HTMLElement | undefined, shadowRoot: ShadowRoot | undefined;

const downloadStorage = new StorageValue<ImageType>(
  "downloadOption",
  imageTypes[0],
);
const autoDownloadOptionStorage = new StorageValue<boolean>(
  "autoDownloadOption",
  true,
);

export const getShadowHost = () => {
  if (!shadowHost || !shadowRoot) {
    throw new Error("Wrong init context");
  }
  return { shadowHost, shadowRoot };
};

const buildScreenshotModeToolbar = () => {
  if (!shadowRoot) {
    return;
  }

  const createButton = (text: string, handler: (e: MouseEvent) => void) => {
    const button = createElementWithClassNames(
      "button",
      `${CLASSNAME_PREFIX}-toolbar-button`,
    );
    button.textContent = text;
    button.addEventListener("click", handler);
    return button;
  };

  const toolbar = shadowRoot.appendChild(
    createElementWithClassNames("div", `${CLASSNAME_PREFIX}-toolbar`),
  );
  toolbar.appendChild(
    createButton("Element", () => switchScreenshotMode("element")),
  );
  toolbar.appendChild(
    createButton(
      "Page",
      () => void capturePage().catch((err) => console.error(err)),
    ),
  );
  toolbar.appendChild(createButton("Area", () => switchScreenshotMode("area")));
  toolbar.appendChild(createButton("Cancel", () => closeScreenshotTool()));
  const autodownloadCheckbox = createElementWithAttributes("input", {
    type: "checkbox",
    id: "autodownload-checkbox",
  }) as HTMLInputElement;
  const autodownloadLabel = toolbar.appendChild(
    createElementWithClassNames("label", "autodownload-label"),
  );
  autodownloadLabel.textContent = "Auto-download";
  autodownloadLabel.appendChild(autodownloadCheckbox);
  downloadStorage
    .get()
    .then(() => {
      autodownloadCheckbox.checked = autoDownloadOptionStorage.value ?? true;
    })
    .catch((error) =>
      console.error("Error getting autodownload option", error),
    );
  autodownloadCheckbox.addEventListener("change", (e) => {
    autoDownloadOptionStorage
      .set((e.target as HTMLInputElement).checked)
      .catch((err) => {
        console.error("Error setting autodownload option", err);
      });
  });
};

export const closeScreenshotTool = () => {
  clearAllSelections();
  clearMode();
  const { shadowHost } = getShadowHost();
  shadowHost.remove();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  globalStyle.unuse();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  shadowDomStyle.unuse();
  tabId &&
    sendScriptFinishedEvent(tabId)
      .then(() => logger("script closed"))
      .catch((error) => console.error("Error sending close event", error));
};

const handleEscapeKey = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    closeScreenshotTool();
    document.removeEventListener("keydown", handleEscapeKey, {
      capture: true,
    });
  }
};

const initScript = () => {
  const exisitingShadowHost = document.getElementById(
    `${CLASSNAME_PREFIX}-container`,
  );

  if (exisitingShadowHost?.shadowRoot) {
    return;
  }
  ({ shadowHost, shadowRoot } = createShadowRoot());
  buildScreenshotModeToolbar();
  capturePage().catch((err) => console.error(err));
  // switchScreenshotMode("element");

  document.addEventListener("keydown", handleEscapeKey, {
    capture: true,
  });

  return createShadowRoot;
};
initScript();
/*
TODO:

Implement full page, select area mode.
Right bar with options for created screenshot:border size, border color, shadow size, shadow color. 
Save options: name, format, quality, download button.
Request persmission for CORS 

DONE:
lower bar with button for whole page, select element, (select area).  DONE
Invoke script on click on extension icon. DONE
clean up on cancel or ESC button DONE
Copy as image. DONE
Right bar with options for created screenshot: padding size DONE, padding color DONE, border-radius DONE, 

*/
