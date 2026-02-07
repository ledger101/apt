# APT Admin (Next.js 14)

Modernized data management platform for geotechnical reports.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS V4 + Shadcn/UI
- **Language**: TypeScript
- **Database/Auth**: Firebase
- **State**: Zustand

## Key Features
- **Sleek UI**: Premium dark-mode first design with glassmorphism.
- **Ported Logic**: Core `ExcelParser` logic extracted from previous Angular service.
- **Real-time**: Ready for Firestore integration.

## Getting Started
1. `cd apt-next`
2. `npm install`
3. `npm run dev`

## File Structure
- `src/lib/logic/excel-parser.ts`: Main business logic for Excel parsing.
- `src/types/pumping-data.ts`: Shared data models.
- `src/components/uploader.tsx`: Reactive uploader component.
