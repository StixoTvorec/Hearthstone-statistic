
;(() => {
    'use strict';

    // function post(url, data) {
    //     data = data || {};
    //     return fetch(url, {
    //         credentials: 'include',
    //         method: 'POST',
    //         body: JSON.stringify(data)
    //     });
    // }

    const url = 'ws://' + window.location.host + '/ws/';
    const RPC = WSRPC(url, 2000);

    const storage = {};
    storage['lastMsgTime'] = (new Date()).getTime();

    RPC.addRoute('whoAreYou', (data) => {
        return window.navigator.userAgent;
    });

    RPC.addRoute('time', (data) => {
        RPC.call('time', (new Date()).getTime());
    });

    function updateUsers(e) {
        //
    }

    RPC.addRoute('update_users', updateUsers);

    if(document.getElementById('users-list')) {
        const vm = new Vue({
            el: '#users-list',
            data: {},
            methods: {}
        });
    }

    if(document.getElementById('config')) {
        Vue.component('tabs', {
            template: `
<div class="">
    <div class="tabs">
        <ul>
            <li v-for="tab in tabs" :class="{ 'is-active': tab.isActive }">
                <a :href="tab.href" @click="selectTab(tab)">{{ tab.name }}</a>
            </li>
        </ul>
    </div>
    <div class="tab-detailts">
        <slot></slot>
    </div>
</div>
`,
            mounted() {
            },
            data() {
                return { tabs: [] };
            },
            created() {
                this.tabs = this.$children;
            },
            methods: {
                selectTab(selectedTab) {
                    this.tabs.forEach(tab => {
                        tab.isActive = (tab.name === selectedTab.name)
                    });
                },
            }
        });

        Vue.component('tab', {
            template: '<div v-show="isActive"><slot></slot></div>',
            props: {
                name: {
                    required: true,
                },
                selected: {
                    default: false,
                },
            },
            data() {
                return {
                    isActive: false
                };
            },
            computed: {
                href() {
                    return '#' + this.name.toLowerCase().replace(/ /g, '-');
                }
            },
            mounted() {
                this.isActive = this.selected;
            }
        });

        const vm = new Vue({
            el: '#config',
            data: {
                currentHash: window.location.hash,
                gamers: [
                    {name: 'Gamer 1'},
                    {name: 'Gamer 2'},
                    {name: 'Gamer 3'},
                    {name: 'Gamer 4'},
                    {name: 'Gamer 1'},
                    {name: 'Gamer 2'},
                    {name: 'Gamer 3'},
                    {name: 'Gamer 4'},
                ]
            },
            methods: {},
            mounted() {
            }
        });
    }

    RPC.addEventListener('onconnect', function (e) {
    });

    RPC.connect();

})();
