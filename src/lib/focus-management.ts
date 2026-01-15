/**
 * Focus Management Utility
 * Implements proper keyboard navigation and focus management for accessibility
 * Following WCAG 2.2 AA standards for focus management
 */

/**
 * Trap focus within a given container
 * @param container The DOM element to trap focus within
 * @returns Cleanup function to remove event listeners
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  
  if (focusableElements.length === 0) {
    // If no focusable elements, return early
    return () => undefined;
  }

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      event.preventDefault();
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus the first element when trapping begins
  firstElement.focus();

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Get all focusable elements within a container
 * @param container The DOM element to search within
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): Element[] {
  // Focusable elements selector based on HTML specifications
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'details summary:first-of-type',
    'iframe',
    'object',
    'embed',
    'area[href]',
    'audio[controls]',
    'video[controls]'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors))
    .filter((element): element is HTMLElement => element instanceof HTMLElement &&
                  !element.hasAttribute('disabled') && 
                  !element.getAttribute('aria-hidden') &&
                  element.offsetParent !== null); // Exclude visually hidden elements
}

/**
 * Move focus to an element with smooth scrolling
 * @param element The element to focus
 * @param options ScrollIntoView options
 */
export function focusElement(element: HTMLElement, options?: ScrollIntoViewOptions): void {
  element.focus({
    preventScroll: true // Prevent automatic scrolling, we'll handle it manually
  });

  // Scroll element into view if needed
  if (options !== undefined) {
    element.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      ...options
    });
  } else {
    element.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth'
    });
  }
}

/**
 * Focus the first focusable element in a container
 * @param container The container to search within
 * @returns Boolean indicating if an element was focused
 */
export function focusFirstElement(container: HTMLElement): boolean {
  const focusableElements = getFocusableElements(container);
  
  if (focusableElements.length > 0) {
    const firstElement = focusableElements[0] as HTMLElement;
    focusElement(firstElement);
    return true;
  }
  
  return false;
}

/**
 * Store the currently focused element
 * @returns Function to restore focus to the stored element
 */
export function storeCurrentFocus(): () => void {
  const currentFocusedElement = document.activeElement;

  return () => {
    if (currentFocusedElement instanceof HTMLElement && typeof currentFocusedElement.focus === 'function') {
      currentFocusedElement.focus();
    } else {
      // If the original element is no longer focusable, focus the body
      document.body.focus();
    }
  };
}

/**
 * Create a focus sentinel for focus trapping
 * @param onFocusOut Callback when focus moves out of the container
 * @returns Sentinel element
 */
export function createFocusSentinel(onFocusOut: () => void): HTMLElement {
  const sentinel = document.createElement('div');
  sentinel.setAttribute('tabindex', '0');
  sentinel.style.position = 'absolute';
  sentinel.style.width = '1px';
  sentinel.style.height = '1px';
  sentinel.style.padding = '0';
  sentinel.style.margin = '-1px';
  sentinel.style.overflow = 'hidden';
  sentinel.style.clipPath = 'inset(50%)';
  sentinel.style.whiteSpace = 'nowrap';
  sentinel.style.border = '0';
  
  sentinel.addEventListener('focus', onFocusOut);
  
  return sentinel;
}

/**
 * Manage focus when content changes dynamically
 * @param container The container that had content changes
 * @param options Options for focus management
 */
export interface FocusManagementOptions {
  autoFocus?: boolean; // Whether to auto-focus the first element
  restoreFocus?: boolean; // Whether to restore focus after changes
  focusFallback?: HTMLElement; // Element to focus if no focusable elements exist
}

export function manageFocusOnChange(
  container: HTMLElement, 
  options: FocusManagementOptions = {}
): void {
  const { autoFocus = false, restoreFocus = false, focusFallback } = options;
  
  if (restoreFocus) {
    const restoreFunction = storeCurrentFocus();
    // Restore focus after a brief delay to allow DOM updates
    setTimeout(restoreFunction, 1);
  }
  
  if (autoFocus) {
    const focused = focusFirstElement(container);
    if (!focused && focusFallback) {
      focusElement(focusFallback);
    }
  }
}