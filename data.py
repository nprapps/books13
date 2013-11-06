import csv
import json
import re

import requests

import app_config


class Book(object):
    """
    Because why not have an object?
    Plus, a convenient way to handle clean()
    and enumerate the fields we expect from the
    Google doc.
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
    review_seamus_id = None
    other_seamus_id = None

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

            # List of keys that need special treatment and serialization.
            if key in [u'tags', u'book_seamus_id', u'author_seamus_id', u'review_seamus_id', u'other_seamus_id']:

                # Strip junk.
                value = value\
                        .replace('(no build)', '')\
                        .replace(' and ', ',')\
                        .replace('coming', '')\
                        .replace('has a review, but no book page', '')

                # Build the empty list, since each can have more than one.
                item_list = []

                # Split on commas.
                for item in value.split(','):

                    # Tags get special treatment.
                    if key == "tags":

                        # If it's not blank, add to the list.
                        # Returning an empty list is better than a blank
                        # string inside the list.
                        if item != u"":
                            item_list.append(item)

                    try:

                        # Try and turn this into an integer.
                        item = int(item.strip())

                        # Add to the list.
                        item_list.append(item)

                    except ValueError:
                        pass

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
    csv_url = "https://docs.google.com/spreadsheet/pub?key=%s&single=true&gid=0&output=csv" % (
        app_config.DATA_GOOGLE_DOC_KEY)
    r = requests.get(csv_url)

    with open('data/books.csv', 'wb') as writefile:
        writefile.write(r.content)


def parse_books_csv():
    with open('data/books.csv', 'rb') as readfile:
        books = list(csv.DictReader(readfile))

    book_list = []

    for book in books:
        b = Book(**book)
        book_list.append(b.__dict__)

    with open('data/books.json', 'wb') as writefile:
        writefile.write(json.dumps(book_list))
