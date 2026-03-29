# Car Wash User Mobile App

A production-ready mobile application for the Car Wash service, built with React Native (Expo) and TypeScript.

## Features
- **User Authentication**: Login and Registration with JWT.
- **Form Validation**: Using `react-hook-form` and `yup`.
- **API Integration**: Centralized Axios client with automatic token injection and 401 refresh logic.
- **Navigation**: Structured using React Navigation (Bottom Tabs + Stacks).
- **Theming**: Premium design using React Native Paper.

## Prerequisites
- Node.js (v18+)
- Expo Go app on your physical device (iOS/Android)
- Running Car Wash Backend

## Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd car-wash-user-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and set your backend API URL.
**Note**: If testing on a physical device, use your machine's **Local IP** (e.g., `192.168.x.x`) instead of `localhost`.

```env
EXPO_PUBLIC_API_URL=http://your-local-ip:3000
```

### 4. Run the app
```bash
npx expo start --lan
```
Scan the QR code with your Expo Go app.

## Project Structure
- `src/api`: Axios client and interceptors.
- `src/navigation`: App routing and navigation stacks.
- `src/screens`: UI screens (Auth, Home, Profile, etc.).
- `src/store`: AuthContext for global state management.
- `src/theme`: Styling and MD3 theme definitions.
- `src/utils`: Helper functions (Storage, etc.).
