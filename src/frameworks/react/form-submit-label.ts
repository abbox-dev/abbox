import { Node, SyntaxKind } from "ts-morph";
import { extractStaticLabel } from "./jsx-label.js";
import { staticStringFromJsxAttribute } from "./jsx-static-attributes.js";

export function submitLabelForFormElement(
  formElement: import("ts-morph").JsxElement,
): string | undefined {
  const opening = formElement.getOpeningElement();
  const formAria = staticStringFromJsxAttribute(
    opening.getAttributes(),
    "aria-label",
  );
  if (formAria !== undefined && formAria.length > 0) {
    return formAria;
  }

  return submitButtonLabelInForm(formElement);
}

function submitButtonLabelInForm(
  formElement: import("ts-morph").JsxElement,
): string | undefined {
  for (const element of formElement.getDescendantsOfKind(
    SyntaxKind.JsxElement,
  )) {
    const label = labelFromSubmitControl(element);
    if (label !== undefined) {
      return label;
    }
  }
  for (const element of formElement.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement,
  )) {
    const label = labelFromSubmitSelfClosing(element);
    if (label !== undefined) {
      return label;
    }
  }
  return undefined;
}

function labelFromSubmitControl(
  element: import("ts-morph").JsxElement,
): string | undefined {
  const opening = element.getOpeningElement();
  if (!isSubmitButtonTag(opening.getTagNameNode())) {
    return undefined;
  }
  if (!isSubmitType(opening.getAttributes())) {
    return undefined;
  }
  return extractStaticLabel(element);
}

function labelFromSubmitSelfClosing(
  element: import("ts-morph").JsxSelfClosingElement,
): string | undefined {
  if (!isSubmitButtonTag(element.getTagNameNode())) {
    return undefined;
  }
  if (!isSubmitType(element.getAttributes())) {
    return undefined;
  }
  return extractStaticLabel(element);
}

function isSubmitButtonTag(tagName: import("ts-morph").Node): boolean {
  return Node.isIdentifier(tagName) && tagName.getText() === "button";
}

function isSubmitType(
  attributes: readonly import("ts-morph").JsxAttributeLike[],
): boolean {
  const typeValue = staticStringFromJsxAttribute(attributes, "type");
  if (typeValue === "submit") {
    return true;
  }
  return typeValue === undefined;
}
