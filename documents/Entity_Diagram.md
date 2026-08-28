# Household Split Entity Diagram

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ HouseholdMember : joins
    Household ||--o{ HouseholdMember : contains

    Household ||--o{ TodoList : owns
    TodoList ||--o{ TodoItem : contains
    User o|--o{ TodoItem : assigned

    Household ||--o{ Expense : records
    User ||--o{ Expense : pays
    Expense ||--o{ ExpenseSplit : divides
    User ||--o{ ExpenseSplit : owes

    Household ||--o{ HouseholdActivity : schedules
    User o|--o{ HouseholdActivity : assigned

    User ||--o{ CalendarEvent : syncs

    Household ||--o{ OutboxEvent : produces
    User o|--o{ OutboxEvent : receives
    OutboxEvent ||--o{ Notification : creates
    Household ||--o{ Notification : contains
    User ||--o{ Notification : receives

    User {
        string id PK
        string email UK
        string name
        string image
        datetime createdAt
        datetime updatedAt
    }

    Account {
        string id PK
        string userId FK
        string provider
        string providerAccountId
    }

    Session {
        string id PK
        string sessionToken UK
        string userId FK
        datetime expires
    }

    VerificationToken {
        string identifier
        string token UK
        datetime expires
    }

    Household {
        string id PK
        string name
        datetime createdAt
        datetime updatedAt
    }

    HouseholdMember {
        string householdId PK_FK
        string userId PK_FK
        datetime joinedAt
    }

    TodoList {
        string id PK
        string householdId FK
        string title
        datetime createdAt
        datetime updatedAt
    }

    TodoItem {
        string id PK
        string listId FK
        string title
        boolean isCompleted
        string assignedToId FK
        datetime createdAt
        datetime updatedAt
    }

    Expense {
        string id PK
        string householdId FK
        string title
        decimal totalAmount
        string paidById FK
        datetime createdAt
        datetime updatedAt
    }

    ExpenseSplit {
        string id PK
        string expenseId FK
        string userId FK
        decimal percentage
        decimal amountOwed
    }

    HouseholdActivity {
        string id PK
        string householdId FK
        string title
        int scheduledDayOfWeek
        boolean isDone
        string assignedToId FK
        datetime createdAt
        datetime updatedAt
    }

    CalendarEvent {
        string id PK
        string externalEventId
        string userId FK
        string title
        string description
        datetime startTime
        datetime endTime
        SyncStatus syncStatus
        datetime lastSyncedAt
        datetime createdAt
        datetime updatedAt
    }

    OutboxEvent {
        string id PK
        string householdId FK
        string eventType
        string recipientId FK
        json payload
        EventStatus status
        int retryCount
        string lastError
        datetime createdAt
        datetime processedAt
    }

    Notification {
        string id PK
        string householdId FK
        string userId FK
        string outboxEventId FK
        string title
        string message
        boolean isRead
        datetime createdAt
    }
```

## Enumerations

- `EventStatus`: `PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`
- `SyncStatus`: `PENDING`, `SYNCED`, `FAILED`

`VerificationToken` is intentionally shown without relationships because the Prisma model has no foreign keys. Optional relationships are marked with `o|` on the user side: todo assignment, activity assignment, and outbox recipient. Foreign keys with `onDelete: Cascade` or `onDelete: SetNull` follow the behavior defined in `prisma/schema.prisma`.
