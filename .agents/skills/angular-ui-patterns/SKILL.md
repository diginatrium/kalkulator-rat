---
name: angular-ui-patterns
description: "Modern Angular UI patterns for loading states, error handling, and data display. Use when building UI components, handling async data, or managing component states."
risk: safe
source: self
date_added: "2026-02-27"
---

# Angular UI Patterns

## Core Principles

1. **Never show stale UI** - Loading states only when actually loading
2. **Always surface errors** - Users must know when something fails
3. **Optimistic updates** - Make the UI feel instant
4. **Progressive disclosure** - Use `@defer` to show content as available
5. **Graceful degradation** - Partial data is better than no data

---

## Loading State Patterns

### The Golden Rule

**Show loading indicator ONLY when there's no data to display.**

```typescript
@Component({
  template: `
    @if (error()) {
      <p-message severity="error" [text]="error()!" />
    } @else if (loading() && !items().length) {
      <p-skeleton />
    } @else if (!items().length) {
      <p>Brak danych</p>
    } @else {
      <app-item-list [items]="items()" />
    }
  `,
})
export class ItemListComponent {
  items = this.store.items;
  loading = this.store.loading;
  error = this.store.error;
}
```

---

## Control Flow Patterns

```html
@if (user(); as user) {
  <span>Witaj, {{ user.name }}</span>
} @else if (loading()) {
  <p-progress-spinner />
} @else {
  <a routerLink="/login">Zaloguj się</a>
}

@for (item of items(); track item.id) {
  <app-item-card [item]="item" (delete)="remove(item.id)" />
} @empty {
  <p>Brak elementów</p>
}
```

---

## Error Handling

**CRITICAL: Never swallow errors silently.**

```typescript
async create(data: CreateDto) {
  try {
    await this.store.create(data);
    // show success feedback
  } catch (error) {
    console.error('create failed:', error);
    // show error feedback to user
  }
}
```

---

## Button State Patterns

**CRITICAL: Always disable triggers during async operations.**

```typescript
@Component({
  template: `
    <p-button
      [label]="saving() ? 'Zapisywanie...' : 'Zapisz'"
      [loading]="saving()"
      [disabled]="saving()"
      (onClick)="save()"
    />
  `
})
export class SaveButtonComponent {
  saving = signal(false);

  async save() {
    this.saving.set(true);
    try {
      await this.service.save();
    } finally {
      this.saving.set(false);
    }
  }
}
```

---

## UI State Checklist

Before completing any UI component:

### UI States
- [ ] Error state handled and shown to user
- [ ] Loading state shown only when no data exists
- [ ] Empty state provided for collections (`@empty` block)
- [ ] Buttons disabled during async operations
- [ ] Buttons show loading indicator when appropriate

### Data & Mutations
- [ ] All async operations have error handling
- [ ] All user actions have feedback (toast/visual)
- [ ] Optimistic updates rollback on failure
