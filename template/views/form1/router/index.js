export default [
    {
        path: '/inquiry-order',
        name: 'inquiry-order',
        component: () => import('../list.vue'),
        meta: {
            title: '交货计划',
            identity: 'VUE_INQUIRY'
        }
    }, {
        path: '/inquiry-order-form',
        name: 'inquiry-order-form',
        component: () => import('../form/index.vue'),
        meta: {
            title: '交货计划',
            identity: 'VUE_INQUIRY'
        }
    }
];
