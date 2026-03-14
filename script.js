function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatInt(n) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}

function setupYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

function setupMobileMenu() {
  const btn = document.querySelector(".burger");
  const menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;

  const close = () => {
    btn.setAttribute("aria-expanded", "false");
    menu.hidden = true;
    document.body.style.overflow = "";
  };

  const open = () => {
    btn.setAttribute("aria-expanded", "true");
    menu.hidden = false;
    document.body.style.overflow = "hidden";
  };

  btn.addEventListener("click", () => {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    if (expanded) close();
    else open();
  });

  menu.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName === "A") close();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 840) close();
  });
}

function setupReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  els.forEach((el) => io.observe(el));
}

function animateCount(el) {
  const raw = el.getAttribute("data-count");
  const suffix = el.getAttribute("data-suffix") || "";
  const target = Number(raw);
  if (!Number.isFinite(target)) return;

  const start = 0;
  const duration = 1100;
  const t0 = performance.now();

  const step = (t) => {
    const p = clamp((t - t0) / duration, 0, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const value = Math.round(start + (target - start) * ease);
    el.textContent = `${formatInt(value)}${suffix}`;
    if (p < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function setupCounters() {
  const counts = document.querySelectorAll(".count");
  if (!counts.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );

  counts.forEach((el) => io.observe(el));
}

function setupPricingToggle() {
  const toggle = document.getElementById("billingToggle");
  if (!toggle) return;

  const values = document.querySelectorAll(".price__value");
  const perLabels = document.querySelectorAll(".per-label");

  const apply = (isYear) => {
    values.forEach((el) => {
      const raw = el.getAttribute(isYear ? "data-year" : "data-month");
      const n = Number(raw);
      el.textContent = Number.isFinite(n) ? formatInt(n) : (raw || "—");
    });
    perLabels.forEach((el) => (el.textContent = isYear ? "год" : "мес"));
  };

  const setPressed = (isYear) => {
    toggle.setAttribute("aria-pressed", isYear ? "true" : "false");
    apply(isYear);
  };

  toggle.addEventListener("click", () => {
    const isYear = toggle.getAttribute("aria-pressed") !== "true";
    setPressed(isYear);
  });

  setPressed(false);
}

function setupFAQSingleOpen() {
  const items = Array.from(document.querySelectorAll(".qa"));
  if (!items.length) return;

  items.forEach((d) => {
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      items.forEach((other) => {
        if (other !== d) other.open = false;
      });
    });
  });
}

function setupFAQSmoothOpen() {
  const items = Array.from(document.querySelectorAll(".qa"));
  if (!items.length) return;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  items.forEach((details) => {
    const summary = details.querySelector("summary");
    const body = details.querySelector(".qa__body");
    if (!summary || !body) return;

    let anim = null;

    summary.addEventListener("click", (e) => {
      e.preventDefault();
      if (anim) anim.cancel();

      const wasOpen = details.open;
      const startHeight = details.getBoundingClientRect().height;

      if (!wasOpen) {
        details.open = true;
      }

      requestAnimationFrame(() => {
        const endHeight = (() => {
          if (wasOpen) {
            // Measure closed height by temporarily forcing open=false,
            // then restore for animation (keeps semantics intact).
            details.open = false;
            const closed = details.getBoundingClientRect().height;
            details.open = true;
            return closed;
          }
          return details.getBoundingClientRect().height;
        })();

        if (wasOpen) {
          // closing: animate to closed height, then set open=false
          anim = details.animate(
            [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
            { duration: 240, easing: "ease-out" }
          );
          details.style.overflow = "hidden";
          anim.onfinish = () => {
            details.style.height = "";
            details.style.overflow = "";
            details.open = false;
            anim = null;
          };
          anim.oncancel = () => {
            details.style.height = "";
            details.style.overflow = "";
            anim = null;
          };
        } else {
          // opening: animate from startHeight (closed) to endHeight (open)
          anim = details.animate(
            [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
            { duration: 280, easing: "ease-out" }
          );
          details.style.overflow = "hidden";
          anim.onfinish = () => {
            details.style.height = "";
            details.style.overflow = "";
            anim = null;
          };
          anim.oncancel = () => {
            details.style.height = "";
            details.style.overflow = "";
            anim = null;
          };
        }
      });
    });

    // Keyboard: space/enter on summary should behave the same.
    summary.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        summary.click();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupYear();
  setupMobileMenu();
  setupReveal();
  setupCounters();
  setupPricingToggle();
  setupFAQSingleOpen();
  setupFAQSmoothOpen();
});

