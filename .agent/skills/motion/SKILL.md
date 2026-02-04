---
name: motion
description: Motion design standards for UI transitions, animations, and accessibility.
metadata:
  tags: motion, animation, transitions, accessibility, view-transitions
---

# Motion Skill

Use this skill whenever adding or reviewing animations, transitions, or view transitions.

## Principles

- **Subtle by default**: keep motion under 220ms for UI transitions.
- **One layer of motion**: avoid stacking page transitions with per-component entrance animations.
- **Reduced motion**: respect `prefers-reduced-motion` by disabling or simplifying transitions.
- **Performance-first**: prefer opacity/transform; avoid animating layout.

## View Transitions (Next.js)

- Use a single shared title element across routes via `view-transition-name`.
- Apply a container-level fade for page transitions.
- Exclude decorative backgrounds from transitions to avoid double motion.

## CSS Modules Standard

- Store transition rules in a shared CSS module.
- Use `:global` only for `::view-transition-*` rules.
- Keep utilities small and composable.

## Checklist

- [ ] Shared title has `view-transition-name`.
- [ ] Page container has `view-transition-name`.
- [ ] Reduced motion fallback included.
- [ ] No layout-affecting animations.
