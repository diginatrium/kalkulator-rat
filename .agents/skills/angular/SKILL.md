---
name: angular
description: Modern Angular (v20+) expert with deep knowledge of Signals, Standalone Components, Zoneless applications, SSR/Hydration, and reactive patterns.
risk: safe
source: self
date_added: '2026-02-27'
---

# Angular Expert

Master modern Angular development with Signals, Standalone Components, Zoneless applications, SSR/Hydration, and the latest reactive patterns.

## When to Use This Skill

- Building new Angular applications (v20+)
- Implementing Signals-based reactive patterns
- Creating Standalone Components and migrating from NgModules
- Configuring Zoneless Angular applications
- Implementing SSR, prerendering, and hydration
- Optimizing Angular performance
- Adopting modern Angular patterns and best practices

## Do Not Use This Skill When

- Migrating from AngularJS (1.x) → use `angular-migration` skill
- Working with legacy Angular apps that cannot upgrade
- General TypeScript issues → use `typescript-expert` skill

## Instructions

1. Assess the Angular version and project structure
2. Apply modern patterns (Signals, Standalone, Zoneless)
3. Implement with proper typing and reactivity
4. Validate with build and tests

## Safety

- Always test changes in development before production
- Gradual migration for existing apps (don't big-bang refactor)
- Keep backward compatibility during transitions

---

## Angular Version Timeline

| Version        | Release | Key Features                                           |
| -------------- | ------- | ------------------------------------------------------ |
| **Angular 20** | Q2 2025 | Signals stable, Zoneless stable, Incremental hydration |
| **Angular 21** | Q4 2025 | Signals-first default, Enhanced SSR                    |
| **Angular 22** | Q2 2026 | Signal Forms, Selectorless components                  |

---

## 1. Signals: The New Reactive Primitive

Signals are Angular's fine-grained reactivity system, replacing zone.js-based change detection.

### Core Concepts

```typescript
import { signal, computed, effect } from "@angular/core";

const count = signal(0);
console.log(count()); // 0
count.set(5);
count.update((v) => v + 1);

const doubled = computed(() => count() * 2);

effect(() => {
  console.log(`Count changed to: ${count()}`);
});
```

### Signal-Based Inputs and Outputs

```typescript
import { Component, input, output, model } from "@angular/core";

@Component({
  selector: "app-user-card",
  template: `
    <div class="card">
      <h3>{{ name() }}</h3>
      <button (click)="select.emit(id())">Select</button>
    </div>
  `,
})
export class UserCardComponent {
  id = input.required<string>();
  name = input.required<string>();
  role = input<string>("User");
  select = output<string>();
  isSelected = model(false);
}
```

### When to Use Signals vs RxJS

| Use Case                | Signals         | RxJS                             |
| ----------------------- | --------------- | -------------------------------- |
| Local component state   | ✅ Preferred    | Overkill                         |
| Derived/computed values | ✅ `computed()` | `combineLatest` works            |
| HTTP requests           | ❌              | ✅ HttpClient returns Observable |
| Complex async flows     | ❌              | ✅ `switchMap`, `mergeMap`       |

---

## 2. Standalone Components

```typescript
@Component({
  selector: "app-header",
  imports: [RouterLink],
  template: `<a routerLink="/">Home</a>`,
})
export class HeaderComponent {}
```

### Bootstrapping Without NgModule

```typescript
bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient()],
});
```

---

## 3. Zoneless Angular

```typescript
bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
});
```

### Zoneless Component Pattern

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>Count: {{ count() }}</div><button (click)="increment()">+</button>`,
})
export class CounterComponent {
  count = signal(0);
  increment() { this.count.update((v) => v + 1); }
}
```

---

## 4. Modern Routing

```typescript
export const routes: Routes = [
  {
    path: "dashboard",
    loadComponent: () => import("./dashboard/dashboard.component").then((m) => m.DashboardComponent),
  },
];
```

---

## 5. Dependency Injection

```typescript
@Component({...})
export class UserComponent {
  private userService = inject(UserService);
  users = toSignal(this.userService.getUsers());
}
```

---

## 6. Performance

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

```html
@defer (on viewport) {
  <app-heavy-chart />
} @placeholder {
  <div class="skeleton" />
}
```

---

## Best Practices Summary

| Pattern              | ✅ Do                          | ❌ Don't                        |
| -------------------- | ------------------------------ | ------------------------------- |
| **State**            | Use Signals for local state    | Overuse RxJS for simple state   |
| **Change Detection** | OnPush + Signals               | Default CD everywhere           |
| **DI**               | `inject()` function            | Constructor injection           |
| **Inputs**           | `input()` signal function      | `@Input()` decorator (legacy)   |
| **Zoneless**         | Enable for new projects        | Force on legacy without testing |

---

## Resources

- [Angular.dev Documentation](https://angular.dev)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular Update Guide](https://angular.dev/update-guide)
