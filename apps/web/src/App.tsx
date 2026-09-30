import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { MediaDetailPage } from '@/pages/MediaDetailPage';
import { ListsPage } from '@/pages/ListsPage';
import { ListDetailPage } from '@/pages/ListDetailPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StremioConnectPage } from '@/pages/StremioConnectPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { CallbackPage } from '@/pages/auth/CallbackPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth/*" element={<Layout showHeader={false} />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="callback" element={<CallbackPage />} />
        </Route>

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/media/:type/:id" element={<MediaDetailPage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/lists/new" element={<ListDetailPage />} />
          <Route path="/lists/:id" element={<ListDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/stremio" element={<StremioConnectPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;