import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { ThemeProvider } from '../lib/theme-context';
import { AuthProvider } from '../lib/auth-context';
import { router } from './routes';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster 
          position="top-right" 
          richColors 
          expand={false}
          closeButton
        />
      </AuthProvider>
    </ThemeProvider>
  );
}