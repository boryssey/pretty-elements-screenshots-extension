export const createElementWithClassNames = (
  tagName: string,
  ...className: string[]
) => {
  const newElement = document.createElement(tagName);

  newElement.classList.add(...className);
  return newElement;
};

export const createElementWithAttributes = (
  tagName: string,
  attributes?: Record<string, string> | null,
  ...className: string[]
) => {
  const newElement = document.createElement(tagName);

  attributes &&
    Object.entries(attributes).forEach(([key, value]) => {
      newElement.setAttribute(key, value);
    });

  newElement.classList.add(...className);

  return newElement;
};

export const downloadCanvas = (canvas: HTMLCanvasElement) => {
  const link = document.createElement("a");
  link.download = "screenshot.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};
