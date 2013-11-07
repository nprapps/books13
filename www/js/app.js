var $body;
var $content;
var $books_grid;

/*
 * Scroll to a place in the page.
 */
var smooth_scroll = function(offset_element, padding) {
    var elementOffset = offset_element.offset().top;
    var distance =  elementOffset - padding;
    $body.animate({ scrollTop: distance + "px" });
};

/*
 * Render a set of books into the grid.
 */
var load_books = function(book_list) {
    $books_grid.empty();

    _.each(book_list, function(element, index, list){
        $books_grid.append(JST.book_card({
            book: element,
            app_config: APP_CONFIG
        }));
    });
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
 * Respond to url changes.
 */
var on_tag_hash = function(slug) {
    var book_list = BOOKS;

    if (slug != '') {
        book_list = _.filter(book_list, function(book) {
            return book.tags.indexOf(slug) >= 0;
        });
    }

    load_books(book_list);
    smooth_scroll($content, 0);
};

/*
 * New book hash url.
 */
var on_book_hash = function(slug) {
    // Clear current tag filter
    on_tag_hash('');

    console.log('jump to book: ' + slug);
}

/*
 * Respond to url changes.
 */
var on_hash_changed = function(new_hash, old_hash) {
    var bits = new_hash.split('/');
    var hash_type = bits[0];
    var hash_slug = bits[1];
    
    if (hash_type == 'tag') {
        on_tag_hash(hash_slug);
    } else if (hash_type == 'book') {
        on_book_hash(hash_slug);
    }

    return false;
};

$(function() {
    $body = $('body');
    $content = $('#content');
    $books_grid = $('#books-grid');

    // Event handlers.
    $content.on('click', 'button.tag', on_tag_clicked);
    $content.on('click', 'button.back-to-top', function(){
        smooth_scroll($content, 0);
    });

    // Set up the hasher bits to grab the URL hash.
    hasher.changed.add(on_hash_changed);
    hasher.initialized.add(on_hash_changed);
    hasher.init();
});
