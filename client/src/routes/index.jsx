import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ErrorBoundary from '../components/ErrorBoundary';
import ProtectedRoute from '../components/ProtectedRoute';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import EmailVerificationRequired from '../components/EmailVerificationRequired';
import LoadingFallback from './LoadingFallback';

// Import the email verification and password reset pages
const EmailVerificationPage = lazy(() => import('../pages/EmailVerificationPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));

// Lazy load components for code splitting
const HomePage = lazy(() => import('../pages/HomePage'));
const CampgroundsPage = lazy(() => import('../pages/CampgroundsPage'));
const CampgroundDetailPage = lazy(() => import('../pages/CampgroundDetailPage'));
const CampgroundNewPage = lazy(() => import('../pages/CampgroundNewPage'));
const CampgroundEditPage = lazy(() => import('../pages/CampgroundEditPage'));
const CampsiteNewPage = lazy(() => import('../pages/CampsiteNewPage'));
const CampsiteEditPage = lazy(() => import('../pages/CampsiteEditPage'));
const CampsiteDetailPage = lazy(() => import('../pages/CampsiteDetailPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Booking pages
const BookingsPage = lazy(() => import('../pages/BookingsPage'));
const BookingDetailPage = lazy(() => import('../pages/BookingDetailPage'));
const BookingFormPage = lazy(() => import('../pages/BookingFormPage'));
const BookingCheckoutPage = lazy(() => import('../pages/BookingCheckoutPage'));
const BookingPaymentSuccessPage = lazy(() => import('../pages/BookingPaymentSuccessPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));

// Admin components
const AdminLayout = lazy(() => import('../components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));
const UserList = lazy(() => import('../components/admin/UserList'));
const UserDetail = lazy(() => import('../components/admin/UserDetail'));
const CampgroundList = lazy(() => import('../components/admin/CampgroundList'));
const AdminCampsiteList = lazy(() => import('../components/admin/AdminCampsiteList'));
const AdminBookingList = lazy(() => import('../components/admin/AdminBookingList'));
const AdminBookingDetail = lazy(() => import('../components/admin/AdminBookingDetail'));


/**
 * Routes configuration
 * Defines all routes for the application
 */
const routes = [
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      // Public routes
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'login',
        element: <LoginForm />,
      },
      {
        path: 'register',
        element: <RegisterForm />,
      },
      {
        path: 'verify-email',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <EmailVerificationPage />
          </Suspense>
        ),
      },
      {
        path: 'verify-email-required',
        element: <EmailVerificationRequired />,
      },
      {
        path: 'forgot-password',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordPage />
          </Suspense>
        ),
      },
      {
        path: 'campgrounds',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <CampgroundsPage />
              </Suspense>
            ),
          },
          {
            path: ':id',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <CampgroundDetailPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'campsites/:id',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <CampsiteDetailPage />
          </Suspense>
        ),
      },

      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'campgrounds',
            children: [
              {
                path: 'new',
                element: (
                  <Suspense fallback={<LoadingFallback />}>
                    <CampgroundNewPage />
                  </Suspense>
                ),
              },
              {
                path: ':id/edit',
                element: (
                  <Suspense fallback={<LoadingFallback />}>
                    <CampgroundEditPage />
                  </Suspense>
                ),
              },
              {
                path: ':id/campsites/new',
                element: (
                  <Suspense fallback={<LoadingFallback />}>
                    <CampsiteNewPage />
                  </Suspense>
                ),
              },
            ],
          },
          {
            path: 'profile',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <ProfilePage />
              </Suspense>
            ),
          },
          {
            path: 'bookings',
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<LoadingFallback />}>
                    <BookingsPage />
                  </Suspense>
                ),
              },
              {
                path: ':id',
                element: (
                  <Suspense fallback={<LoadingFallback />}>
                    <BookingDetailPage />
                  </Suspense>
                ),
              },
            ],
          },
          {
            path: 'bookings/:id/book',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <BookingFormPage />
              </Suspense>
            ),
          },
          {
            path: 'bookings/checkout',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <BookingCheckoutPage />
              </Suspense>
            ),
          },
          {
            path: 'bookings/payment-success',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <BookingPaymentSuccessPage />
              </Suspense>
            ),
          },
          {
            path: 'campsites/:id/edit',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <CampsiteEditPage />
              </Suspense>
            ),
          },
        ],
      },

      // Admin routes
      {
        element: <ProtectedRoute requireAdmin={true} />,
        children: [
          {
            path: 'admin',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <AdminLayout />
              </Suspense>
            ),
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminDashboard />
                  </Suspense>
                ),
              },
              {
                path: 'users',
                children: [
                  {
                    index: true,
                    element: (
                      <Suspense fallback={<LoadingFallback />}>
                        <UserList />
                      </Suspense>
                    ),
                  },
                  {
                    path: ':id',
                    element: (
                      <Suspense fallback={<LoadingFallback />}>
                        <UserDetail />
                      </Suspense>
                    ),
                  },
                ],
              },
              {
                path: 'campgrounds',
                element: (
                  <Suspense fallback={<LoadingFallback />}>
                    <CampgroundList />
                  </Suspense>
                ),
              },
              {
                path: 'campsites',
                element: (
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminCampsiteList />
                  </Suspense>
                ),
              },
              {
                path: 'bookings',
                children: [
                  {
                    index: true,
                    element: (
                      <Suspense fallback={<LoadingFallback />}>
                        <AdminBookingList />
                      </Suspense>
                    ),
                  },
                  {
                    path: ':id',
                    element: (
                      <Suspense fallback={<LoadingFallback />}>
                        <AdminBookingDetail />
                      </Suspense>
                    ),
                  },
                ],
              },
            ],
          },
        ],
      },

      // 404 route
      {
        path: '*',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
];

export default routes;
