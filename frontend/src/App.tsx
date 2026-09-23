import { BrowserRouter, Route, Routes } from 'react-router-dom';
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
import AdminPage from './pages/admin/AdminPage';
import AboutPage from './pages/about/AboutPage';
import ConsultationPage from './pages/consultation/ConsultationPage';
import ServicesPage from './pages/services/ServicesPage';

const LazyForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const LazyLoginPage = lazy(() => import('./pages/auth/LoginPage'))

const LazyHomePage = lazy(() => import('./pages/home/HomePage'))
const LazyProfilePage = lazy(() => import('./pages/profile/ProfilePage'));

const LazyArtPage = lazy(() => import("./pages/arts/ArtPage"));
const LazyArtEditPage = lazy(() => import('./pages/arts/ArtEditPage'));


const LazyAuthorPage = lazy(() => import("./pages/author/AuthorPage/AuthorPage"));
const LazyAuthorsPage = lazy(() => import('./pages/author/AuthorsPage/AuthorsPage'));

const LazyRegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

function App() {
  return (
    <>
      <LanguageProvider>
        <SettingsProvider>
          <ConfirmProvider>
            <NotificationProvider>
              <BrowserRouter>
                <AuthProvider>
                  <Suspense fallback={<>Загрузка</>}>
                    <Header />
                    <Routes>
                      <Route path="login" element={<LazyLoginPage />} />
                      <Route path="register" element={<  LazyRegisterPage />} />
                      <Route path="forgot-password" element={<LazyForgotPasswordPage />} />

                      {/* <Route path="arts" element={<LazyArtsPage />} /> */}
                      <Route path="arts/:id" element={<LazyArtPage />} />

                      <Route path='authors' element={<LazyAuthorsPage />} />
                      <Route path='authors/:id' element={<LazyAuthorPage />} />

                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/help" element={<HelpPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/consultation" element={<ConsultationPage />} />
                      <Route path="/services" element={<ServicesPage />} />

                      <Route element={<ProtectedRoute allowedRoles={['admin', 'author']} />}>
                        {/* <Route path="/arts/my" element={<LazyMyArtsPage />} /> */}
                        {/* <Route path="/arts/my/new" element={<LazyArtCreatePage />} /> */}
                        <Route path="/arts/my/edit/:id" element={<LazyArtEditPage />} />
                      </Route>

                      <Route element={<ProtectedRoute allowedRoles={['admin', 'moderator', 'author', 'user']} />}>
                        <Route path="profile" element={<LazyProfilePage />} />
                      </Route>


                      <Route element={<ProtectedRoute allowedRoles={['admin', 'moderator']} redirectTo="/" />}>

                      </Route>

                      <Route element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/" />}>
                        <Route path="/admin/*" element={<AdminPage />} />
                      </Route>

                      <Route path="/" element={<LazyHomePage />} />
                      <Route path='*' element={<LazyHomePage />} />
                    </Routes>
                    <Footer />
                  </Suspense>
                </AuthProvider>
              </BrowserRouter>
            </NotificationProvider>
          </ConfirmProvider>
        </SettingsProvider>
      </LanguageProvider>
    </>
  )
}

export default App
