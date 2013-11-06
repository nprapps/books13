import csv
import pickle

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

    tags = None
    book_seamus_id = None
    author_seamus_id = None
    review_seamus_id = None
    other_seamus_id = None

    clean_tags = []
    clean_book_seamus_id = []
    clean_author_seamus_id = []
    clean_review_seamus_id = []
    clean_other_seamus_id = []

    def __unicode__(self):
        return self.title

    def clean(self):
        """
        Cleans the ID fields coming back from the spreadsheet.
        Removes non-integer junk from the cells.
        Serializes based on commas.
        """
        for field in ['tags', 'book_seamus_id', 'author_seamus_id', 'review_seamus_id', 'other_seamus_id']:
            clean_field = 'clean_%s' % field
            item_list = []
            for item in getattr(self, field).split(','):
                if field == 'tags':
                    if item != u"":
                        item_list.append(item)
                else:
                    try:
                        item = int(item)
                        item_list.append(item)
                    except ValueError:
                        pass

            print field, item_list
            setattr(self, clean_field, item_list)

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
        b = Book()
        for key, value in book.items():
            setattr(b, key, value.decode('utf-8'))
        b.clean()
        book_list.append(b)

    with open('data/books.pickle', 'wb') as writefile:
        pickle.dump(book_list, writefile)
