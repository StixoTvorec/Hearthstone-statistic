
;const globalMethods = {};

    const activeBattle = {'id': 0};
(() => {
    'use strict';

    if(typeof Vue === 'undefined') {
        return;
    }

    const battles = [];
    const gamers = [];

    const classes = {
        'druid': {},
        'hunter': {},
        'mage': {},
        'paladin': {},
        'priest': {},
        'rogue': {},
        'shaman': {},
        'warlock': {},
        'warrior': {},
    };

    const currentBattle = [
        {
            user_id: 0,
            classes: [
                'druid',
                'hunter',
                'mage',
                'paladin',
            ],
            couner: 2
        },
        {
            user_id: 1,
            classes: [
                'druid',
                'hunter',
                'mage',
                'paladin',
            ],
            couner: 0
        }
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
            for (i of Object.getOwnPropertyNames(battles)) {
                if (battles.hasOwnProperty(i)) {
                    battles.pop();
                }
            }
            for (i in data['battles']) {
                if (data['battles'].hasOwnProperty(i)) {
                    battles.push(data['battles'][i]);
                }
            }
        }
    });

    RPC.addRoute('updateGamers', (data) => {
        console.log('updateGamers route');
        console.log(data);
        let i;
        if(typeof data['gamers'] !== 'undefined') {
            for (i of Object.getOwnPropertyNames(gamers)) {
                if (gamers.hasOwnProperty(i)) {
                    gamers.pop();
                }
            }
            for(i in data['gamers']) {
                if(data['gamers'].hasOwnProperty(i)) {
                    gamers.push(data['gamers'][i]);
                }
            }
        }
        if(typeof data['gamer'] !== 'undefined') {
            if(gamers.hasOwnProperty(data['gamer']['index'])) {
                gamers[data['gamer']['index']] = data['gamer']['gamer']
            }
        }
    });

    RPC.addRoute('updateActiveBattle', (data) => {
        console.log('updateActiveBattle route');
        console.log(data);
        if(typeof data['activeBattle'] !== 'undefined') {
            activeBattle['id'] = data['activeBattle'];
        }
    });

    // current battle statistic
    if(document.getElementById('statistic')) {
        vueConfig['main'] = {
            el: '#statistic',
            data: {
                gamers: getGamers(),
                battles: getBattles(),
                activeBattle: activeBattle,
            },
            methods: {
                getActiveBattle: function () {
                    return battles[this.activeBattle] || {};
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
                gamers: getGamers(),
                battles: getBattles()
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
                gamers: getGamers(),
                battles: getBattles(),
                currentBattle: currentBattle,
                classes: classes,
                activeBattle: activeBattle,
            },
            methods: {
                updateGamers: function () {
                    RPC.call('setGamers', {gamers: this.gamers});
                },
                forceUpdate: function () {
                    forceUpdate();
                },
                getActiveBattle: function () {
                    return battles[this.activeBattle] || {};
                },
                setActiveBattle: function () {
                    RPC.call('setActiveBattle', {activeBattle: this.activeBattle['id']});
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

    function getGamers() {
        return gamers;
    }

    function getBattles() {
        return battles;
    }


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
