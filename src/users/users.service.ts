import { Injectable } from '@nestjs/common';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: 1,
      email: 'john@example.com',
      name: 'John Doe',
      role: 'customer',
    },
    {
      id: 2,
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    },
  ];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  create(user: Omit<User, 'id'>): User {
    const newUser: User = {
      id: this.users.length + 1,
      ...user,
    };
    this.users.push(newUser);
    return newUser;
  }
}

