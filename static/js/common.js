
;const globalMethods = {};

// TO DELETE!
const battles = [
    {
        gamers: [0, 1],
        active: true,
    },
    {
        gamers: [0, 1],
        active: false,
    },
];
const gamers = [
    {
        name: 'Gamer 1',
        active: false,
        classes: [
            {
                class: 'druid',
                available: true
            },
            {
                class: 'hunter',
                available: false
            },
            {
                class: 'mage',
                available: false
            },
            {
                class: 'paladin',
                available: true
            },
        ]
    },
    {
        name: 'Gamer 2',
        active: true,
        classes: [
            {
                class: 'druid',
                available: true
            },
            {
                class: 'hunter',
                available: false
            },
            {
                class: 'mage',
                available: false
            },
            {
                class: 'paladin',
                available: true
            },
        ]
    },
];


(() => {
    'use strict';

    if(typeof Vue === 'undefined') {
        return;
    }

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

    // current battle statistic
    if(document.getElementById('statistic')) {
        vueConfig['main'] = {
            el: '#statistic',
            data: {
                gamers: getGamers(),
                battles: getBattles()
            },
            methods: {
                getActiveBattle: function () {
                    this.battles.forEach(function (battle) {
                        if (battle.active) {
                            return battle;
                        }
                    });
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
                activeBattle: getActiveBattle,
            },
            methods: {
                updateGamers: function () {
                    RPC.call('updateGamers', {gamers: this.gamers});
                },
                updateBattles: function () {
                    RPC.call('updateBattles', {battles: this.battles});
                },
                forceUpdate: function () {
                    forceUpdate();
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

    function getActiveBattle() {
        let battle;
        battle = battles.forEach(function (e, i) {
            if(e.active) {
                return i;
            }
        });

        if (typeof battle === 'undefined') {
            return 0;
        }

        return battles[battle];
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
