# Pokédex Application

A full-stack Pokédex application built with **Next.js** and **React**, featuring authentication and persistent user-specific data. The app integrates with the public PokéAPI for Pokémon data while storing user-related information such as favorites and caught Pokémon in a PostgreSQL database.

---

## Overview

This project combines server-rendered React with backend functionality using Next.js API routes. It allows users to browse Pokémon data from PokéAPI and create personalized collections tied to authenticated accounts.

Rather than storing all Pokémon data locally, the application fetches real-time data from PokéAPI and only persists user-specific metadata in PostgreSQL, ensuring scalability and efficiency.

---

## Features

- Browse and search Pokémon using PokéAPI
- View detailed Pokémon information (stats, types, abilities, sprites)
- User authentication with Auth.js
- Persistent user-specific data (favorites, caught Pokémon)
- Protected routes for authenticated features
- Server-side and client-side rendering via Next.js
- Scalable relational database schema using Prisma ORM

---

## Tech Stack

### Frontend & Full-Stack Framework
- Next.js (App Router or Pages Router)
- React

### Backend (Built into Next.js)
- Next.js API Routes

### Database
- PostgreSQL
- Prisma ORM

### Authentication
- Auth.js (built for Next.js)

### External API
- PokéAPI (https://pokeapi.co)

---

## Architecture

### Next.js API Routes

The application uses Next.js built-in API routes to handle backend logic, eliminating the need for a separate Express server. These routes manage:

- Authentication flows
- Database operations
- Protected endpoints for user-specific data

---

### Database Design (Prisma + PostgreSQL)

Prisma ORM is used to define a relational schema for storing:

- Users
- Favorite Pokémon
- Caught Pokémon records

Only user-specific metadata is stored in PostgreSQL. Core Pokémon data (stats, types, abilities) is fetched dynamically from PokéAPI to avoid unnecessary duplication and reduce storage overhead.

---

### Authentication (Auth.js)

Authentication is handled using Auth.js, providing:

- Secure session management
- OAuth and/or credential-based login
- Protected routes for authenticated users
- Seamless integration with Next.js server components and API routes

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/NeelakshG/pokedex.git
cd pokedex-app
