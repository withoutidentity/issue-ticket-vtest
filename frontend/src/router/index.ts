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
    path: '/',
    name: 'Home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { requiresAuth: true, roles: ['user', 'admin'] },
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
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/pages/AdminDashboard.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/pages/ForbiddenPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ✅ Auth & Role-based Global Guard
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  const requiresAuth = to.meta.requiresAuth ?? false
  const allowedRoles = to.meta.roles

  if (requiresAuth && !auth.token) {
    return next('/login')
  }

  if (Array.isArray(allowedRoles) && !allowedRoles.includes(auth.role)) {
    return next('/403')
  }

  next()
})

export default router
