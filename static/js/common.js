
;(() => {
    'use strict';

    if(typeof Vue === 'undefined') {
        return;
    }

    const appStorage = {
        battles: [],
        gamers: [],
        activeBattle: 0,
        activeBattleCounter: [0, 0]
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

    let vm;

    const url = 'ws://' + window.location.host + '/ws/';
    const RPC = WSRPC(url, 2000);

    RPC.addRoute('whoAreYou', (data) => {
        return window.navigator.userAgent;
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

    RPC.addRoute('updateActiveBattleCounter', (data) => {
        console.log('updateActiveBattleCounter route');
        console.log(data);
        if(typeof data['counter'] !== 'undefined') {
            appStorage.activeBattleCounter = data['counter'];
        }
    });

    // current battle statistic
    if(document.getElementById('statistic')) {
        vm = new Vue({
            el: '#statistic',
            data: {
                storage: appStorage,
            },
            methods: {
                getActiveBattle: function () {
                    return appStorage.battles[this.storage.activeBattle] || {};
                }
            },
        });
        forceUpdate();
    }

    // all gamers list
    if(document.getElementById('gamers')) {
        vm = new Vue({
            el: '#gamers',
            data: {
                storage: appStorage
            },
            methods: {}
        });
        forceUpdate();
    }

    // index file, main config
    if(document.getElementById('config')) {
        vm = new Vue({
            el: '#config',
            data: {
                storage: appStorage,
                classes: classes,
            },
            methods: {
                updateGamers: function () {
                    RPC.call('setGamers', {gamers: this.storage.gamers})
                        .then((data) => {
                            successMessage();
                        }, (error) => {
                            errorMessage(error);
                        }).done();
                },
                forceUpdate: function () {
                    forceUpdate();
                },
                getActiveBattle: function () {
                    return appStorage.battles[this.storage.activeBattle] || [];
                },
                setActiveBattle: function () {
                    RPC.call('setActiveBattle', {
                            activeBattle: this.storage.activeBattle,
                            battles: this.storage.battles
                        })
                        .then((data) => {
                            successMessage();
                        }, (error) => {
                            errorMessage(error);
                        }).done();
                },
                addBattle: function () {
                    this.storage.battles.push({'gamers': [0, 1]});
                },
                deleteBattle: function (index) {
                    if (index < this.storage.activeBattle) {
                        this.storage.activeBattle -= 1;
                    }
                    this.storage.battles = this.storage.battles.slice(0, index)
                        .concat(this.storage.battles.slice(index + 1,));
                },
                saveActiveBattleCounter: function () {
                    RPC.call('setActiveBattleCounter', {
                            'counter': this.storage.activeBattleCounter
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
                    let selector = window.location.hash ? 'a[href="' + window.location.hash + '"]' : '.tabs>ul>li>a';
                    const elem = document.querySelector(selector);
                    if (elem) {
                        elem.click();
                    }
                });
            }
        });
    }

    function forceUpdate() {
        RPC.call('updateMe', {}).then((data) => {
                successMessage();
            }, (error) => {
                errorMessage(error);
            }).done();
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
    function successMessage(message) {
        showToastr('success', message || 'Success update!');
    }
    function errorMessage(message) {
        showToastr('error', message || 'Error!');
    }
    function showToastr(type, message) {
        vm.$snotify[type](message)
    }
})();
