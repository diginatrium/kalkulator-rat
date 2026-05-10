---
name: angular-best-practices
description: "Angular performance optimization and best practices guide. Use when writing, reviewing, or refactoring Angular code for optimal performance, bundle size, and rendering efficiency."
risk: safe
source: self
date_added: "2026-02-27"
---

# Angular Best Practices

Comprehensive performance optimization guide for Angular applications. Contains prioritized rules for eliminating performance bottlenecks, optimizing bundles, and improving rendering.

## When to Use
Reference these guidelines when:

- Writing new Angular components or pages
- Implementing data fetching patterns
- Reviewing code for performance issues
- Refactoring existing Angular code
- Optimizing bundle size or load times

---

## Rule Categories by Priority

| Priority | Category              | Impact     | Focus                           |
| -------- | --------------------- | ---------- | ------------------------------- |
| 1        | Change Detection      | CRITICAL   | Signals, OnPush, Zoneless       |
| 2        | Bundle Optimization   | CRITICAL   | Lazy loading, tree shaking      |
| 3        | Rendering Performance | HIGH       | @defer, trackBy, virtualization |
| 4        | Template Optimization | MEDIUM     | Control flow, pipes             |
| 5        | State Management      | MEDIUM     | Signal patterns, selectors      |
| 6        | Memory Management     | LOW-MEDIUM | Cleanup, subscriptions          |

---

## 1. Change Detection (CRITICAL)

```typescript
// CORRECT - OnPush with Signals
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>{{ count() }}</div>`,
})
export class CounterComponent {
  count = signal(0);
}
```

Enable Zoneless for new projects:
```typescript
bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
});
```

---

## 2. Bundle Optimization (CRITICAL)

```typescript
// Lazy load feature routes
export const routes: Routes = [
  {
    path: "calculator",
    loadComponent: () => import("./calculator/calculator.component").then((m) => m.CalculatorComponent),
  },
];
```

```html
<!-- Heavy components with @defer -->
@defer (on viewport) {
  <app-balance-chart [data]="data()" />
} @placeholder {
  <div class="chart-skeleton"></div>
}
```

---

## 3. Rendering Performance (HIGH)

```html
<!-- Always use trackBy with @for -->
@for (item of items(); track item.id) {
  <app-item-card [item]="item" />
}
```

```typescript
// Computed for derived data
filteredProducts = computed(() => {
  const f = this.filter().toLowerCase();
  return this.products().filter(p => p.name.toLowerCase().includes(f));
});
```

---

## 4. Template Optimization (MEDIUM)

```html
<!-- New control flow syntax -->
@if (user()) {
  <span>{{ user()!.name }}</span>
} @else {
  <span>Guest</span>
}
```

---

## 5. Memory Management (LOW-MEDIUM)

```typescript
// takeUntilDestroyed for subscriptions
@Component({...})
export class DataComponent {
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.data$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => this.process(data));
  }
}

// Prefer signals over subscriptions
data = toSignal(this.service.data$, { initialValue: null });
```

---

## Quick Reference Checklist

### New Component
- [ ] `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] Signals for state (`signal()`, `input()`, `output()`)
- [ ] `inject()` for dependencies
- [ ] `@for` with `track` expression

### Performance Review
- [ ] No methods in templates (use pipes or computed)
- [ ] Large lists virtualized
- [ ] Heavy components deferred
- [ ] Routes lazy-loaded

---

## Resources

- [Angular Performance Guide](https://angular.dev/best-practices/performance)
- [Zoneless Angular](https://angular.dev/guide/experimental/zoneless)
- [Change Detection Deep Dive](https://angular.dev/guide/change-detection)
