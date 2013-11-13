var MOBILE = Modernizr.touch;
var SMALL = Modernizr.mq('only all and (max-width: 480px)');

var $body;
var $content;
var $books_grid;
var $all_tags;
var $clear_tags;
var $current_tag;
var $modal;
var $modal_content;

var scroll = function($el) {
    var top = $el.offset().top;

    $body.scrollTop(top);
};

/*
 * Jump back to the top of the page.
 */
var back_to_top = function() {
    scroll($books_grid.parent(), 0);

    return false;
};

/*
 * Show/hide books in the grid.
 */
var filter_books = function(tag) {
    $all_tags.removeClass('selected');

    if (tag) {
        var $tag = $('.tags .tag[data-tag-slug="' + tag + '"]');

        $('#books-grid').isotope({ filter: '.tag-' + tag, transformsEnabled: !MOBILE });
        $tag.addClass('selected');
        $clear_tags.show();
        $current_tag.find('span').text(COPY.tags[tag]);
        $current_tag.show();
    } else {
        $('#books-grid').isotope({ filter: '*', transformsEnabled: !MOBILE });
        $clear_tags.hide();
        $current_tag.hide();
    }
};

/*
 * Filter the list to a certain tag.
 */
var on_tag_clicked = function() {
    var tag = $(this).data('tag-slug');
    hasher.setHash('tag/' + tag);

    return false;
};

/*
 * Clear the current tag
 */
var on_clear_tags_clicked = function() {
    hasher.setHash('_');
    back_to_top();

    return false;
};

/*
 * New tag hash url. 
 */
var on_tag_hash = function(slug) {
    filter_books(slug);
    back_to_top();
};

/*
 * New book hash url.
 */
var on_book_hash = function(slug) {
    $modal_content.empty();

    book = _.find(BOOKS, function(book){
        return book['slug'] == slug;
    });

    var grid_item = $('#' + book.slug);
    var next = grid_item.nextAll(':not(.isotope-hidden)').first();
    
    if (next.length == 0) {
        next = null;
    } else {
        next = next.attr('id');
    }

    var previous = grid_item.prevAll(':not(.isotope-hidden)').first();

    if (previous.length == 0) {
        previous = null;
    } else {
        previous = previous.attr('id');
    }

    $modal_content.append(JST.book_modal({
        book: book,
        next: next,
        previous: previous,
        SMALL_MOBILE: (SMALL && MOBILE)
    }));

    $modal.modal();
};

/*
 * Respond to url changes.
 */
var on_hash_changed = function(new_hash, old_hash) {
    var bits = new_hash.split('/');
    var hash_type = bits[0];
    var hash_slug = bits[1];

    if (hash_type == 'tag') {
        $modal.modal('hide');
        on_tag_hash(hash_slug);
    } else if (hash_type == 'book') {
        on_book_hash(hash_slug);
    } else {
        $modal.modal('hide');
        filter_books(null);
    }

    var relayout_func = _.debounce(function() {
        $books_grid.isotope('reLayout');
    }, 250);
    
    $books_grid.find('img').unveil(1200, function() {
        $(this).load(function() {
            relayout_func(); 
            $(this).removeClass('veiled');
        });
    });

    return false;
};

/*
 * Clear the hash when closing a book modal.
 */
var on_book_modal_closed = function() {
    // HACK: Set to underscore so it doesn't scroll to top
    // as it would with null/empty string.
    if (hasher.getHash().split('/')[0] == 'book') {
        hasher.setHash('_');
    }

    return true;
};

var on_next_book_clicked = function() {

    hasher.setHash('book/' + next.attr('id'));
};


$(function() {
    $body = $('body');
    $content = $('#content');
    $books_grid = $('#books-grid');
    $all_tags = $('.tags .tag');
    $clear_tags = $('.clear-tags');
    $current_tag = $('#current-tag');
    $modal = $('#myModal');
    $modal_content = $('#myModal .modal-content');
  
    // Event handlers.
    $body.on('click', 'button.tag', on_tag_clicked);
    $content.on('click', '.back-to-top', back_to_top);
    $content.on('click', 'button.clear-tags', on_clear_tags_clicked);
    $modal.on('hidden.bs.modal', on_book_modal_closed);
    $modal.on('click', '#next-book', on_next_book_clicked);
    

    // Render the book grid
    $books_grid.html(JST.book_grid({
        books: BOOKS,
        book_card: JST.book_card
    }));
    
    // Set up the hasher bits to grab the URL hash.
    hasher.changed.add(on_hash_changed);
    hasher.initialized.add(on_hash_changed);
    hasher.init();
});
