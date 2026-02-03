# Abstraction Design Reference

## What is Abstraction?

Abstraction is the process of hiding complexity behind a simpler interface. It's about:
- **Generalizing**: Finding patterns that apply to multiple cases
- **Separating concerns**: Dividing responsibilities clearly
- **Creating boundaries**: Defining what is exposed vs. hidden

## Levels of Abstraction

### 1. Data Abstraction

Hide data representation behind operations.

**Bad**:
```typescript
// Exposing internal structure
user.firstName + " " + user.lastName
```

**Better**:
```typescript
// Abstracting the operation
user.getFullName()
```

### 2. Procedural Abstraction

Group operations into meaningful procedures.

**Bad**:
```typescript
// Scattered operations
const conn = createConnection();
conn.authenticate();
const result = conn.query(sql);
conn.close();
```

**Better**:
```typescript
// Abstracted operation
const result = withConnection(conn => conn.query(sql));
```

### 3. Object/Module Abstraction

Bundle related data and behavior.

**Bad**:
```typescript
// Scattered functions
validateUserInput(data);
saveUserToDatabase(data);
sendWelcomeEmail(data);
```

**Better**:
```typescript
// Cohesive module
userService.create(data);
```

### 4. Architectural Abstraction

Define clear layers and boundaries.

```
┌─────────────────┐
│   Presentation  │ ← UI, API endpoints
├─────────────────┤
│    Business     │ ← Domain logic
├─────────────────┤
│     Data        │ ← Persistence
├─────────────────┤
│   External      │ ← APIs, services
└─────────────────┘
```

## Abstraction Design Process

### Step 1: Identify the Core Concept

What is the essence of what you're building?

**Example**: Building a caching system
- Core concept: Store and retrieve values with expiration
- Not core: Redis vs. Memcached, serialization format, network protocol

### Step 2: Define the Interface

What operations should be possible?

```typescript
interface Cache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V, ttl?: number): void;
  delete(key: K): boolean;
  clear(): void;
}
```

### Step 3: Consider Invariants

What must always be true?

- A key maps to at most one value
- Expired keys behave as if deleted
- `get` after `set` returns the set value (if not expired)

### Step 4: Handle Edge Cases

- What if key doesn't exist? → Return undefined
- What if TTL is 0? → Don't cache
- What if value is null? → Cache it (or not—decide!)

### Step 5: Implement

Now write the concrete code.

## Abstraction Principles

### Single Responsibility

A module should have one reason to change.

**Bad**:
```typescript
class UserManager {
  createUser() { }
  validateUser() { }
  sendEmail() { }
  generateReport() { }
}
```

**Better**:
```typescript
class UserService { create() { } }
class UserValidator { validate() { } }
class EmailService { send() { } }
class ReportGenerator { generate() { } }
```

### Open/Closed

Open for extension, closed for modification.

```typescript
// Closed for modification
interface PaymentProcessor {
  process(amount: number): Promise<void>;
}

// Open for extension
class StripeProcessor implements PaymentProcessor { }
class PayPalProcessor implements PaymentProcessor { }
```

### Dependency Inversion

Depend on abstractions, not concretions.

**Bad**:
```typescript
class OrderService {
  private db = new PostgresDatabase(); // Concrete dependency
}
```

**Better**:
```typescript
class OrderService {
  constructor(private db: Database) { } // Abstract dependency
}
```

## Abstraction Smells

### Leaky Abstraction

Implementation details escape.

**Smell**: Users need to know internal details to use the abstraction.

```typescript
// Leaky: Users must know about connection pooling
await db.connectionPool.acquire();
await db.query(sql);
await db.connectionPool.release();
```

### Premature Abstraction

Abstracting before understanding the pattern.

**Smell**: The abstraction is used in only one place.

### Wrong Abstraction

The abstraction doesn't match the problem.

**Smell**: Constantly fighting the abstraction to get work done.

### Over-Abstraction

Too many layers of indirection.

**Smell**: Simple operations require navigating 5+ files.

## When to Abstract

### Abstract When:
- You have 3+ similar implementations
- The pattern is clear and stable
- Testing is difficult without abstraction
- Multiple teams need the same capability

### Don't Abstract When:
- You have only 1-2 use cases
- The requirements are still unclear
- The abstraction would be more complex than duplication
- You're abstracting "just in case"

## The Rule of Three

> "Write it once, write it twice, refactor on the third time."

First time: Just write the code
Second time: Copy and modify
Third time: Now you see the pattern—abstract it

## Abstraction and Testing

Good abstractions make testing easier:

```typescript
// Easy to test: Inject test double
class Service {
  constructor(private cache: Cache) { }
}

// Hard to test: Concrete dependency
class Service {
  private cache = new RedisCache(); // Can't easily mock
}
```

## Remember

> "Abstraction is about creating a new semantic level. It's not about hiding complexity—it's about creating a simpler model."

> "The best abstractions are those that match the way you think about the problem, not the way the computer executes it."

> "Duplication is far cheaper than the wrong abstraction."
