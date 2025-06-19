import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { MockUsersService } from './services/users.service.mock';

const usersServiceProvider = {
  provide: 'UsersService',
  useClass:
    process.env.SKIP_DB_CONNECTION === 'true' ? MockUsersService : UsersService,
};

@Module({
  imports:
    process.env.SKIP_DB_CONNECTION !== 'true'
      ? [TypeOrmModule.forFeature([User])]
      : [],
  providers: [
    usersServiceProvider,
    ...(process.env.SKIP_DB_CONNECTION !== 'true'
      ? [UsersService]
      : [MockUsersService]),
  ],
  exports: ['UsersService'],
})
export class UsersModule {}
