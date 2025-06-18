# Technical Context: ToDoApp Backend

## Technology Stack

### Core Framework

- **NestJS**: Modern Node.js framework
- **TypeScript**: Type-safe development
- **Express**: Underlying HTTP server

### Database & ORM

- **Database**: PostgreSQL ✅ (implemented with Docker Compose)
- **ORM**: TypeORM ✅ (configured and ready)
- **Migrations**: Database schema versioning (auto-sync enabled for development)

### Authentication

- **JWT**: JSON Web Tokens for stateless auth
- **Passport**: Authentication middleware
- **bcrypt**: Password hashing

### Validation & Serialization

- **class-validator**: DTO validation
- **class-transformer**: Data transformation
- **joi** (alternative): Schema validation

### Testing

- **Jest**: Test framework
- **Supertest**: HTTP testing
- **Test Containers**: Database testing

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **nodemon**: Development server

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (if chosen)
- Docker (for containerization)

### Environment Configuration

```env
NODE_ENV=development|production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### Scripts Structure

```json
{
  "start": "node dist/main",
  "start:dev": "nest start --watch",
  "build": "nest build",
  "test": "jest",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

## Technical Constraints

- **Performance**: API responses < 200ms
- **Security**: OWASP compliance
- **Scalability**: Support for horizontal scaling
- **Maintainability**: Clean code principles
- **Testability**: > 80% code coverage

## Dependencies (Installed ✅)

### Core

- ✅ `@nestjs/core`
- ✅ `@nestjs/common`
- ✅ `@nestjs/platform-express`
- ✅ `typescript`
- ✅ `@nestjs/config`

### Database

- ✅ `@nestjs/typeorm`
- ✅ `typeorm`
- ✅ `pg` (PostgreSQL driver)

### Authentication

- ✅ `@nestjs/jwt`
- ✅ `@nestjs/passport`
- ✅ `passport-jwt`
- ✅ `bcrypt`
- ✅ `@types/bcrypt`
- ✅ `@types/passport-jwt`

### Validation

- ✅ `class-validator`
- ✅ `class-transformer`

### Documentation

- ✅ `@nestjs/swagger`

### Testing

- ✅ `jest`
- ✅ `supertest`
- ✅ `@nestjs/testing`

## Deployment Considerations

- **Containerization**: Docker support
- **Environment Variables**: Secure configuration
- **Database Migrations**: Automated schema updates
- **Health Checks**: Application monitoring
- **Logging**: Structured logging with levels
