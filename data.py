#!/usr/bin/env python
# -*- coding: utf-8 -*-

import csv
import json
import os
import re

from bs4 import BeautifulSoup
from PIL import Image
import requests
import xlrd

import app_config
import copytext

TAGS_TO_SLUGS = {}
SLUGS_TO_TAGS = {}

class Book(object):
    """
    A single book instance.
    __init__ cleans the data.
    """
    isbn = None
    title = None
    author = None
    genre = None
    reviewer = None
    text = None
    slug = None
    tags = None
    book_seamus_id = None

    author_seamus_id = None
    author_seamus_headline = None

    review_seamus_id = None
    review_seamus_headline = None

    def __unicode__(self):
        """
        Returns a pretty value.
        """
        return self.title

    def __init__(self, **kwargs):
        """
        Cleans the ID fields coming back from the spreadsheet.
        Removes non-integer junk from the cells.
        Serializes based on commas.
        """
        for key, value in kwargs.items():

            # Handle wacky characters.
            value = unicode(value.decode('utf-8')).strip()

            if key == 'text':
                if value == '' or value == None:
                    print '#%s Missing text (review) for %s.' % (kwargs['#'], kwargs['title'])

            if key in ['book_seamus_id', 'author_seamus_id', 'review_seamus_id'] and value:
                try:
                    int(value)
                    if key in ['review_seamus_id', 'author_seamus_id']:
                        r = requests.get('http://www.npr.org/%s' % value)
                        soup = BeautifulSoup(r.content)
                        setattr(
                            self,
                            key.replace('_id', '_headline'),
                            soup.select('div.storytitle h1')[0].text.strip())

                except ValueError:
                    print '#%s Invalid %s: "%s"' % (kwargs['#'], key, value)
                    continue

                except IndexError:
                    print '#%s Invalid headline for http://www.npr.org/%s' % (kwargs['#'], value)

            if key == 'isbn':
                value = value.zfill(10)

            if key == 'tags':
                # Build the empty list, since each can have more than one.
                item_list = []

                # Split on commas.
                for item in value.split(','):

                    # If it's not blank, add to the list.
                    # Returning an empty list is better than a blank
                    # string inside the list.
                    if item != u"":

                        # Clean.
                        item = item.strip()

                        # Look up from our map.
                        tag_slug = TAGS_TO_SLUGS.get(item, None)

                        # Append if the tag exists.
                        if tag_slug:
                            item_list.append(tag_slug)
                        else:
                            print "#%s Unknown tag: '%s'" % (kwargs['#'], item)

                # Set the attribute with the corrected value, which is a list.
                setattr(self, key, item_list)
            else:
                # Don't modify the value for stuff that isn't in the list above.
                setattr(self, key, value)

        # Slugify.
        slug = self.title.lower()
        slug = re.sub(r"[^\w\s]", '', slug)
        slug = re.sub(r"\s+", '-', slug)
        setattr(self, "slug", slug[:254])

def get_books_csv():
    """
    Downloads the books CSV from google docs.
    """
    csv_url = "https://docs.google.com/spreadsheet/pub?key=%s&single=true&gid=0&output=csv" % (
        app_config.DATA_GOOGLE_DOC_KEY)
    r = requests.get(csv_url)

    with open('data/books.csv', 'wb') as writefile:
        writefile.write(r.content)

def get_tags():
    """
    Extract tags from COPY doc.
    """
    print 'Extracting tags from COPY'

    book = xlrd.open_workbook(copytext.COPY_XLS)

    sheet = book.sheet_by_name('tags')

    for i in range(1, sheet.nrows):
        slug, tag = sheet.row_values(i)

        SLUGS_TO_TAGS[slug] = tag.strip().replace(u'’', "'")
        TAGS_TO_SLUGS[tag] = slug.strip()

def parse_books_csv():
    """
    Parses the books CSV to JSON.
    Creates book objects which are cleaned and then serialized to JSON.
    """
    get_tags()

    # Open the CSV.
    with open('data/books.csv', 'rb') as readfile:
        books = list(csv.DictReader(readfile))

    print "Start parse_books_csv(): %i rows." % len(books)

    book_list = []

    # Loop.
    for book in books:

        # Skip books with no title or ISBN
        if book['title'] == "":
            continue

        if book['isbn'] == "":
            continue

        # Init a book class, passing our data as kwargs.
        # The class constructor handles cleaning of the data.
        b = Book(**book)

        # Grab the dictionary representation of a book.
        book_list.append(b.__dict__)

    # Dump the list to JSON.
    with open('www/static-data/books.json', 'wb') as writefile:
        writefile.write(json.dumps(book_list))

    print "End."

def load_images():
    """
    Downloads images from Baker and Taylor.
    Eschews the API for a magic URL pattern, which is faster.
    """

    # Secrets.
    secrets = app_config.get_secrets()

    # Open the books JSON.
    with open('www/static-data/books.json', 'rb') as readfile:
        books = json.loads(readfile.read())

    print "Start load_images(): %i books." % len(books)

    # Loop.
    for book in books:

        # Skip books with no title or ISBN.
        if book['title'] == "":
            continue

        if 'isbn' not in book or book['isbn'] == "":
            continue

        # Construct the URL with secrets and the ISBN.
        book_url = "http://imagesa.btol.com/ContentCafe/Jacket.aspx?UserID=%s&Password=%s&Return=T&Type=L&Value=%s" % (
            secrets['BAKER_TAYLOR_USERID'],
            secrets['BAKER_TAYLOR_PASSWORD'],
            book['isbn'])

        # Request the image.
        r = requests.get(book_url)

        path = 'www/img/cover/%s.jpg' % book['slug']

        # Write the image to www using the slug as the filename.
        with open(path, 'wb') as writefile:
            writefile.write(r.content)

        file_size = os.path.getsize(path)

        if file_size < 10000:
            print "Image not available for ISBN: %s" % book['isbn']

        image = Image.open(path)

        width = 300
        height = int((float(width) / image.size[0]) * image.size[1])

        image.thumbnail([width, height], Image.ANTIALIAS)
        image.save(path.replace('.jpg', '-thumb.jpg'), 'JPEG')

    print "End."
