import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ✅ เพิ่ม type ให้ meta รองรับ role guard
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
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
    redirect: '/login' // ให้ redirect ไป /login เมื่อเข้าหน้าแรก
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/RegisterPage.vue'),
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
    meta: { requiresAuth: true, roles: ['USER', 'ADMIN', 'OFFICER'] },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true, roles: ['USER'] },
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
  }
  
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ✅ Auth & Role-based Global Guard
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // console.log("Navigation to:", to.path)
  // console.log("Token:", auth.accessToken)
  // console.log("Role:", auth.user?.role)

  const requiresAuth = to.meta.requiresAuth ?? false
  const allowedRoles = to.meta.roles

  if (requiresAuth && !auth.accessToken) {
    return next('/login')
  }

  if (Array.isArray(allowedRoles) && (!auth.user || !allowedRoles.includes(auth.user.role))) {
    return next('/403')
  }

  next()
})

export default router
