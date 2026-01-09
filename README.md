# Ecommerce API

A NestJS-based ecommerce API application.

## Description

This is a RESTful API for an ecommerce application built with NestJS. It includes basic modules for products and users management.

## Installation

```bash
npm install
```

## Running the app

```bash
# development
npm run start:dev

# production mode
npm run start:prod
```

## API Endpoints

### Products

- `GET /products` - Get all products
- `GET /products/:id` - Get a single product by ID
- `POST /products` - Create a new product
- `PUT /products/:id` - Update a product
- `DELETE /products/:id` - Delete a product

### Users

- `GET /users` - Get all users
- `GET /users/:id` - Get a single user by ID
- `POST /users` - Create a new user

## Example Product Object

```json
{
  "id": 1,
  "name": "Laptop",
  "description": "High-performance laptop for work and gaming",
  "price": 999.99,
  "stock": 10,
  "category": "Electronics"
}
```

## Example User Object

```json
{
  "id": 1,
  "email": "john@example.com",
  "name": "John Doe",
  "role": "customer"
}
```

## Project Structure

```
src/
├── products/          # Products module
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.module.ts
├── users/             # Users module
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── app.module.ts      # Root module
└── main.ts            # Application entry point
```

## Technologies

- [NestJS](https://nestjs.com/)
- TypeScript
- class-validator
- class-transformer

## License

Private
