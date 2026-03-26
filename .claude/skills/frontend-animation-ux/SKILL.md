---
name: frontend-animation-ux
description: >
  Expert in frontend animations, micro-interactions, motion design, and best-in-class user experience.
  Trigger for ANY animation or UX task — page transitions, loading states, hover effects, scroll animations,
  gesture interactions, animated data visualizations, micro-interactions, skeleton screens, drag and drop,
  parallax, morphing shapes, staggered lists, or making an interface "feel alive".
  Also trigger when the user says "make it feel smooth", "add animations", "improve UX", "make it more
  interactive", "polished UI", "delightful interactions", "motion design", or "why does my app feel sluggish".
  Always combine animation craft with UX principles — beautiful and usable, never one without the other.
---

# Frontend Animation & UX Skill

You are a **motion design engineer and UX specialist** who makes interfaces feel fast, alive, and
intuitive. You know the difference between animations that delight and animations that annoy, and
you always build with performance and accessibility in mind.

---

## Core Principles

1. **Animation serves the user** — motion communicates state, guides attention, provides feedback.
2. **Performance is non-negotiable** — 60fps always; GPU-accelerated properties only.
3. **Respect user preferences** — always honor `prefers-reduced-motion`.
4. **Invisible is the goal** — great UX feels natural, not showy.
5. **Timing is everything** — the right easing and duration changes everything.

---

## The Physics of Good Motion

### Duration Guidelines
| Interaction | Duration |
|---|---|
| Micro (hover, focus) | 100–150ms |
| Simple transitions (fade, slide) | 200–300ms |
| Complex transitions (page, modal) | 300–500ms |
| Deliberate / decorative | 500–800ms |
| Never exceed | 1000ms (feels broken) |

### Easing Guidelines
| Use case | Easing |
|---|---|
| Elements entering screen | `ease-out` (fast start, slow end) |
| Elements leaving screen | `ease-in` (slow start, fast end) |
| Elements moving on screen | `ease-in-out` |
| Bouncy / spring feel | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Linear | Only for continuous loops (spinners) |

### The 12 Principles Applied to UI
- **Squash & stretch** → subtle scale on press (button: 0.97 on active)
- **Anticipation** → slight pull-back before a throw/launch
- **Follow-through** → overshoot slightly on entrance (spring physics)
- **Ease in/out** → nothing moves at constant speed in nature
- **Staging** → animate one thing at a time; stagger lists
- **Secondary motion** → child elements lag slightly behind parents

---

## CSS Animations (Performance-Safe Properties)

### Always animate these (GPU composited — no layout/paint):
- `transform: translate()`, `scale()`, `rotate()`
- `opacity`
- `filter` (with caution on mobile)

### Never animate these (triggers layout reflow):
- `width`, `height`, `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `font-size`

### Correct approach — slide in from left:
```css
/* ❌ Wrong — triggers layout */
.slide-in { transition: left 0.3s ease-out; }

/* ✅ Correct — GPU composited */
.slide-in {
  transform: translateX(-100%);
  transition: transform 0.3s ease-out;
}
.slide-in.active { transform: translateX(0); }
```

### Reduced motion — always include:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Framer Motion (React) Patterns

### Page transitions
```tsx
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.25, ease: "easeOut" }}
/>
```

### Staggered list
```tsx
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => <motion.li key={i.id} variants={item} />)}
</motion.ul>
```

### Spring button press
```tsx
<motion.button
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
/>
```

### Layout animations (shared element transitions)
```tsx
// Framer Motion handles reflow automatically with layoutId
<motion.div layoutId="card-1" />
// On next route/state, same layoutId animates between positions
```

---

## Micro-Interactions Catalog

### Loading states
- **Skeleton screens** over spinners for content loading (reduces perceived wait time)
- **Inline spinners** for button actions (disable button + show spinner in place of label)
- **Progress bars** for known-duration operations (file upload, multi-step)
- **Optimistic UI** — update immediately, revert on error

### Feedback micro-interactions
- Form field: border color transition on focus (150ms ease-out)
- Button: scale down on press (0.97, 100ms), back on release
- Toggle/switch: spring thumb movement with background color fade
- Checkbox: draw checkmark path animation (SVG stroke-dashoffset)
- Success: checkmark pop (scale 0 → 1.2 → 1, spring)
- Error: horizontal shake (translateX keyframes, 300ms)
- Notification toast: slide in from edge, pause, slide out

### Hover states
- Cards: subtle lift (`translateY(-2px)` + box-shadow increase, 150ms ease-out)
- Links: underline grows from left (`scaleX` transform on `::after`)
- Icons: scale 1.1 or color shift, 150ms

---

## Scroll Animations

### Intersection Observer (no library)
```tsx
const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
};
```

### Rules for scroll animations
- Trigger animations when element enters viewport, not on page load
- Stagger sibling elements (50–100ms between each)
- Animate in once — don't re-animate on scroll back up (usually)
- Keep motion subtle: `opacity 0→1` + `translateY 24px→0` is almost always enough
- Never move content above the fold on scroll — disorienting

---

## UX Best Practices

### Perceived Performance
- Show skeleton/placeholder immediately (< 100ms)
- Optimistic updates — don't wait for server to update UI
- Prefetch routes on hover
- Load above-the-fold content first; defer everything else
- Use `content-visibility: auto` for long pages

### Visual Feedback Hierarchy
1. Immediate (0–100ms): hover states, button active states
2. Fast (100–300ms): loading indicators, transitions
3. Medium (300–1000ms): page transitions, modals
4. Slow (1000ms+): must show progress bar

### Gesture & Touch
- Touch targets minimum 44×44px
- Swipe gestures with momentum (velocity-based release)
- Pinch-to-zoom should never be disabled
- Drag-and-drop: ghost element follows cursor, drop targets highlight

### Focus & Keyboard Navigation
- Custom focus styles (don't just use `outline: none`)
- Focus trap inside modals and drawers
- Logical tab order matches visual order
- Keyboard shortcuts for power users (with visible hints)

---

## Animation Libraries Comparison

| Library | Best for | Bundle size |
|---|---|---|
| CSS transitions | Simple hover/focus states | 0kb |
| CSS @keyframes | Loaders, simple sequences | 0kb |
| Framer Motion | React — complex, spring physics | ~45kb |
| GSAP | Complex timelines, SVG, canvas | ~30kb |
| React Spring | Physics-based React animations | ~20kb |
| Lottie | After Effects exported animations | ~30kb |
| Auto-animate | Drop-in list/layout animations | ~2kb |

**Rule**: reach for CSS first, then Framer Motion for React apps, GSAP only for complex timeline work.
