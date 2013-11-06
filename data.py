import csv
import json

import requests

import app_config


def get_books_csv():
    csv_url = "https://docs.google.com/spreadsheet/pub?key=%s&single=true&gid=0&output=csv" % app_config.DATA_GOOGLE_DOC_KEY
    r = requests.get(csv_url)

    with open('data/books.csv', 'wb') as writefile:
        writefile.write(r.content)


def write_books_json():
    with open('data/books.csv', 'rb') as readfile:
        books = list(csv.DictReader(readfile))

        with open('data/books.json', 'wb') as writefile:
            writefile.write(json.dumps(books))
