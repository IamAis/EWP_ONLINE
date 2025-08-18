#Problemi
Il tasto Inizia a Creare > Crea Nuova Scheda è scollegato
La mail è opzionale ma va messa per forza
I clienti nn sono importabili | In alternativa se si inserisce un Cliente che nn abbiamo gia caricato. Il sistema ignora
Servono delle possibili modifiche di stile del'export
C'è la filigrana
la modalità giorno è troppo chiara

# Fitness Coach Workout Manager

A comprehensive full-stack application for fitness coaches to create, manage, and share workout plans with their clients.

## Project Overview

This is a React-based fitness management application with an Express.js backend. The app allows fitness coaches to:
- Create and manage client profiles
- Design detailed workout routines with exercises, sets, reps, and rest periods
- Organize workouts by days and weeks
- Generate PDF workout plans
- Track client progress

## Technical Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state
- **UI Components**: Radix UI with Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Theme**: Dark/light mode support with next-themes

### Backend (Express + TypeScript)
- **Framework**: Express.js with TypeScript
- **Development**: tsx for hot reloading
- **Storage**: In-memory storage (configurable for database)
- **API**: RESTful endpoints under `/api` prefix

### Key Features
- **Multi-week workout planning**: Organize exercises by days and weeks
- **Exercise management**: Detailed exercise tracking with sets, reps, load, rest periods
- **Client management**: Store and organize client information
- **PDF generation**: Export workout plans as PDFs
- **Responsive design**: Mobile-first design with bottom navigation
- **Theme support**: Light and dark mode

## Project Structure

```
├── client/src/           # Frontend React application
│   ├── components/       # Reusable UI components
│   ├── pages/           # Route components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and configuration
├── server/              # Backend Express application
│   ├── index.ts         # Main server entry point
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Data storage interface
│   └── vite.ts          # Vite development setup
└── shared/              # Shared types and schemas
    └── schema.ts        # Zod schemas and TypeScript types
```

## Data Models

### Core Entities
- **Exercise**: Individual exercise with sets, reps, load, rest
- **Day**: Collection of exercises for a training day
- **Week**: Collection of days with a week number
- **Workout**: Complete workout plan with multiple weeks
- **Client**: Client profile information
- **CoachProfile**: Coach information and branding

### Validation
All data validation uses Zod schemas defined in `shared/schema.ts` with automatic TypeScript type inference.

## Development

### Commands
- `npm run dev`: Start development server (Express + Vite)
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run check`: TypeScript type checking

### Environment
- Development server runs on port 5000
- Frontend and backend served from same port in development
- Hot reloading enabled for both frontend and backend

## Security & Best Practices

- Client/server separation with clear API boundaries
- Input validation using Zod schemas
- Type-safe development with TypeScript
- CORS and security headers configured
- Environment-based configuration

## Recent Changes

**Enhanced User Interface** (August 6, 2025)
- Created comprehensive main menu with navigation cards
- Added workout deletion functionality with confirmation dialogs
- Enhanced PDF export with coach profile branding
- Implemented image upload for exercises
- All menu buttons properly linked to respective pages
- Added floating action button for quick workout creation

**Migration from Replit Agent** (August 7, 2025) 
- Successfully migrated project to Replit environment
- Fixed server configuration for Replit compatibility (host: 0.0.0.0)
- Resolved dependency issues and reinstalled all packages
- Verified all dependencies are properly installed
- Confirmed server starts correctly on port 5000
- All core functionality working as expected

**Enhanced Workout Management** (August 6, 2025)
- Added nome scheda (workout name) field for better identification
- Implemented client selection from existing clients database
- Enhanced workout cards to display workout names prominently  
- Improved light mode visibility with better contrast and colors
- Updated glass-effect styling for better readability in day mode

**Advanced PDF Customization System** (August 7, 2025)
- Fixed optional email fields validation (truly optional now)
- Added customizable line color selector for PDF exports
- **NEW**: Added customizable text color for PDF section titles
- Implemented removable "Generato con FitTracker Pro" watermark
- Enhanced settings page with comprehensive PDF personalization section
- Updated coach profile schema with pdfLineColor, pdfTextColor and showWatermark fields
- PDF section titles now use customizable colors: "DESCRIZIONE", "PROGRESSIONE SETTIMANALE", "CONSIGLI DIETISTICI", "SCHEDA DI ALLENAMENTO"
- Day names in weekly progression also use the custom text color
- Removed large watermark, kept only small footer text controllable via settings
- Changed watermark text from "FitTracker Pro" to "EasyWorkout Planner"

**UI Improvements** (August 7, 2025)
- Increased navbar height for better usability (added py-3 class)
- Better visual hierarchy in mobile navigation

**Final PDF Text Color Implementation** (August 7, 2025)
- Completed implementation of customizable PDF text colors for all section titles
- Added "Colore Titoli PDF" field in settings with color picker and text input
- Updated PDF generator to use pdfTextColor from coach profile for all titles
- Enhanced day names in weekly progression to use custom text color
- Full customization now available: line colors, text colors, and watermark toggle

**Desktop Responsive Layout** (August 7, 2025)
- Added desktop navigation menu in top header (hidden on mobile)
- Enhanced all page headers with improved typography and spacing
- Implemented responsive layout adaptations for larger screen sizes
- Added desktop-specific button sizing and improved visual hierarchy
- Updated grid layouts to better utilize desktop screen space
- Enhanced glass effects and backdrop blur for desktop viewing
- Improved navbar height for better mobile usability
- All pages now fully responsive for desktop browser windows

**UI Improvements & Schema Updates** (August 7, 2025)
- Removed "EasyWorkout" and "Schede Allenamento" titles from NavBar as requested
- Removed mandatory Coach field from workout forms (now taken from Settings)
- Added optional Level field with options: Neofita, Principiante, Intermedio, Avanzato
- Updated workout schema to accommodate new level field and optional coach field
- Enhanced form layout to accommodate 3-column grid (Type, Level, Duration)
- Fixed SelectItem bug with empty value prop
- Removed circular + button from workout builder header
- Changed all references from "FitTracker Pro" to "EasyWorkout Planner"
- Removed floating action button (circular + button) from home page
- Hidden statistics cards on mobile (Schede Attive, Clienti Totali, PDF Esportati)
- Removed glass effects from navbar on mobile for solid background
- Hidden "Progressione Settimanale" title on mobile in workout builder

**Enhanced PDF Customization & Weekly Management** (August 18, 2025)
- Added customizable week names (default "SETTIMANA 1", etc.)
- Logo now positioned above the title in PDF headers
- Added flag to use workout name as title instead of "SCHEDA DI ALLENAMENTO"
- Coach biography now displays under coach name in PDF exports
- Updated weekSchema to include optional name field for custom week naming
- Enhanced ExerciseForm component with editable week names
- Added useWorkoutNameAsTitle setting in coach profile
- Improved PDF header layout with centered logo positioning
- Week names in workout builder now fully customizable by users

**Mobile Optimization & UI Improvements** (August 18, 2025)
- Added auto-refresh functionality after profile save for immediate visual feedback
- Implemented mobile-responsive workout detail view with stacked layout
- Created separate mobile card view for exercises (replaces overlapping table)
- Enhanced mobile header with centered layout and full-width buttons
- Removed "Installa l'App" section as requested by user
- Optimized exercise display with grid layout for Serie/Reps/Carico/Recupero on mobile
- Added proper spacing and typography for mobile viewing experience

## User Preferences

- Language: Italian (UI text in Italian)
- Professional fitness coaching application
- Mobile-responsive design priority