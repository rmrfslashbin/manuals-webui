import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./pages/HomePage.vue')
  },
  {
    path: '/callback',
    name: 'callback',
    component: () => import('./pages/CallbackPage.vue')
  },
  {
    path: '/devices',
    name: 'devices',
    component: () => import('./pages/DevicesPage.vue')
  },
  {
    path: '/devices/:id',
    name: 'device-detail',
    component: () => import('./pages/DeviceDetailPage.vue')
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('./pages/SearchPage.vue')
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import('./pages/DocumentsPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
