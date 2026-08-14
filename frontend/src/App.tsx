import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Header from './components/layout/Header/Header';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ui/ProtectedRoute/ProtectedRoute';
import { ConfirmProvider } from './context/ConfirmContext';
import { AdminLayout } from './components/shared/Admin/AdminLayout';
import { ModeratorLayout } from './components/shared/Admin/ModeratorLayout';
// import { ArtsModerate } from './components/shared/Admin/arts/ArtsModerate';
// import { ArtistsModerate } from './components/shared/Admin/artists/ArtistsModerate';
// import { ModeratorsAdmin } from './components/shared/Admin/moderators/ModeratorsAdmin';
// import { UsersAdmin } from './components/shared/Admin/users/UsersAdmin';
// import { ArtistsAdmin } from './components/shared/Admin/artists/ArtistsAdmin';
import { ArtsAdmin } from './components/shared/Admin/arts/ArtsAdmin';
import { LanguageProvider } from './context/LanguageContext';
import Footer from './components/layout/Footer/Footer';
import HelpPage from './pages/help/HelpPage';
import SettingsPage from './pages/settings/SettingsPage';
import {SettingsProvider} from './context/SettingsContext';

const LazyForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const LazyLoginPage = lazy(() => import('./pages/auth/LoginPage'))
// const LazyRegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

const LazyHomePage = lazy(() => import('./pages/home/HomePage'))
const LazyProfilePage = lazy(() => import('./pages/profile/ProfilePage'));

const LazyArtPage = lazy(() => import("./pages/arts/ArtPage"));
const LazyArtsPage = lazy(() => import('./pages/arts/ArtsPage'));
// const LazyMyArtsPage = lazy(() => import('./pages/arts/MyArtsPage'));
// const LazyArtCreatePage = lazy(() => import('./pages/arts/ArtCreatePage/ArtCreatePage'));
const LazyArtEditPage = lazy(() => import('./pages/arts/ArtEditPage'));


const LazyAuthorPage = lazy(() => import("./pages/author/AuthorPage/AuthorPage"));
const LazyAuthorsPage = lazy(() => import('./pages/author/AuthorsPage/AuthorsPage'));

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
                      {/* <Route path="register" element={<LazyRegisterPage />} /> */}
                      <Route path="forgot-password" element={<LazyForgotPasswordPage />} />

                      <Route path="arts" element={<LazyArtsPage />} />
                      <Route path="arts/:id" element={<LazyArtPage />} />

                      <Route path='artists' element={<LazyAuthorsPage />} />
                      <Route path='artists/:id' element={<LazyAuthorPage />} />

                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/help" element={<HelpPage />} />

                      <Route element={<ProtectedRoute allowedRoles={['admin', 'author']} />}>
                        {/* <Route path="/arts/my" element={<LazyMyArtsPage />} /> */}
                        {/* <Route path="/arts/my/new" element={<LazyArtCreatePage />} /> */}
                        <Route path="/arts/my/edit/:id" element={<LazyArtEditPage />} />
                      </Route>

                      <Route element={<ProtectedRoute allowedRoles={['admin', 'moderator', 'author', 'user']} />}>
                        <Route path="profile" element={<LazyProfilePage />} />

                        {/* <Route path="arts/liked" element={<LazyArtsPage />} /> */}
                        {/* <Route path='authors/liked' element={<LazyAuthorsPage />} /> */}
                      </Route>


                      <Route element={<ProtectedRoute allowedRoles={['admin', 'moderator']} redirectTo="/" />}>
                        <Route path="moderation" element={<ModeratorLayout />}>
                          {/* <Route path="arts" element={<ArtsModerate />} />
                          <Route path="artists" element={<ArtistsModerate />} /> */}
                        </Route>
                      </Route>

                      <Route element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/" />}>
                        <Route path="admin" element={<AdminLayout />}>
                          {/* <Route path="moderation/arts" element={<ArtsModerate />} />
                          <Route path="moderation/artists" element={<ArtistsModerate />} /> */}
                          {/* <Route path="arts" element={<ArtsAdmin />} /> */}
                          {/* <Route path="artists" element={<ArtistsAdmin />} /> */}
                          {/* <Route path="users" element={<UsersAdmin />} /> */}
                          {/* <Route path="moderators" element={<ModeratorsAdmin />} /> */}
                          {/* <Route path="styles" element={<StylesModerate />} />
                        <Route path="art-types" element={<ArtTypesModerate />} /> */}
                        </Route>
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
