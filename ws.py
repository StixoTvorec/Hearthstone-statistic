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

    _need_logout = False

    def system_message(self, text: str):
        self.call('incoming', **{
            'message': text,
             'is_my': 0,
             'is_system': 1,
             'image': '/img/logo.svg',
             'name': 'System',
             'date': time_now()
        })

    def on_close(self):
        super().on_close()

    def open(self):
        super().open()

    @staticmethod
    def get_clients():
        return super()._CLIENTS


def update(*args, **kwargs):
    _m = str(args[1]).strip()
    if len(_m) < 2 or len(_m) > 512:
        args[0].system_message('Length limitation from 2 to 512 characters')
        return None
    _m = _m.replace('<', '&lt;').replace('>', '&gt;')
    _list = MyWebSocket.get_clients()

    md5 = 'default'
    _l = 'Anonymous'
    for u in _list:
        _list[u].call('incoming', **{
            'message': _m,
            'is_my': 1 if args[0].id == u else 0,
            'is_system': 0,
            'image': '//gravatar.com/avatar/{}?s=96'.format(md5, ),
            'name': _l,
            'date': time_now()
        })


MyWebSocket.ROUTES['update'] = update
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
