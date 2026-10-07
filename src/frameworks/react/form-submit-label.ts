import { Node, SyntaxKind } from "ts-morph";
import type { InteractionLabels } from "../../ir/product-ir.js";
import { extractStaticLabelEvidence } from "./jsx-label.js";
import { staticStringFromJsxAttribute } from "./jsx-static-attributes.js";

export function submitLabelForFormElement(
  formElement: import("ts-morph").JsxElement,
): string | undefined {
  return submitLabelEvidenceForFormElement(formElement)?.static;
}

export function submitLabelEvidenceForFormElement(
  formElement: import("ts-morph").JsxElement,
): InteractionLabels | undefined {
  const opening = formElement.getOpeningElement();
  const formAria = staticStringFromJsxAttribute(
    opening.getAttributes(),
    "aria-label",
  );
  if (formAria !== undefined && formAria.length > 0) {
    return { static: formAria, from: "aria-label" };
  }

  const fromButton = submitButtonLabelEvidenceInForm(formElement);
  if (fromButton === undefined) {
    return undefined;
  }
  return {
    static: fromButton.static,
    from: fromButton.from === "text" ? "submit-button" : fromButton.from,
  };
}

function submitButtonLabelEvidenceInForm(
  formElement: import("ts-morph").JsxElement,
): import("./jsx-label.js").StaticLabelEvidence | undefined {
  for (const element of formElement.getDescendantsOfKind(
    SyntaxKind.JsxElement,
  )) {
    const label = labelEvidenceFromSubmitControl(element);
    if (label !== undefined) {
      return label;
    }
  }
  for (const element of formElement.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement,
  )) {
    const label = labelEvidenceFromSubmitSelfClosing(element);
    if (label !== undefined) {
      return label;
    }
  }
  return undefined;
}

function labelEvidenceFromSubmitControl(
  element: import("ts-morph").JsxElement,
): import("./jsx-label.js").StaticLabelEvidence | undefined {
  const opening = element.getOpeningElement();
  if (!isSubmitButtonTag(opening.getTagNameNode())) {
    return undefined;
  }
  if (!isSubmitType(opening.getAttributes())) {
    return undefined;
  }
  return extractStaticLabelEvidence(element);
}

function labelEvidenceFromSubmitSelfClosing(
  element: import("ts-morph").JsxSelfClosingElement,
): import("./jsx-label.js").StaticLabelEvidence | undefined {
  if (!isSubmitButtonTag(element.getTagNameNode())) {
    return undefined;
  }
  if (!isSubmitType(element.getAttributes())) {
    return undefined;
  }
  return extractStaticLabelEvidence(element);
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
