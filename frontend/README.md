# Sensor Data Dashboard Frontend

A modern, responsive React-based dashboard for real-time sensor data visualization, analytics, and predictive insights using TypeScript, Vite, and Tailwind CSS.

## Features

- **Real-Time Dashboard**: Display current sensor metrics (temperature, humidity, gas levels)
- **Interactive Charts**: Visualize sensor data trends and historical patterns
- **Predictive Analytics**: View ML-based predictions and trend analysis
- **Threshold Settings**: Configure custom alert thresholds
- **Responsive Design**: Mobile-friendly UI with Radix UI components
- **Type-Safe**: Built with TypeScript for enhanced code reliability

## Tech Stack

- **React 18**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Router**: Type-safe routing
- **TanStack React Query**: Server state management
- **React Hook Form**: Form handling
- **Radix UI**: Accessible UI components
- **Chart.js**: Data visualization

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher (or yarn/pnpm)
- Backend API running on `http://localhost:5000` (see [Python Backend README](../python/README.md))

## Installation

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

Or using yarn:

```bash
yarn install
```

Or using pnpm:

```bash
pnpm install
```

## Configuration

### API Base URL

The frontend connects to the backend API at `http://localhost:5000` by default.

To change this, update the API calls in the following files:

- [src/lib/sensor-api.ts](src/lib/sensor-api.ts)
- [src/lib/predict-api.ts](src/lib/predict-api.ts)

If deploying to production, update the API endpoints:

```typescript
const API_BASE_URL = "https://your-api-domain.com";
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The dashboard will be available at `http://localhost:8080`

### Build for Production

```bash
npm run build
```

Production-optimized files will be generated in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── dashboard/          # Dashboard-specific components
│   │   │   ├── ActualVsPredictedChart.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── SensorChart.tsx
│   │   │   └── ThresholdSettings.tsx
│   │   └── ui/                 # Reusable UI components (Radix UI based)
│   ├── hooks/
│   │   └── use-mobile.tsx      # Mobile detection hook
│   ├── lib/
│   │   ├── sensor-api.ts       # Sensor data API calls
│   │   ├── predict-api.ts      # Prediction API calls
│   │   ├── thresholds.ts       # Threshold management
│   │   ├── error-capture.ts    # Error handling
│   │   └── utils.ts            # Utility functions
│   ├── routes/
│   │   ├── __root.tsx          # Root layout
│   │   ├── index.tsx           # Home/Dashboard route
│   │   └── history.tsx         # Historical data route
│   ├── router.tsx              # Router configuration
│   ├── start.tsx               # Application entry point
│   └── styles.css              # Global styles
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── components.json             # UI components registry
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## Available Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start development server with hot reload |
| `npm run build`     | Build for production                     |
| `npm run build:dev` | Build in development mode                |
| `npm run preview`   | Preview production build locally         |
| `npm run lint`      | Run ESLint to check code quality         |
| `npm run format`    | Format code with Prettier                |

## Components

### Dashboard Components

- **MetricCard**: Displays individual sensor metrics
- **SensorChart**: Visualizes real-time sensor data
- **ActualVsPredictedChart**: Compares actual vs predicted values
- **ThresholdSettings**: Configure alert thresholds

### UI Components

Built with Radix UI and Tailwind CSS, including:

- Buttons, Cards, Dialogs
- Forms, Inputs, Selects
- Tables, Tabs, Alerts
- Charts, Badges, Skeletons
- And many more...

## API Integration

### Sensor Data API

Fetches the latest sensor readings:

```typescript
GET / data;
```

### Predictions API

Retrieves ML predictions:

```typescript
GET / predict;
```

### Health Check

Verify backend is running:

```typescript
GET / health;
```

## Environment Variables

Create a `.env.local` file in the `frontend` directory (optional):

```env
VITE_API_BASE_URL=http://localhost:5000
```

Then reference in your code:

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
```

## Troubleshooting

### Port 5173 Already in Use

Change the Vite dev server port:

```bash
npm run dev -- --port 3000
```

### Backend Not Connecting

- Verify backend is running on `http://localhost:5000`
- Check CORS is enabled on backend
- Verify API endpoints in `src/lib/sensor-api.ts`
- Check browser console for errors

### Styling Issues

Rebuild Tailwind CSS:

```bash
npm run dev
```

Tailwind should regenerate on file changes automatically.

### TypeScript Errors

Ensure all dependencies are installed:

```bash
npm install
```

## Performance Optimization

- **Code Splitting**: Automatic with Vite
- **Lazy Loading**: Routes are code-split by default
- **Image Optimization**: Use Vite's built-in image handling
- **CSS Purging**: Tailwind removes unused styles in production

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Best Practices

1. **Use TypeScript**: Leverage type safety throughout the app
2. **Component Organization**: Keep components focused and reusable
3. **API Calls**: Centralize in `src/lib/` directory
4. **Error Handling**: Use error boundaries and try-catch blocks
5. **Responsive Design**: Test on mobile devices
6. **Performance**: Use React DevTools Profiler

## Deployment

### Cloudflare Pages (Recommended)

```bash
# Build project
npm run build

# Deploy to Cloudflare Pages
npm install -g wrangler
wrangler pages deploy dist
```

### Vercel

```bash
npm install -g vercel
vercel
```

### Traditional Hosting

Upload the `dist` directory to any static hosting service (GitHub Pages, AWS S3, Netlify, etc.).

## License

This project is part of a dissertation project.

## Support

For issues or questions, please refer to the main project documentation or contact the maintainers.
