# System Patterns: ToDoApp Backend

## Architecture Overview

**Pattern**: Modular Monolith with NestJS

- Clean separation of concerns
- Module-based organization
- Dependency injection
- Decorator-driven development

## Core Modules Structure

```
src/
├── core/           # Global configurations, filters, guards
├── shared/         # Shared utilities and services
├── auth/           # Authentication & authorization
├── users/          # User management
├── tasks/          # Task CRUD operations
├── categories/     # Task organization
└── app.module.ts   # Root module
```

## Key Design Patterns

### Module Pattern

- Each feature in its own module
- Clear module boundaries
- Shared module for common utilities
- Core module for global configurations

### Repository Pattern

- Data access abstraction
- Easy testing and mocking
- Database-agnostic business logic
- Clean separation of concerns

### DTO Pattern

- Input/output validation
- Type safety
- API contract definition
- Transformation consistency

### Guard Pattern

- Authentication checks
- Authorization rules
- Route protection
- Consistent security

## Component Relationships

```
Controllers → Services → Repositories → Database
     ↓           ↓            ↓
   DTOs      Business     Data Models
           Logic Layer
```

## Data Flow

1. **Request**: Controller receives HTTP request
2. **Validation**: DTO validates input data
3. **Authorization**: Guards check permissions
4. **Business Logic**: Service processes request
5. **Data Access**: Repository interacts with database
6. **Response**: Formatted response returned

## Error Handling Strategy

- Global exception filters
- Consistent error responses
- Proper HTTP status codes
- Detailed error logging
- User-friendly error messages

## Testing Strategy

- Unit tests for services and utilities
- Integration tests for controllers
- End-to-end tests for critical flows
- Mocking external dependencies
