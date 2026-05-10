---
name: angular-state-management
description: "Master modern Angular state management with Signals and RxJS. Use when setting up global state, managing component stores, choosing between state solutions, or migrating from legacy patterns."
risk: safe
source: self
date_added: "2026-02-27"
---

# Angular State Management

Comprehensive guide to modern Angular state management patterns, from Signal-based local state to shared services.

## When to Use This Skill

- Setting up state management in Angular
- Managing component-level or shared stores
- Implementing optimistic updates
- Debugging state-related issues
- Migrating from legacy BehaviorSubject patterns

---

## State Categories

| Type             | Description                  | Solutions             |
| ---------------- | ---------------------------- | --------------------- |
| **Local State**  | Component-specific, UI state | Signals, `signal()`   |
| **Shared State** | Between related components   | Signal services       |
| **Form State**   | Input values, validation     | Reactive Forms        |

```
Small app, simple state → Signal Services
Medium app, moderate state → Component Stores
```

---

## Pattern 1: Simple Signal Service

```typescript
@Injectable({ providedIn: "root" })
export class CounterService {
  private _count = signal(0);

  readonly count = this._count.asReadonly();
  readonly doubled = computed(() => this._count() * 2);

  increment() { this._count.update((v) => v + 1); }
  reset() { this._count.set(0); }
}

@Component({
  template: `<p>Count: {{ counter.count() }}</p>`,
})
export class CounterComponent {
  counter = inject(CounterService);
}
```

---

## Pattern 2: Feature Signal Store

```typescript
@Injectable({ providedIn: "root" })
export class LoanStore {
  private _loanInput = signal<LoanInput | null>(null);
  private _loading = signal(false);

  readonly loanInput = computed(() => this._loanInput());
  readonly loading = computed(() => this._loading());

  setLoanInput(input: LoanInput) { this._loanInput.set(input); }
}
```

---

## Best Practices

### Do's

| Practice                           | Why                                |
| ---------------------------------- | ---------------------------------- |
| Use Signals for local state        | Simple, reactive, no subscriptions |
| Use `computed()` for derived data  | Auto-updates, memoized             |
| Colocate state with feature        | Easier to maintain                 |
| Prefer `inject()` over constructor | Cleaner, works in factories        |

### Don'ts

| Anti-Pattern                      | Instead                                               |
| --------------------------------- | ----------------------------------------------------- |
| Store derived data                | Use `computed()`                                      |
| Mutate signals directly           | Use `set()` or `update()`                             |
| Over-globalize state              | Keep local when possible                              |
| Subscribe in components for state | Use template with signals                             |

---

## Migration: BehaviorSubject → Signals

```typescript
// Before: RxJS-based
@Injectable({ providedIn: "root" })
export class OldService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  setUser(user: User) { this.userSubject.next(user); }
}

// After: Signal-based
@Injectable({ providedIn: "root" })
export class UserService {
  private _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  setUser(user: User) { this._user.set(user); }
}
```

---

## Bridging Signals and RxJS

```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// Observable → Signal
userId = toSignal(this.route.params.pipe(map(p => p['id'])), { initialValue: '' });

// Signal → Observable
filter$ = toObservable(this.filter);
filteredData$ = this.filter$.pipe(debounceTime(300), switchMap(f => this.http.get(`/api/data?q=${f}`)));
```

---

## Resources

- [Angular Signals Guide](https://angular.dev/guide/signals)
