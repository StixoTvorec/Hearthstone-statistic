
;(() => {
    'use strict';

    if(typeof Vue === 'undefined') {
        return;
    }

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

    let vm;

    const url = 'ws://' + window.location.host + '/ws/';
    const RPC = WSRPC(url, 2000);

    function getDefaultVueConfig(el, nextTick) {
        nextTick = nextTick || function () {
            forceUpdate();
        };
        return {
            el: el,
            data: {
                battles: [],
                gamers: [],
                activeBattle: 0,
                activeBattleCounter: [0, 0],
                classes: classes
            },
            methods: {
            },
            mounted() {
                this.$nextTick(nextTick);
            }
        };
    }

    function addRoute(route, dataKey) {
        RPC.addRoute(route, (data) => {
            if(typeof data[dataKey] !== 'undefined') {
                vm[dataKey] = data[dataKey];
            }
        });
    }
    function callRoute(route, data) {
        return RPC.call(route, data)
            .then((data) => {
                successMessage();
            }, (error) => {
                errorMessage(error);
            }).done();
    }

    addRoute('updateBattles', 'battles');
    addRoute('updateGamers', 'gamers');
    addRoute('updateActiveBattle', 'activeBattle');
    addRoute('updateActiveBattleCounter', 'activeBattleCounter');

    // current battle statistic
    if(document.getElementById('statistic')) {
        vm = new Vue(getDefaultVueConfig('#statistic'));
    }

    // all gamers list
    if(document.getElementById('gamers')) {
        vm = new Vue(getDefaultVueConfig('#gamers'));
    }

    // index file, main config
    if(document.getElementById('config')) {
        let vueConfig = getDefaultVueConfig('#config', function () {
            let firstElemSelector = '.tabs>ul>li>a';
            let selector = window.location.hash ? 'a[href="' + window.location.hash + '"]' : firstElemSelector;
            let elem = document.querySelector(selector);
            if (elem) {
                elem.click();
            }
            else {
                document.querySelector(firstElemSelector).click();
            }
            forceUpdate();
        });
        vueConfig['methods'] = {
                updateGamers: function () {
                    callRoute('setGamers', {gamers: this.gamers});
                },
                forceUpdate: forceUpdate,
                setActiveBattle: function () {
                    callRoute('setActiveBattle', {
                            activeBattle: this.activeBattle,
                            battles: this.battles
                        });
                },
                addBattle: function () {
                    this.battles.push({'gamers': [0, 1]});
                },
                deleteBattle: function (index) {
                    if (index < this.activeBattle) {
                        this.activeBattle -= 1;
                    }
                    this.battles = this.battles.slice(0, index)
                        .concat(this.battles.slice(index + 1));
                },
                saveActiveBattleCounter: function () {
                    callRoute('setActiveBattleCounter', {'activeBattleCounter': this.activeBattleCounter});
                },
                changeStatus: function (cl) {
                    cl.status = (cl.status > 1 ? 0 : parseInt(cl.status) + 1);
                }
            };
        vm = new Vue(vueConfig);
    }

    RPC.addEventListener('onconnect', (e) => {
    });

    RPC.connect();

    function forceUpdate() {
        callRoute('updateMe', {});
    }

    function successMessage(message) {
        showNotify('success', message || 'Success update!');
    }
    function errorMessage(message) {
        showNotify('error', message || 'Error!');
    }
    function showNotify(type, message) {
        if(typeof vm.$snotify !== 'undefined') {
            vm.$snotify[type](message);
        }
    }
})();
