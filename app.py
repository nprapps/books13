#!/usr/bin/env python

import json
from mimetypes import guess_type
import re
import urllib

import envoy
from flask import Flask, Markup, abort, render_template
from PIL import Image

import app_config
import copytext
from render_utils import flatten_app_config, make_context

app = Flask(app_config.PROJECT_NAME)

# Example application views
@app.route('/')
def index():
    """
    The index page.
    """
    # Set up standard page context.
    context = make_context()

    # Read the books JSON into the page.
    with open('www/static-data/books.json', 'rb') as readfile:
        context['books_js'] = readfile.read()
        books = json.loads(context['books_js'])
        books_text_only = books[:]
        books_text_only = sorted(books, key=lambda k: k['title'])

    tag_stripper = re.compile(r'<.*?>')

    for book in books:
        if not book['text']:
            book['teaser'] = None
            continue

        img = Image.open('www/assets/cover/%s-thumb.jpg' % book['slug'])
        width, height = img.size

        # Poor man's packing algorithm. How much text will fit?
        chars = height / 25 * 10;

        text = tag_stripper.sub('', book['text'])

        if len(text) <= chars:
            book['teaser'] = text
            continue

        i = chars

        while text[i] != ' ':
            i -= 1

        book['teaser'] = '&#8220;' + text[:i] + ' ...&#8221;'

    context['books'] = books
    context['books_text_only'] = books_text_only

    return render_template('index.html', **context)


# Render LESS files on-demand
@app.route('/less/<string:filename>')
def _less(filename):
    try:
        with open('less/%s' % filename) as f:
            less = f.read()
    except IOError:
        abort(404)

    r = envoy.run('node_modules/bin/lessc -', data=less)

    return r.std_out, 200, { 'Content-Type': 'text/css' }

# Render JST templates on-demand
@app.route('/js/templates.js')
def _templates_js():
    r = envoy.run('node_modules/bin/jst --template underscore jst')

    return r.std_out, 200, { 'Content-Type': 'application/javascript' }

# Render application configuration
@app.route('/js/app_config.js')
def _app_config_js():
    config = flatten_app_config()
    js = 'window.APP_CONFIG = ' + json.dumps(config)

    return js, 200, { 'Content-Type': 'application/javascript' }

# Render copytext
@app.route('/js/copy.js')
def _copy_js():
    copy = 'window.COPY = ' + copytext.Copy().json()

    return copy, 200, { 'Content-Type': 'application/javascript' }

# Server arbitrary static files on-demand
@app.route('/<path:path>')
def _static(path):
    try:
        with open('www/%s' % path) as f:
            return f.read(), 200, { 'Content-Type': guess_type(path)[0] }
    except IOError:
        abort(404)

@app.template_filter('urlencode')
def urlencode_filter(s):
    """
    Filter to urlencode strings.
    """
    if type(s) == 'Markup':
        s = s.unescape()

    s = s.encode('utf8')
    s = urllib.quote_plus(s)

    return Markup(s)

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port')
    args = parser.parse_args()
    server_port = 8000

    if args.port:
        server_port = int(args.port)

    app.run(host='0.0.0.0', port=server_port, debug=app_config.DEBUG)
