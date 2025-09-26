import React, { useEffect } from "react";
import "./FormAccessibility.css";

interface FormAccessibilityProviderProps {
  formRef: React.RefObject<HTMLFormElement>;
  uiSchema: Record<string, any>;
  formSchema: Record<string, any>;
  children: React.ReactNode;
}

/**
 * FormAccessibilityProvider Component
 *
 * Handles field grouping and basic accessibility compliance for RJSF forms.
 * This component focuses on legend border styling and field grouping while
 * allowing RJSF to handle default form element styling.
 *
 * Uses stable selectors for better maintainability and focuses on accessibility structure.
 */
const FormAccessibilityProvider: React.FC<FormAccessibilityProviderProps> = ({
  formRef,
  uiSchema,
  formSchema,
  children,
}) => {
  /**
   * Apply field grouping after form renders
   * Groups form fields into fieldsets based on uiSchema metadata
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Add basic accessibility container class
      addAccessibilityContainer();

      // Only apply field grouping if uiSchema exists
      if (formRef.current && uiSchema && Object.keys(uiSchema).length > 0) {
        applyFieldGrouping();
      }

      hideEmptyDivs();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [formSchema, uiSchema]);

  /**
   * Groups form fields into visual fieldsets with legends
   */
  const applyFieldGrouping = () => {
    const formContainer = formRef.current?.querySelector
      ? formRef.current
      : null;
    let formElement = null;

    if (formContainer) {
      formElement = formContainer;
    } else {
      formElement = document.querySelector("form");
    }

    if (!formElement) {
      return;
    }

    // Get all field groups from uiSchema
    const fieldGroups: Record<string, { label: string; fields: Element[] }> =
      {};

    // First pass: Create all groups from any field that has ui:group
    Object.keys(uiSchema).forEach((fieldName) => {
      if (fieldName === "ui:order") return;

      const fieldConfig = uiSchema[fieldName];
      if (fieldConfig?.["ui:group"]) {
        const groupName = fieldConfig["ui:group"];
        const groupLabel = fieldConfig["ui:groupLabel"];

        if (!fieldGroups[groupName]) {
          fieldGroups[groupName] = { label: groupLabel, fields: [] };
        }
      }
    });

    // Second pass: Add all fields to their respective groups
    Object.keys(uiSchema).forEach((fieldName) => {
      if (fieldName === "ui:order") return;

      const fieldConfig = uiSchema[fieldName];
      if (fieldConfig?.["ui:group"]) {
        const groupName = fieldConfig["ui:group"];

        const fieldElement = findFieldElement(formElement, fieldName);

        if (fieldElement && fieldGroups[groupName]) {
          // Check if this field is already in any group to prevent duplicates
          const alreadyGrouped = Object.values(fieldGroups).some((group) =>
            group.fields.includes(fieldElement)
          );

          if (!alreadyGrouped) {
            fieldGroups[groupName].fields.push(fieldElement);
          }
        }
      }
    });

    // Create fieldsets for each group
    const groupEntries = Object.entries(fieldGroups);
    groupEntries.forEach(([groupName, group]) => {
      if (group.fields.length > 0) {
        createFieldset(group, groupName);
      }
    });
  };

  /**
   * Finds a form field element using multiple strategies
   */
  const findFieldElement = (
    formElement: Element,
    fieldName: string
  ): Element | null => {
    // Try multiple selectors to find the field
    let fieldElement: Element | null =
      formElement
        .querySelector(`#root_${fieldName}`)
        ?.closest(
          ".chakra-form__group, .form-group, .field, div[data-field]"
        ) || null;

    // Use nullish coalescing assignment for cleaner fallback logic
    fieldElement ??=
      formElement
        .querySelector(`[id*="${fieldName}"]`)
        ?.closest(
          ".chakra-form__group, .form-group, .field, div[data-field]"
        ) || null;

    fieldElement ??=
      formElement
        .querySelector(`[name*="${fieldName}"]`)
        ?.closest(".chakra-form__group, .form-group, .field, div") || null;

    if (!fieldElement) {
      // Try finding by label text
      const labelElements = formElement.querySelectorAll("label");
      for (const label of labelElements) {
        const labelText = label.textContent?.toLowerCase() || "";
        const fieldNameParts = fieldName.toLowerCase().split("_");

        if (
          labelText.includes(fieldName.toLowerCase()) ||
          fieldNameParts.some(
            (part) => part.length > 2 && labelText.includes(part)
          )
        ) {
          fieldElement =
            label.closest(".chakra-form__group, .form-group, .field, div") ||
            null;
          break;
        }
      }
    }

    return fieldElement;
  };

  /**
   * Creates a fieldset wrapper for a group of fields
   */
  const createFieldset = (
    group: { label: string; fields: Element[] },
    groupName: string
  ) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "field-group";
    fieldset.setAttribute("data-group", groupName);

    // Create legend
    const legend = document.createElement("legend");
    legend.textContent = group.label;
    legend.className = "field-group-legend";

    fieldset.appendChild(legend);

    // Move fields into fieldset
    const firstField = group.fields[0];
    if (firstField?.parentNode) {
      firstField.parentNode.insertBefore(fieldset, firstField);

      group.fields.forEach((field) => {
        fieldset.appendChild(field);
      });
    }
  };

  /**
   * Adds basic accessibility container class to form elements
   */
  const addAccessibilityContainer = () => {
    const formContainer = formRef.current?.querySelector
      ? formRef.current
      : null;
    let formElement = formContainer || document.querySelector("form");

    if (!formElement || !(formElement instanceof HTMLElement)) {
      return;
    }

    // Add main accessibility container class
    formElement.classList.add("form-accessibility-container");
  };

  /**
   * Hides empty divs that create unwanted gaps between fieldsets
   * Uses CSS classes for styling
   */
  const hideEmptyDivs = () => {
    const formContainer = formRef.current?.querySelector
      ? formRef.current
      : null;
    const formElement = formContainer || document.querySelector("form");

    if (!formElement) return;

    setTimeout(() => {
      // Use specific selectors for empty divs
      const emptyDivs = formElement.querySelectorAll(
        'div.css-0, div[class="css-0"]:not([role]):not([class*="react-select"]):not([data-react-select])'
      );

      emptyDivs.forEach((div: Element) => {
        const hasContent =
          div.textContent?.trim() ||
          div.querySelector(
            "input, select, textarea, button, img, label, fieldset"
          ) ||
          div.children.length > 0;

        // Only hide divs that are truly empty and don't contain any form elements
        const containsFormElements = div.querySelector(
          "input, select, textarea, button, label, fieldset, .chakra-form__group, .form-group, .field"
        );

        if (
          !hasContent &&
          !containsFormElements &&
          div instanceof HTMLElement
        ) {
          // The hiding is handled by CSS in FormAccessibility.css
          // Just ensure the element has the proper class for CSS targeting
          if (!div.classList.contains("css-0")) {
            div.classList.add("css-0");
          }
        }
      });
    }, 150);
  };

  return <>{children}</>;
};

export default FormAccessibilityProvider;
