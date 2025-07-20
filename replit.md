# Logistics Management System

## Overview

This is a web application for managing logistics operations based on sequential events. The system handles product registration, tracking, and reporting through a multi-step workflow from product entry/exit through delivery and report generation.

## User Preferences

Preferred communication style: Simple, everyday language.
Storage preference: In-memory storage is sufficient for current needs.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom logistics theme colors
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Storage Strategy**: In-memory storage for beta version with interface for future database integration
- **Session Management**: Connect-pg-simple for session storage

### Project Structure
- `/client` - Frontend React application
- `/server` - Backend Express server
- `/shared` - Shared types and schemas between frontend and backend
- `/migrations` - Database migration files

## Key Components

### Database Schema (shared/schema.ts)
- **Products Table**: Stores product information including dimensions, weight, regulations, and flow type
- **Transports Table**: Driver and vehicle information
- **Deliveries Table**: Delivery details and completion status
- **Processes Table**: Main workflow orchestration linking all other entities

### Sequential Event Flow
1. **Event 1**: Product Registration - Add products with specifications and flow type (entrada/salida)
2. **Event 2**: Transport Information - Driver and vehicle details (pausable)
3. **Event 3**: Product Delivery - Delivery location and completion (salida flow only)
4. **Event 4**: Reports and Closure - Generate reports and complete process (salida flow only)

### Frontend Pages
- **Dashboard**: Overview with stats and active processes
- **Event1**: Product registration form
- **Event2**: Transport information form
- **Event3**: Delivery tracking and completion
- **Event4**: Report generation and process closure

### Storage Layer
- **Interface-based Design**: IStorage interface allows switching between memory and database storage
- **Current Implementation**: MemStorage class for in-memory operations
- **Future Ready**: Designed to easily swap to PostgreSQL implementation

## Data Flow

1. **Product Registration**: User selects flow type and enters product details
2. **Process Creation**: System creates a process linking the product
3. **Transport Assignment**: Driver and vehicle information added to process
4. **Delivery Tracking**: For salida flow, delivery details and completion
5. **Report Generation**: Final reports generated and process marked complete

### Flow Types
- **Entrada**: Simple flow (Events 1-2 only)
- **Salida**: Complete flow (Events 1-4)

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **drizzle-orm**: TypeScript ORM for PostgreSQL
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router
- **react-hook-form**: Form handling with validation
- **zod**: Runtime type validation
- **@radix-ui/***: Accessible UI components
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling

## Deployment Strategy

### Development
- **Dev Server**: Vite dev server for frontend with Express backend
- **Hot Reload**: Vite HMR with Express middleware integration
- **Type Checking**: TypeScript compiler with strict mode

### Production Build
- **Frontend**: Vite builds to `dist/public`
- **Backend**: esbuild bundles server to `dist/index.js`
- **Static Serving**: Express serves built frontend in production

### Environment Configuration
- **Development**: NODE_ENV=development with tsx for TypeScript execution
- **Production**: NODE_ENV=production with compiled JavaScript
- **Database**: DATABASE_URL environment variable for PostgreSQL connection

### Key Features
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Accessibility**: Radix UI ensures WCAG compliance
- **Type Safety**: Full TypeScript coverage from database to UI
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Error Handling**: Comprehensive error boundaries and user feedback