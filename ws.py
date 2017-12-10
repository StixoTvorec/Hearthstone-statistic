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
    battles = [
        # {
        #     'gamers': [0, 1],
        #     'active': False,
        # },
    ]
    gamers = [
        {
            'name': '',
            'active': False,
            'classes': [
                {
                    'class': '',
                    'available': False
                },
                {
                    'class': '',
                    'available': False
                },
                {
                    'class': '',
                    'available': False
                },
                {
                    'class': '',
                    'available': False
                },
            ]
        },
        {
            'name': '',
            'active': True,
            'classes': [
                {
                    'class': '',
                    'available': False
                },
                {
                    'class': '',
                    'available': False
                },
                {
                    'class': '',
                    'available': False
                },
                {
                    'class': '',
                    'available': False
                },
            ]
        },
    ]

    def on_close(self):
        super().on_close()

    def open(self):
        super().open()

    @staticmethod
    def get_clients():
        return MyWebSocket._CLIENTS


def update_current_battle(*args, **kwargs):
    _list = MyWebSocket.get_clients()

    print(args)
    print(kwargs)
    # updateCurrentBattle
    pass


def refresh_gamers():
    _list = MyWebSocket.get_clients()
    for u in _list:
        _list[u].call('updateGamers', **{
            'gamers': MyWebSocket.gamers
        })


def update_gamers(*args, **kwargs):
    if kwargs.get('gamers', False):
        gamers = kwargs.get('gamers')

        MyWebSocket.gamers = gamers

        refresh_gamers()


def update_gamer(*args, **kwargs):
    if kwargs.get('gamer', False)\
            and MyWebSocket.gamers[kwargs.get('gamer')['index']]:
        gamer = kwargs.get('gamer')

        MyWebSocket.gamers[gamer.get('index')] = gamer.get('gamer')

        refresh_gamers()


def update(*args, **kwargs):
    if isinstance(args[0], WebSocket):
        client = args[0]
        client.call('updateGamers', **{
            'gamers': MyWebSocket.gamers
        })


MyWebSocket.ROUTES['updateMe'] = update
MyWebSocket.ROUTES['updateCurrentBattle'] = update_current_battle
MyWebSocket.ROUTES['updateGamers'] = update_gamers
MyWebSocket.ROUTES['updateGamer'] = update_gamer
MyWebSocket.ROUTES['getTime'] = lambda t: time.time()

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
