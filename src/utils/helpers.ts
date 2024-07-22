export const createElementWithClassNames = (
  tagName: string,
  ...className: string[]
) => {
  const newElement = document.createElement(tagName);

  newElement.classList.add(...className);
  return newElement;
};
