# AnonQuest - Anonymous Survey Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-🚀-green)](YOUR_LIVE_WEBSITE_LINK_HERE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white)](https://playwright.dev/)

## Overview

AnonQuest is a modern, secure platform for creating and managing anonymous surveys. Built with privacy and user experience in mind, it allows researchers to create surveys, invite participants, and collect responses while maintaining participant anonymity.

### Key Features

- 🔒 **Secure & Anonymous**: Participants can respond to surveys without revealing their identity
- 🎯 **Targeted Distribution**: Send surveys to specific email addresses
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technical Stack

### Frontend

- **Next.js 14**: client-side run for maximum privacy
- **TypeScript**: For type safety and better developer experience
- **Chakra UI**: For a beautiful, **accessible**, and responsive user interface
- **React Icons**: For a consistent and modern icon set

### Backend

- **Firebase**:
  - Firestore for real-time database
  - Authentication for secure user management
  - Security Rules for data and anonymity protection

### Testing

- **Playwright**: For end-to-end testing with a robust page object model
- **TypeScript**: For type-safe test development
- **ESLint**: For identifying problematic patterns found in code

## Development Practices

### Code Quality

- **Type Safety**: Comprehensive TypeScript usage throughout the application
- **Component Architecture**: Modular, reusable components
- **Clean Code**: Following SOLID principles and best practices
- **Consistent Styling**: Using Chakra UI for a cohesive design system

### Security

- **Firebase Security Rules**: Granular access control
- **Anonymous Authentication**: Secure participant access
- **Data Protection**: No personal data stored with responses

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Firebase:
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Add your Firebase configuration
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Run tests:
   ```bash
   npm test
   ```

## Future Enhancements

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Survey templates
- [ ] Export functionality
