import page from "page";

export function navigate(path) {
  page(path);
}

export function initSPALinks() {
  $(document).on("click", "a[data-link]", function (e) {
    e.preventDefault();
    const href = $(this).attr("href");
    if (href && href !== "#") {
      navigate(href);
    }
  });
}

export function getCurrentPath() {
  return window.location.pathname;
}

export function goBack() {
  window.history.back();
}

export function redirect(path) {
  page.redirect(path);
}

