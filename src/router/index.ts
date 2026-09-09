import { createRouter, createWebHistory } from 'vue-router';

export default createRouter({
  history:createWebHistory(),
  routes:[
    {path:'/',component:()=>import('@/pages/HomePage.vue')},
    {path:'/map',component:()=>import('@/pages/MapPage.vue')},
    {path:'/event/:id',component:()=>import('@/pages/EventPage.vue')},
    {path:'/create',component:()=>import('@/pages/CreateEventPage.vue')},
    {path:'/inbox',component:()=>import('@/pages/InboxPage.vue')},
    {path:'/request/:id',component:()=>import('@/pages/RequestPage.vue')},
    {path:'/chat/:eventId',component:()=>import('@/pages/ChatPage.vue'),meta:{nav:false}},
    {path:'/profile',component:()=>import('@/pages/ProfilePage.vue')},
    {path:'/favorites',component:()=>import('@/pages/FavoritesPage.vue')},
    {path:'/notifications',component:()=>import('@/pages/NotificationsPage.vue')},
    {path:'/my-events',component:()=>import('@/pages/MyEventsPage.vue')},
    {path:'/manage/:id',component:()=>import('@/pages/ManageEventPage.vue')}
  ],
  scrollBehavior(){return {top:0,behavior:'smooth'};}
});
