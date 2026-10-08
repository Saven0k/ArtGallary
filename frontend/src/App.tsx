import { GalleryProvider } from './context/GalleryProvider';
import ContactsPage from './pages/ContactsPage';
import NotFoundPage from './pages/NotFoundPage';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Header from './components/layout/Header/Header';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ui/ProtectedRoute/ProtectedRoute';
import { ConfirmProvider } from './context/ConfirmContext';
import { LanguageProvider } from './context/LanguageContext';
import Footer from './components/layout/Footer/Footer';
import HelpPage from './pages/help/HelpPage';
import SettingsPage from './pages/settings/SettingsPage';
import { SettingsProvider } from './context/SettingsContext';
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
import AboutPage from './pages/about/AboutPage';
import ArtConsultationPage from './pages/art-consultation/ArtConsultationPage';
import ServicesPage from './pages/services/ServicesPage';
import EventsPage from './pages/events/EventsPage/EventsPage';
import EventPage from "./pages/events/EventPage/EventPage"


const LazyLoginPage = lazy(() => import('./pages/auth/LoginPage'))

const LazyHomePage = lazy(() => import('./pages/home/HomePage'))
const LazyProfilePage = lazy(() => import('./pages/profile/ProfilePage'));

const LazyArtsPage = lazy(() => import('./pages/arts/ArtsPage'));
const LazyResetPasswordPage = lazy(() => import('./pages/auth/ResetPassword/ResetPasswordPage'));
const LazyArtPage = lazy(() => import("./pages/arts/ArtPage"));
const LazyArtEditPage = lazy(() => import('./pages/arts/ArtEditPage'));


const LazyAuthorPage = lazy(() => import("./pages/author/AuthorPage/AuthorPage"));
const LazyAuthorsPage = lazy(() => import('./pages/author/AuthorsPage/AuthorsPage'));

const LazyRegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

function App() {
  return (
    <>
      <LanguageProvider>
          <ConfirmProvider>
            <NotificationProvider>
              <BrowserRouter>
                <AuthProvider>
                  <SettingsProvider>
                  <GalleryProvider>
                  <Suspense fallback={<>Загрузка</>}>
                    <Header />
                    <Routes>
                      <Route path="login" element={<LazyLoginPage />} />
                      <Route path="register" element={<  LazyRegisterPage />} />
                      <Route path="forgot-password" element={<Navigate to="/reset-password" replace />} />

                      <Route path="arts" element={<LazyArtsPage />} />
                      <Route path="reset-password" element={<LazyResetPasswordPage />} />
                      <Route path="contacts" element={<ContactsPage />} />
                      <Route path="cart" element={<Navigate to="/profile?section=cart" replace />} />
                      <Route path="arts/:id" element={<LazyArtPage />} />


                      <Route path='authors' element={<LazyAuthorsPage />} />
                      <Route path='authors/:id' element={<LazyAuthorPage />} />
                      
                      <Route path='events' element={<EventsPage />} />
                      <Route path='events/:id' element={<EventPage />} />

                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/help" element={<HelpPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/consultation" element={<ArtConsultationPage />} />
                      <Route path="/services" element={<ServicesPage />} />

                      <Route element={<ProtectedRoute allowedRoles={['admin', 'author']} />}>
                        { }
                        { }
                        <Route path="/arts/my/create" element={<LazyArtEditPage />} />
                        <Route path="/arts/my/edit/:id" element={<LazyArtEditPage />} />
                      </Route>

                      <Route element={<ProtectedRoute allowedRoles={['admin', 'moderator', 'author', 'user']} />}>
                        <Route path="profile" element={<LazyProfilePage />} />
                      </Route>


                      <Route element={<ProtectedRoute allowedRoles={['admin', 'moderator']} redirectTo="/" />}>

                      </Route>

                      <Route element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/" />}>
                        <Route path="/admin" element={<AdminPage />} />
                      </Route>

                      <Route path="/" element={<LazyHomePage />} />
                      <Route path='*' element={<NotFoundPage />} />
                    </Routes>
                    <Footer />
                  </Suspense>
                  </GalleryProvider>
                  </SettingsProvider>
                </AuthProvider>
              </BrowserRouter>
            </NotificationProvider>
          </ConfirmProvider>
      </LanguageProvider>
    </>
  )
}

export default App
