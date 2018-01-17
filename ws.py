#!/usr/bin/env /usr/bin/python3
# -*- coding: utf-8 -*-

import json
import logging
import os
import sys

from packaging import version
from requests import get
from tornado import web, httpserver, ioloop
from wsrpc import WebSocket

allowFork = False
project_root = os.getcwd()
options = {
    'port': 8080,
    'listen': '127.0.0.1'
}
__version__ = '1.2.2'


class MyWebSocket(WebSocket):
    active_battle = 0
    active_battle_counter = [0, 0]
    battles = []
    gamers = 8 * [
        {
            'name': '',
            'active': True,
            'classes': 4 * [
                {
                    'class': '',
                    'status': 1  # 1 - default, 2 - win, 0 - fail
                }
            ]
        }
    ]

    @staticmethod
    def get_clients():
        return MyWebSocket._CLIENTS


def calc_battles():
    gamers = MyWebSocket.gamers

    if len(MyWebSocket.battles):
        return

    battles = []
    for index, gamer in enumerate(gamers):
        if index % 2:
            battles.append({
                'gamers': [index - 1, index]
            })
    MyWebSocket.battles = battles


def _get_clients(client=None):
    if client and isinstance(client, WebSocket):
        clients = {'c': client}
    else:
        clients = MyWebSocket.get_clients()
    return clients


def refresh_gamers(client=None):
    clients = _get_clients(client)

    if len(clients) > 1:
        calc_battles()
        refresh_battles()

    for u in clients:
        clients[u].call('updateGamers', **{
            'gamers': MyWebSocket.gamers
        })


def refresh_active_battle_counter(client=None):
    clients = _get_clients(client)

    if len(clients) > 1:
        calc_battles()
        refresh_battles()

    for u in clients:
        clients[u].call('updateActiveBattleCounter', **{
            'activeBattleCounter': MyWebSocket.active_battle_counter
        })


def refresh_battles(client=None):
    clients = _get_clients(client)

    for u in clients:
        clients[u].call('updateBattles', **{
            'battles': MyWebSocket.battles
        })


def refresh_active_battle(client=None):
    clients = _get_clients(client)

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
    if kwargs.get('activeBattleCounter', False):
        print('set active battle counter: ', kwargs.get('activeBattleCounter'))
        counter = kwargs.get('activeBattleCounter')
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


def update_me(*args, **kwargs):
    if isinstance(args[0], WebSocket):

        print('force update one client')

        client = args[0]
        refresh_gamers(client)
        refresh_battles(client)
        refresh_active_battle(client)
        refresh_active_battle_counter(client)


MyWebSocket.ROUTES['updateMe'] = update_me
MyWebSocket.ROUTES['setGamers'] = set_gamers
MyWebSocket.ROUTES['setActiveBattle'] = set_active_battle
MyWebSocket.ROUTES['setActiveBattleCounter'] = set_active_battle_counter


def check_version():
    api_url = 'https://api.github.com/repos/StixoTvorec/Hearthstone-statistic/releases/latest'
    api_content = json.loads(get(api_url).text)
    tag_name = api_content['tag_name']
    if version.parse(tag_name) > version.parse(__version__):
        download_addr = api_content['assets'][0]
        print('Found new version %s !\nDownload here:\n%s' % (tag_name, download_addr['browser_download_url']))


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

    check_version()

    logging.getLogger('tornado.access').disabled = True
    http_server = httpserver.HTTPServer(web.Application((
        (r"/ws/", MyWebSocket),
        (r'/(.*)', web.StaticFileHandler, {
            'path': os.path.join(project_root, 'static'),
            'default_filename': 'index.html'
        }),
    ), cookie_secret='F19SOYmT4JXKS9NjVg*$d91exOrfZdH5WPUwu*'))

    http_server.listen(options['port'], address=options['listen'])
    ioloop.IOLoop.instance().start()
