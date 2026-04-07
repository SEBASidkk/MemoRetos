/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: {
      id: number;
      name: string;
      lastname: string;
      username: string;
      email: string;
      rol: string;
      total_score: number;
    };
    token: string;
  }
}
