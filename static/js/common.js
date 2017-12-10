
;const globalMethods = {};

(() => {
    'use strict';

    if(typeof Vue === 'undefined') {
        return;
    }

    const appStorage = {
        battles: [],
        gamers: [],
        activeBattle: 0
    };

    const classes = [
        'druid',
        'hunter',
        'mage',
        'paladin',
        'priest',
        'rogue',
        'shaman',
        'warlock',
        'warrior',
    ];

    const vueConfig = {};

    const url = 'ws://' + window.location.host + '/ws/';
    const RPC = WSRPC(url, 2000);

    RPC.addRoute('whoAreYou', (data) => {
        return window.navigator.userAgent;
    });

    RPC.addRoute('time', (data) => {
        RPC.call('time', (new Date()).getTime());
    });

    RPC.addRoute('updateBattles', (data) => {
        console.log('updateBattles route');
        console.log(data);
        let i;
        if(typeof data['battles'] !== 'undefined') {
            appStorage.battles = [];
            for (i in data['battles']) {
                if (data['battles'].hasOwnProperty(i)) {
                    appStorage.battles.push(data['battles'][i]);
                }
            }
        }
    });

    RPC.addRoute('updateGamers', (data) => {
        console.log('updateGamers route');
        console.log(data);
        let i;
        if(typeof data['gamers'] !== 'undefined') {
            appStorage.gamers = [];
            for(i in data['gamers']) {
                if(data['gamers'].hasOwnProperty(i)) {
                    appStorage.gamers.push(data['gamers'][i]);
                }
            }
        }
    });

    RPC.addRoute('updateActiveBattle', (data) => {
        console.log('updateActiveBattle route');
        console.log(data);
        if(typeof data['activeBattle'] !== 'undefined') {
            appStorage.activeBattle = data['activeBattle'];
        }
    });

    // current battle statistic
    if(document.getElementById('statistic')) {
        vueConfig['main'] = {
            el: '#statistic',
            data: {
                storage: appStorage,
            },
            methods: {
                getActiveBattle: function () {
                    return appStorage.battles[this.storage.activeBattle] || {};
                }
            },
        };
        forceUpdate();
    }

    // all gamers list
    if(document.getElementById('gamers')) {
        vueConfig['main'] = {
            el: '#gamers',
            data: {
                storage: appStorage
            },
            methods: {}
        };
        forceUpdate();
    }

    // index file, main config
    if(document.getElementById('config')) {
        vueConfig['main'] = {
            el: '#config',
            data: {
                storage: appStorage,
                classes: classes,
            },
            methods: {
                updateGamers: function () {
                    RPC.call('setGamers', {gamers: this.storage.gamers});
                },
                forceUpdate: function () {
                    forceUpdate();
                },
                getActiveBattle: function () {
                    return appStorage.battles[this.activeBattle] || {};
                },
                setActiveBattle: function () {
                    RPC.call('setActiveBattle', {activeBattle: this.storage.activeBattle});
                }
            },
            mounted() {
                this.$nextTick(() => {
                    let selector = window.location.hash ? 'a[href="' + window.location.hash + '"]' : '.tabs>ul>li>a';
                    const elem = document.querySelector(selector);
                    if (elem) {
                        elem.click();
                    }
                });
            }
        };
    }

    function forceUpdate() {
        RPC.call('updateMe', {});
    }

    RPC.addEventListener('onconnect', (e) => {
    });

    RPC.connect();


    function post(url, method, data) {
        data = data || {};
        method = method || 'POST';
        return fetch(url, {
            credentials: 'include',
            method: method,
            body: JSON.stringify(data)
        });
    }

    //
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

    //
    globalMethods['getVueConfig'] = function(key) {
        if(typeof key !== 'undefined' && typeof vueConfig[key] !== 'undefined') {
            return vueConfig[key];
        }
        return {};
    };

    globalMethods['getCurrentBattle'] = function () {
        return currentBattle;
    };

})();
