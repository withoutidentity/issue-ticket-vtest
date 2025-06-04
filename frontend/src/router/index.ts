import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ✅ เพิ่ม type ให้ meta รองรับ role guard
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
    guestOnly?: boolean // ✅ เพิ่ม guestOnly สำหรับ meta
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { requiresAuth: true, roles: ['USER', 'ADMIN', 'OFFICER'] },
  },
  {
    path: '/',
    // เดิม: redirect: '/login',
    // เดิม: meta: { guestOnly: true }
    redirect: () => {
      const auth = useAuthStore();
      if (auth.accessToken) {
        return { name: 'Home' }; // ถ้ามี token (ล็อกอินอยู่) ให้ไปหน้า Home
      }
      return { name: 'Login' }; // ถ้าไม่มี token ให้ไปหน้า Login
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { guestOnly: true } // ✅ ผู้ใช้ที่ล็อกอินแล้วไม่ควรเห็นหน้านี้
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/RegisterPage.vue'),
    meta: { guestOnly: true } // หน้านี้สำหรับผู้ที่ยังไม่ได้ล็อกอินเท่านั้น
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/pages/ForbiddenPage.vue'),
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'OFFICER'] },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true, roles: ['USER','ADMIN', 'OFFICER'] },
  },
  {
    path: '/departments',
    name: 'Department',
    component: () => import('@/pages/DepartmentPage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'OFFICER'] },
  },
  {
    path: '/types',
    name: 'Type',
    component: () => import('@/pages/TypesPage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'OFFICER'] },
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/pages/UsersPage.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'OFFICER'] },
  },
  {
    path: '/tickets/:id',
    name: 'TicketDetail',
    component: () => import('@/pages/TicketDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/MyTickets', // หรือ path ที่คุณต้องการเช่น /officer/my-tickets
    name: 'OfficerMyTickets',
    component: () => import('@/pages/MyTicketsPage.vue'),
    meta: { requiresAuth: true, roles: ['OFFICER','USER'] } // ป้องกันการเข้าถึงสำหรับ Role อื่น
  },
  { path: '/forgot-password', component: import('@/pages/ForgotPasswordPage.vue') }, // เพิ่ม route
  { path: '/reset-password', component: import('@/pages/ResetPasswordPage.vue') },
  {
      path: '/change-password', // New route path
      name: 'ChangePassword',
      component: () => import('@/pages/ChangePasswordPage.vue'), // Use the new component
      meta: { requiresAuth: true } // Requires authentication
    },
  
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ✅ Auth & Role-based Global Guard
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  const isAuthenticated = !!auth.accessToken; // ตรวจสอบสถานะการล็อกอิน

  const requiresAuth = to.meta.requiresAuth ?? false;
  const allowedRoles = to.meta.roles;
  const guestOnly = to.meta.guestOnly ?? false;

  if (guestOnly && isAuthenticated) {
    // ถ้าเป็นหน้าที่สำหรับ guest เท่านั้น แต่ผู้ใช้ล็อกอินอยู่แล้ว
    // ให้ redirect ไปหน้า Home (หรือหน้าที่เหมาะสม)
    return next({ name: 'Home' });
  }

  if (requiresAuth && !isAuthenticated) {
    // ถ้าหน้าที่กำลังจะไปต้องมีการยืนยันตัวตน แต่ผู้ใช้ยังไม่ได้ล็อกอิน
    // ให้ redirect ไปหน้า Login
    return next({ name: 'Login' });
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    // ถ้ามีการกำหนด roles สำหรับหน้านี้
    if (!isAuthenticated || !auth.user || !allowedRoles.includes(auth.user.role)) {
      // ถ้าผู้ใช้ไม่ได้ล็อกอิน หรือไม่มี role หรือ role ไม่ตรงกับที่กำหนด
      return next({ name: 'Forbidden' }); // ไปหน้า 403 Forbidden
    }
  }

  next(); // อนุญาตให้ไปต่อ
});

export default router
