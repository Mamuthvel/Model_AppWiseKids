# AppWiseKids - Parental Control Dashboard

## Overview

AppWiseKids is a full-stack React application built with TypeScript that provides parents with comprehensive monitoring and control tools for their children's device usage. The application features real-time app monitoring, screen time tracking, safety assessments, and intelligent alert systems to help parents make informed decisions about their children's digital experiences.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server code:

**Frontend**: React SPA built with Vite, utilizing TypeScript and Tailwind CSS for styling
**Backend**: Express.js REST API server with TypeScript
**Database**: PostgreSQL with Drizzle ORM for data persistence
**State Management**: TanStack Query for server state management
**UI Components**: Radix UI primitives with shadcn/ui components
**Deployment**: Configured for Replit with autoscale deployment

## Key Components

### Frontend Architecture
- **React Router**: Using Wouter for client-side routing
- **Component Library**: Built on Radix UI primitives with shadcn/ui styling
- **State Management**: TanStack Query for server state, React hooks for local state
- **Authentication**: Session-based auth with protected routes
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Backend Architecture
- **REST API**: Express.js server with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: BCrypt for password hashing
- **Request Logging**: Custom middleware for API request tracking

### Database Schema
- **Users**: Parent and child account management with role-based access
- **Children**: Child profile management with device information
- **Apps**: Application catalog with safety ratings and expert reviews
- **Child Apps**: Junction table tracking app installations and usage per child
- **Alerts**: Real-time notification system for various event types
- **Settings**: Configurable parental controls per child
- **Screen Time**: Daily usage tracking and analytics

## Data Flow

1. **Authentication Flow**: Users log in through React forms, server validates credentials and creates sessions
2. **Dashboard Data**: TanStack Query fetches child data, app usage, and alerts from REST endpoints
3. **Real-time Updates**: Mutations trigger cache invalidation for immediate UI updates
4. **Alert System**: Server generates alerts based on app installations, screen time limits, and safety thresholds
5. **Settings Management**: Parents configure controls through forms that update database via API calls

## External Dependencies

### Core Framework Dependencies
- React 18 with TypeScript for UI development
- Express.js for server-side API development
- Drizzle ORM with @neondatabase/serverless for database operations
- TanStack Query for efficient data fetching and caching

### UI and Styling
- Tailwind CSS for utility-first styling
- Radix UI for accessible component primitives
- Lucide React for consistent iconography
- shadcn/ui for pre-built component patterns

### Development Tools
- Vite for fast development and building
- tsx for TypeScript execution in development
- esbuild for production server bundling

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

**Development Environment**:
- Node.js 20 runtime with PostgreSQL 16
- Hot reloading with Vite dev server
- TypeScript compilation and checking

**Production Build**:
- Client: Vite build process generating static assets
- Server: esbuild bundling with ESM output format
- Database: PostgreSQL with Drizzle migrations

**Deployment Configuration**:
- Auto-scaling deployment target
- Environment variable configuration for database connection
- Port 5000 for development, port 80 for production
- Build and start scripts configured in package.json

**Database Management**:
- Drizzle Kit for schema management and migrations
- Connection via DATABASE_URL environment variable
- PostgreSQL dialect with connection pooling support

## Changelog

Changelog:
- June 23, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.