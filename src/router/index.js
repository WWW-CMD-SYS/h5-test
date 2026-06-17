import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import DataO from '../DataO.vue'
import LogisticsMap from '../views/LogisticsMap.vue'

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: Dashboard
    },
    {
        path: '/DataO',
        name: 'DataO',
        component: DataO
    },
    {
        path: '/logistics-map',
        name: 'LogisticsMap',
        component: LogisticsMap
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
