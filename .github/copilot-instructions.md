# Organic Gardening Planner - Copilot Instructions

This document provides guidance for AI coding agents to effectively contribute to the Organic Gardening Planner mobile app.

## Architecture Overview

This is a React Native application built with Expo. It uses Firebase for backend services, including Authentication, Firestore, and Cloud Storage.

- **Frontend**: React Native with Expo.
- **Backend**: Firebase (Authentication, Firestore, Cloud Storage).
- **Data Models**: Defined in `src/types/database.types.ts`. These are crucial for understanding the shape of data stored in Firestore.
- **Firebase Interaction**: All Firebase-related code is centralized in `src/lib/firebase.ts`. This includes initialization and configuration.
- **Data Services**: Business logic for interacting with Firestore collections (plants, tasks, journal) is encapsulated in services found in `src/services/`. For example, `src/services/plants.ts` contains all functions for creating, reading, updating, and deleting plant data.
- **UI**: The UI is composed of screens located in `src/screens/` and reusable components in `src/components/`.

## Developer Workflow

- **Running the app**: To start the development server, run `npx expo start`. This will open the Expo Go development environment.
- **Dependencies**: The project uses npm for package management. Install dependencies with `npm install`.
- **Firebase Setup**: The project requires a Firebase project. The setup guide is in `FIREBASE_SETUP.md`. This includes setting up Firestore, Authentication, and Storage, and providing the necessary environment variables.

## Project Conventions

- **State Management**: Component state is managed using React hooks (`useState`, `useEffect`). For global state, the app may rely on React Context or a similar solution.
- **Styling**: The app uses a custom theme defined in `src/theme/`. Colors are in `src/theme/colors.ts`.
- **Error Handling**: The app has a custom error boundary at `src/components/ErrorBoundary.tsx`. Error logging utilities can be found in `src/utils/errorLogging.ts`.
- **Data Fetching**: Data fetching from Firestore is handled by the services in `src/services/`. These services use the Firebase SDK to interact with the database.

## Key Files and Directories

- `src/lib/firebase.ts`: Firebase configuration and initialization.
- `src/services/`: Contains the core business logic for data manipulation.
- `src/types/database.types.ts`: Defines the data structures used throughout the app.
- `src/screens/`: Top-level UI components for each screen.
- `src/components/`: Reusable UI components.
- `FIREBASE_SETUP.md`: Guide for setting up the Firebase backend.
- `ARCHITECTURE.md`: High-level overview of the application architecture.
