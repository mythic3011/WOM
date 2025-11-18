/**
 * jQuery Helper Utilities
 * 
 * Common jQuery patterns and helper functions for consistent DOM manipulation
 * across the application.
 * 
 * @module utils/jquery/helpers
 */

import $ from 'jquery';

/**
 * Safely get jQuery element with existence check
 * 
 * Returns a jQuery object if the element exists, or null if not found.
 * This helps avoid errors when working with potentially missing elements.
 * 
 * @param {string|jQuery|HTMLElement} selector - CSS selector, jQuery object, or DOM element
 * @returns {jQuery|null} jQuery object or null if not found
 * 
 * @example
 * const $element = $safe('#myElement');
 * if ($element) {
 *   $element.addClass('active');
 * }
 * 
 * @example
 * // Works with jQuery objects
 * const $existing = $('#someElement');
 * const $safe = $safe($existing);
 */
export function $safe(selector) {
    const $el = $(selector);
    return $el.length ? $el : null;
}

/**
 * Create element with jQuery using a fluent options object
 * 
 * Provides a convenient way to create DOM elements with multiple properties
 * in a single call, reducing boilerplate code.
 * 
 * @param {string} tag - HTML tag name (e.g., 'div', 'span', 'a')
 * @param {Object} [options={}] - Element configuration options
 * @param {string} [options.class] - CSS class(es) to add
 * @param {string} [options.id] - Element ID
 * @param {string} [options.text] - Text content (escaped)
 * @param {string} [options.html] - HTML content (unescaped)
 * @param {Object} [options.attrs] - Object of attributes to set
 * @param {Object} [options.data] - Object of data attributes to set
 * @param {Object} [options.css] - Object of CSS properties to set
 * @param {Object} [options.on] - Object of event handlers {eventName: handler}
 * @returns {jQuery} jQuery wrapped element
 * 
 * @example
 * const $button = $create('button', {
 *   class: 'btn btn-primary',
 *   id: 'submitBtn',
 *   text: 'Submit',
 *   attrs: { type: 'submit', disabled: false },
 *   data: { userId: '123' },
 *   on: {
 *     click: handleClick,
 *     mouseenter: handleHover
 *   }
 * });
 * 
 * @example
 * const $link = $create('a', {
 *   class: 'download-link',
 *   attrs: { href: '/download', download: 'file.pdf' },
 *   text: 'Download File'
 * });
 */
export function $create(tag, options = {}) {
    const $el = $(`<${tag}>`);

    if (options.class) $el.addClass(options.class);
    if (options.id) $el.attr('id', options.id);
    if (options.text) $el.text(options.text);
    if (options.html) $el.html(options.html);
    if (options.attrs) $el.attr(options.attrs);
    if (options.data) $el.data(options.data);
    if (options.css) $el.css(options.css);
    if (options.on) {
        Object.entries(options.on).forEach(([event, handler]) => {
            $el.on(event, handler);
        });
    }

    return $el;
}

/**
 * Batch DOM operations for better performance
 * 
 * Executes multiple DOM operations in a batch to minimize reflows and repaints.
 * For operations on a specific element, detaches it from the DOM, performs
 * operations, then reattaches it.
 * 
 * @param {jQuery|string} $element - jQuery element or selector to batch operations on
 * @param {Function} callback - Function containing DOM operations to batch
 * @returns {jQuery} The modified jQuery element
 * 
 * @example
 * $batch($('#myList'), ($list) => {
 *   for (let i = 0; i < 100; i++) {
 *     $list.append(`<li>Item ${i}</li>`);
 *   }
 * });
 * 
 * @example
 * // Batch multiple property changes
 * $batch($('.cards'), ($cards) => {
 *   $cards.addClass('loading');
 *   $cards.attr('data-state', 'pending');
 *   $cards.css('opacity', '0.5');
 * });
 */
export function $batch($element, callback) {
    const $el = $($element);

    if (!$el.length) {
        console.warn('$batch: Element not found');
        return $el;
    }

    // Store parent and next sibling for reinsertion
    const $parent = $el.parent();
    const $next = $el.next();

    // Detach from DOM to prevent reflows during operations
    $el.detach();

    // Perform batched operations
    callback($el);

    // Reattach to DOM
    if ($next.length) {
        $next.before($el);
    } else {
        $parent.append($el);
    }

    return $el;
}

/**
 * Create a debounced function that delays execution
 * 
 * Debouncing ensures a function is only called after a specified delay has passed
 * since the last invocation. Useful for expensive operations triggered by rapid
 * events like typing, scrolling, or resizing.
 * 
 * @param {Function} fn - Function to debounce
 * @param {number} [delay=300] - Delay in milliseconds
 * @returns {Function} Debounced function
 * 
 * @example
 * // Debounce search input
 * const searchHandler = $debounce((query) => {
 *   performSearch(query);
 * }, 500);
 * 
 * $('#searchInput').on('input', function() {
 *   searchHandler($(this).val());
 * });
 * 
 * @example
 * // Debounce window resize
 * const handleResize = $debounce(() => {
 *   console.log('Window resized to:', $(window).width());
 * }, 250);
 * 
 * $(window).on('resize', handleResize);
 */
export function $debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Create a throttled function that limits execution rate
 * 
 * Throttling ensures a function is called at most once per specified time period,
 * regardless of how many times it's invoked. Useful for rate-limiting expensive
 * operations during continuous events like scrolling or mouse movement.
 * 
 * @param {Function} fn - Function to throttle
 * @param {number} [limit=300] - Time limit in milliseconds
 * @returns {Function} Throttled function
 * 
 * @example
 * // Throttle scroll handler
 * const scrollHandler = $throttle(() => {
 *   const scrollTop = $(window).scrollTop();
 *   updateScrollIndicator(scrollTop);
 * }, 100);
 * 
 * $(window).on('scroll', scrollHandler);
 * 
 * @example
 * // Throttle button clicks
 * const submitHandler = $throttle(() => {
 *   submitForm();
 * }, 1000);
 * 
 * $('#submitBtn').on('click', submitHandler);
 */
export function $throttle(fn, limit = 300) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
