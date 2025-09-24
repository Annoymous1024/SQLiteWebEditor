# Replit Configuration

## Overview

This is a full-stack SQLite database editor web application built with React and Express. The application allows users to upload SQLite database files, browse database schemas, execute SQL queries, and perform CRUD operations through an intuitive web interface. It features a modern UI built with Tailwind CSS and shadcn/ui components, providing a comprehensive database management experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **File Uploads**: React Dropzone for drag-and-drop file upload functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **File Processing**: Multer middleware for handling multipart/form-data uploads
- **Database Operations**: SQL.js library for client-side SQLite database processing
- **API Design**: RESTful API with JSON responses and proper error handling
- **Development**: Hot module replacement with Vite integration

### Data Storage Solutions
- **Database**: PostgreSQL as the primary database using Drizzle ORM
- **File Storage**: Local filesystem storage for uploaded SQLite files in memory and disk
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Schema Management**: Drizzle Kit for database migrations and schema management

### Key Design Patterns
- **Monorepo Structure**: Shared types and schemas between client and server
- **Component Composition**: Reusable UI components following atomic design principles
- **Error Boundary**: Comprehensive error handling with user-friendly error messages
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Type Safety**: End-to-end TypeScript with shared schema validation using Zod

### Database Schema Design
The application uses a simple schema for tracking uploaded SQLite files:
- `sqlite_files` table with metadata including filename, original name, file size, and upload timestamp
- UUID primary keys for secure file identification
- Timestamp tracking for audit purposes

### Client-Side Database Processing
- **SQL.js Integration**: Client-side SQLite database processing without server-side SQL execution
- **Schema Introspection**: Dynamic schema discovery and table structure analysis
- **Query Execution**: Direct SQL query execution with result pagination and formatting
- **Data Export**: CSV export functionality for query results

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon database driver for PostgreSQL connectivity
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect support
- **@tanstack/react-query**: Server state management and caching
- **express**: Web application framework for Node.js

### UI Component Libraries
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **class-variance-authority**: Utility for creating variant-based component APIs
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library with React components

### Development Tools
- **vite**: Frontend build tool with hot module replacement
- **typescript**: Static type checking
- **eslint** and **prettier**: Code linting and formatting
- **@replit/vite-plugin-***: Replit-specific development plugins

### File Processing
- **multer**: Middleware for handling multipart/form-data
- **sql.js**: JavaScript SQL database engine (SQLite compiled to WebAssembly)
- **react-dropzone**: File drag-and-drop functionality

### Additional Utilities
- **date-fns**: Date utility library
- **clsx** and **tailwind-merge**: Conditional CSS class composition
- **wouter**: Minimalist routing for React applications
- **connect-pg-simple**: PostgreSQL session store for Express