import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Header from './components/layout/Header/Header';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ui/ProtectedRoute/ProtectedRoute';
import { ConfirmProvider } from './context/ConfirmContext';
import { AdminLayout } from './components/shared/Admin/AdminLayout';
import { CitiesAdmin } from './components/shared/Admin/cities/CitiesAdmin';
import { CountriesAdmin } from './components/shared/Admin/countries/CountriesAdmin';
import { GenresAdmin } from './components/shared/Admin/genres/GenresAdmin';
import { TypesAdmin } from './components/shared/Admin/styles/StylesAdmin';
import { ModeratorLayout } from './components/shared/Admin/ModeratorLayout';
import { ArtsModerate } from './components/shared/Admin/arts/ArtsModerate';
import { ExhibitionsModerate } from './components/shared/Admin/exhibitions/ExhibitionsModerate';
import { ArtistsModerate } from './components/shared/Admin/artists/ArtistsModerate';
import { ModeratorsAdmin } from './components/shared/Admin/moderators/ModeratorsAdmin';
import { UsersAdmin } from './components/shared/Admin/users/UsersAdmin';
import { ArtistsAdmin } from './components/shared/Admin/artists/ArtistsAdmin';
import { ExhibitionsAdmin } from './components/shared/Admin/exhibitions/ExhibitionsAdmin';
import { ArtsAdmin } from './components/shared/Admin/arts/ArtsAdmin';
import { LikedArts } from './components/shared/Profile/LikedArts/LikedArts';
import { LikedExhibitions } from './components/shared/Profile/LikedExhibitions/LikedExhibitions';
import { RegisteredExhibitions } from './components/shared/Profile/RegistredExhibitions/RegisteredExhibitions';
import { Settings } from './components/shared/Profile/Settings/Settings';
import { Support } from './pages/Support/Support';
import { LanguageProvider } from './context/LanguageContext';
import Footer from './components/layout/Footer/Footer';

const LazyForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const LazyLoginPage = lazy(() => import('./pages/auth/LoginPage'))
const LazyRegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// TODO: сделать нормальную страничку привествия
// const LazyHomePage = lazy(() => import('./pages/HomePage'))
const LazyProfilePage = lazy(() => import('./pages/ProfilePage'));

const LazyExhibitionPage = lazy(() => import("./pages/exhibitions/ExhibitionPage"));
const LazyExhibitionsPage = lazy(() => import("./pages/exhibitions/ExhibitionsPage"));
const LazyMyExhibitionsPage = lazy(() => import("./pages/exhibitions/MyExhibitionsPage"));
const LazyExhibitionCreatePage = lazy(() => import("./pages/exhibitions/ExhibitionCreatePage/ExhibitionCreatePage"));
const LazyExhibitionEditPage = lazy(() => import("./pages/exhibitions/ExhibitionEditPage"));


const LazyArtPage = lazy(() => import("./pages/arts/ArtPage"));
const LazyArtsPage = lazy(() => import('./pages/arts/ArtsPage'));
const LazyMyArtsPage = lazy(() => import('./pages/arts/MyArtsPage'));
const LazyArtCreatePage = lazy(() => import('./pages/arts/ArtCreatePage/ArtCreatePage'));
const LazyArtEditPage = lazy(() => import('./pages/arts/ArtEditPage'));


const LazyArtistPage = lazy(() => import("./pages/artists/ArtistPage"));
const LazyArtistsPage = lazy(() => import('./pages/artists/ArtistsPage'));

function App() {
  return (
    <>
      <LanguageProvider>

        <ConfirmProvider>
          <NotificationProvider>
            <BrowserRouter>
              <AuthProvider>
                <Suspense fallback={<>Загрузка</>}>
                  <Header />
                  <Routes>
                    <Route path="login" element={<LazyLoginPage />} />
                    <Route path="register" element={<LazyRegisterPage />} />
                    <Route path="forgot-password" element={<LazyForgotPasswordPage />} />
                    <Route path="exhibitions" element={<LazyExhibitionsPage />} />
                    <Route path="exhibitions/:id" element={<LazyExhibitionPage />} />

                    <Route path="arts" element={<LazyArtsPage />} />
                    <Route path="arts/:id" element={<LazyArtPage />} />

                    <Route path='artists' element={<LazyArtistsPage />} />
                    <Route path='artists/:id' element={<LazyArtistPage />} />

                    <Route path="/settings" element={<Settings />} />
                    <Route path="/help" element={<Support />} />

                    <Route element={<ProtectedRoute allowedRoles={['admin', 'artist', 'user']} />}>

                      <Route path="/profile/liked-arts" element={<LikedArts />} />
                      <Route path="/profile/liked-exhibitions" element={<LikedExhibitions />} />
                      <Route path="/profile/registered-exhibitions" element={<RegisteredExhibitions />} />


                      <Route path="exhibitions/my" element={<LazyMyExhibitionsPage />} />
                      <Route path="exhibitions/my/new" element={<LazyExhibitionCreatePage />} />
                      <Route path="exhibitions/my/edit/:id" element={<LazyExhibitionEditPage />} />

                      <Route path="/arts/my" element={<LazyMyArtsPage />} />
                      <Route path="/arts/my/new" element={<LazyArtCreatePage />} />
                      <Route path="/arts/my/edit/:id" element={<LazyArtEditPage />} />

                      <Route path="profile" element={<LazyProfilePage />} />
                    </Route>


                    <Route element={<ProtectedRoute allowedRoles={['admin', 'moderator']} redirectTo="/" />}>
                      <Route path="moderation" element={<ModeratorLayout />}>
                        <Route path="arts" element={<ArtsModerate />} />
                        <Route path="exhibitions" element={<ExhibitionsModerate />} />
                        <Route path="artists" element={<ArtistsModerate />} />
                      </Route>
                    </Route>

                    <Route element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/" />}>
                      <Route path="admin" element={<AdminLayout />}>
                        <Route path="cities" element={<CitiesAdmin />} />
                        <Route path="countries" element={<CountriesAdmin />} />
                        <Route path="genres" element={<GenresAdmin />} />
                        <Route path="types" element={<TypesAdmin />} />

                        <Route path="moderation/arts" element={<ArtsModerate />} />
                        <Route path="moderation/exhibitions" element={<ExhibitionsModerate />} />
                        <Route path="moderation/artists" element={<ArtistsModerate />} />
                        <Route path="arts" element={<ArtsAdmin />} />
                        <Route path="exhibitions" element={<ExhibitionsAdmin />} />
                        <Route path="artists" element={<ArtistsAdmin />} />
                        <Route path="users" element={<UsersAdmin />} />
                        <Route path="moderators" element={<ModeratorsAdmin />} />
                      </Route>
                    </Route>

                    <Route path="/" element={<LazyArtsPage />} />

                    <Route path='*' element={<LazyArtsPage />} />
                  </Routes>
                  <Footer />
                </Suspense>
              </AuthProvider>
            </BrowserRouter>
          </NotificationProvider>
        </ConfirmProvider>

      </LanguageProvider>
    </>
  )
}

export default App
