
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

    RPC.addRoute('whoAreYou', (data) => {
        return window.navigator.userAgent;
    });

    RPC.addRoute('updateBattles', (data) => {
        console.log('updateBattles route');
        console.log(data);
        if(typeof data['battles'] !== 'undefined') {
            vm.battles = data['battles'];
        }
    });

    RPC.addRoute('updateGamers', (data) => {
        console.log('updateGamers route');
        console.log(data);
        if(typeof data['gamers'] !== 'undefined') {
            vm.gamers = data['gamers'];
        }
    });

    RPC.addRoute('updateActiveBattle', (data) => {
        console.log('updateActiveBattle route');
        console.log(data);
        if(typeof data['activeBattle'] !== 'undefined') {
            vm.activeBattle = data['activeBattle'];
        }
    });

    RPC.addRoute('updateActiveBattleCounter', (data) => {
        console.log('updateActiveBattleCounter route');
        console.log(data);
        if(typeof data['counter'] !== 'undefined') {
            vm.activeBattleCounter = data['counter'];
        }
    });

    // current battle statistic
    if(document.getElementById('statistic')) {
        vm = new Vue({
            el: '#statistic',
            data: {
                battles: [],
                gamers: [],
                activeBattle: 0,
                activeBattleCounter: [0, 0]
            },
            methods: {
            },
            mounted() {
                this.$nextTick(() => {
                    forceUpdate();
                });
            }
        });
        console.log(vm);
        console.log(vm.gamers);
    }

    // all gamers list
    if(document.getElementById('gamers')) {
        vm = new Vue({
            el: '#gamers',
            data: {
                battles: [],
                gamers: [],
                activeBattle: 0,
                activeBattleCounter: [0, 0]
            },
            methods: {},
            mounted() {
                this.$nextTick(() => {
                    forceUpdate();
                });
            }
        });
    }

    // index file, main config
    if(document.getElementById('config')) {
        vm = new Vue({
            el: '#config',
            data: {
                battles: [],
                gamers: [],
                activeBattle: 0,
                activeBattleCounter: [0, 0],
                classes: classes,
            },
            methods: {
                updateGamers: function () {
                    RPC.call('setGamers', {gamers: this.gamers})
                        .then((data) => {
                            successMessage();
                        }, (error) => {
                            errorMessage(error);
                        }).done();
                },
                forceUpdate: forceUpdate,
                setActiveBattle: function () {
                    RPC.call('setActiveBattle', {
                            activeBattle: this.activeBattle,
                            battles: this.battles
                        })
                        .then((data) => {
                            successMessage();
                        }, (error) => {
                            errorMessage(error);
                        }).done();
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
                    RPC.call('setActiveBattleCounter', {
                            'counter': this.activeBattleCounter
                        })
                        .then((data) => {
                            successMessage();
                        }, (error) => {
                            errorMessage(error);
                        }).done()
                }
            },
            mounted() {
                this.$nextTick(() => {
                    let firstElemSelector = '.tabs>ul>li>a';
                    let selector = window.location.hash ? 'a[href="' + window.location.hash + '"]' : firstElemSelector;
                    const elem = document.querySelector(selector);
                    if (elem) {
                        elem.click();
                    }
                    else {
                        document.querySelector(firstElemSelector).click();
                    }
                    forceUpdate();
                });
            }
        });
    }

    RPC.addEventListener('onconnect', (e) => {
    });

    RPC.connect();

    function forceUpdate() {
        RPC.call('updateMe', {}).then((data) => {
                successMessage();
            }, (error) => {
                errorMessage(error);
            }).done();
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
