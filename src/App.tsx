import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';

export default function App() {
  return (
    <ToastProvider>
      <AppDataProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AppDataProvider>
    </ToastProvider>
  );
}
