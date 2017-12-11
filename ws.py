#!/usr/bin/env /usr/bin/python3
# -*- coding: utf-8 -*-

import os
import tornado.web
import tornado.httpserver
import tornado.ioloop
import time
from wsrpc import WebSocketRoute, WebSocket
from tornado.web import (RequestHandler, HTTPError)
import sys
import json

allowFork = False
project_root = os.getcwd()
options = {
    'port': 8080,
    'listen': '127.0.0.1'
}

classes = {
    'druid': {},
    'hunter': {},
    'mage': {},
    'paladin': {},
    'priest': {},
    'rogue': {},
    'shaman': {},
    'warlock': {},
    'warrior': {},
}


def time_now():
    return time.strftime('%Y-%m-%d %H:%M:%S')


class MyWebSocket(WebSocket):
    active_battle = 0
    active_battle_counter = [0, 0]
    battles = []
    gamers = 8 * [
        {
            'name': '',
            'active': True,
            'classes': [
                {
                    'class': '',
                    'available': True
                },
                {
                    'class': '',
                    'available': True
                },
                {
                    'class': '',
                    'available': True
                },
                {
                    'class': '',
                    'available': True
                }
            ]
        }
    ]

    # def on_close(self):
    #     super().on_close()
    #
    # def open(self):
    #     super().open()
    #     # update(self)

    @staticmethod
    def get_clients():
        return MyWebSocket._CLIENTS


def calc_battles():
    gamers = MyWebSocket.gamers

    if len(MyWebSocket.battles):
        return

    no_losers = []
    battles = []
    for index, gamer in enumerate(gamers):
        if gamer.get('active'):
            no_losers.append(index)
        if index % 2:
            battles.append({
                'gamers': [index - 1, index]
            })
    if len(no_losers) <= len(gamers)/2:
        for index, gamer in enumerate(no_losers):
            if index % 2:
                pass  # auto append winners
                # battles.append({
                #     'gamers': [no_losers[index - 1], no_losers[index]]
                # })
    MyWebSocket.battles = battles


def refresh_gamers(client=None):
    if client and isinstance(client, WebSocket):
        clients = {'c': client}
    else:
        clients = MyWebSocket.get_clients()
        calc_battles()
        refresh_battles()

    for u in clients:
        clients[u].call('updateGamers', **{
            'gamers': MyWebSocket.gamers
        })


def refresh_active_battle_counter(client=None):
    if client and isinstance(client, WebSocket):
        clients = {'c': client}
    else:
        clients = MyWebSocket.get_clients()
        calc_battles()
        refresh_battles()

    for u in clients:
        clients[u].call('updateActiveBattleCounter', **{
            'counter': MyWebSocket.active_battle_counter
        })


def refresh_battles(client=None):
    if client and isinstance(client, WebSocket):
        clients = {'c': client}
    else:
        clients = MyWebSocket.get_clients()
    for u in clients:
        clients[u].call('updateBattles', **{
            'battles': MyWebSocket.battles
        })


def refresh_active_battle(client=None):
    if client and isinstance(client, WebSocket):
        clients = {'c': client}
    else:
        clients = MyWebSocket.get_clients()

    for u in clients:
        clients[u].call('updateActiveBattle', **{
            'activeBattle': MyWebSocket.active_battle
        })


def set_gamers(*args, **kwargs):
    if kwargs.get('gamers', False):
        print('set gamers')
        gamers = kwargs.get('gamers')
        MyWebSocket.gamers = gamers

        refresh_gamers()


def set_active_battle_counter(*args, **kwargs):
    if kwargs.get('counter', False):
        print('set active battle counter: ', kwargs.get('counter'))
        counter = kwargs.get('counter')
        MyWebSocket.active_battle_counter = counter

        refresh_active_battle_counter()


def set_active_battle(*args, **kwargs):
    if kwargs.get('activeBattle', -1) >= 0:
        print('set active battle index: ', kwargs.get('activeBattle'))
        MyWebSocket.active_battle = kwargs.get('activeBattle')

        refresh_active_battle()

    if kwargs.get('battles', False):
        print('set battles')

        battles = kwargs.get('battles')
        MyWebSocket.battles = battles

        refresh_battles()


def updateMe(*args, **kwargs):
    if isinstance(args[0], WebSocket):

        print('force update one client')

        client = args[0]
        refresh_gamers(client)
        refresh_battles(client)
        refresh_active_battle(client)
        refresh_active_battle_counter(client)


MyWebSocket.ROUTES['updateMe'] = updateMe
MyWebSocket.ROUTES['setGamers'] = set_gamers
MyWebSocket.ROUTES['setActiveBattle'] = set_active_battle
MyWebSocket.ROUTES['setActiveBattleCounter'] = set_active_battle_counter
# MyWebSocket.ROUTES['setBattles'] = set_battles
# MyWebSocket.ROUTES['getTime'] = lambda t: time.time()

if __name__ == "__main__":

    print('Starting server: %s:%d' % (options['listen'], int(options['port'])), file=sys.stdout)

    if allowFork:
        try:
            pid = os.fork()
            if pid:
                print('Daemon started with pid %d' % pid)
                sys.exit(0)
        except Exception as e:
            print('Could not daemonize, script will run in foreground. Error was: "%s"' % str(e), file=sys.stderr)

    http_server = tornado.httpserver.HTTPServer(tornado.web.Application((
        (r"/ws/", MyWebSocket),
        (r'/(.*)', tornado.web.StaticFileHandler, {
            'path': os.path.join(project_root, 'static'),
            'default_filename': 'index.html'
        }),
    ), cookie_secret='1F9Swu*xO1edH5rf$OJXKS9U4*dNjVgYmTWP9Z'))

    http_server.listen(options['port'], address=options['listen'])
    tornado.ioloop.IOLoop.instance().start()
