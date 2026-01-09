import { Injectable } from '@nestjs/common';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

@Injectable()
export class ProductsService {
  private products: Product[] = [
    {
      id: 1,
      name: 'Laptop',
      description: 'High-performance laptop for work and gaming',
      price: 999.99,
      stock: 10,
      category: 'Electronics',
    },
    {
      id: 2,
      name: 'Smartphone',
      description: 'Latest model smartphone with advanced features',
      price: 699.99,
      stock: 25,
      category: 'Electronics',
    },
    {
      id: 3,
      name: 'Headphones',
      description: 'Wireless noise-cancelling headphones',
      price: 199.99,
      stock: 50,
      category: 'Audio',
    },
  ];

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product | undefined {
    return this.products.find((product) => product.id === id);
  }

  create(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      id: this.products.length + 1,
      ...product,
    };
    this.products.push(newProduct);
    return newProduct;
  }

  update(id: number, updateData: Partial<Product>): Product | undefined {
    const productIndex = this.products.findIndex((p) => p.id === id);
    if (productIndex === -1) {
      return undefined;
    }
    this.products[productIndex] = {
      ...this.products[productIndex],
      ...updateData,
    };
    return this.products[productIndex];
  }

  remove(id: number): boolean {
    const productIndex = this.products.findIndex((p) => p.id === id);
    if (productIndex === -1) {
      return false;
    }
    this.products.splice(productIndex, 1);
    return true;
  }
}

