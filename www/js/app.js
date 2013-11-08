var $body;
var $content;
var $books_grid;
var $modal;
var $modal_content;

/*
 * Scroll to a place in the page.
 */
var smooth_scroll = function(offset_element, padding) {
    var elementOffset = offset_element.offset().top;
    var distance =  elementOffset - padding;
    $body.animate({ scrollTop: distance + "px" });
};

/*
 * Jump back to the top of the page.
 */
var back_to_top = function() {
    smooth_scroll($content, 0);

    return false;
};

/*
 * Show/hide books in the grid.
 */
var filter_books = function(tag) {
    if (tag) {
        $('.book').hide();
        $('.book.tag-' + tag).show();
    } else {
        $('.book').show();
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
    hasher.setHash(null);
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
    // Ensure book is on the page.
    filter_books(null);

    var $el = $('#' + slug);

    smooth_scroll($el, 0);

    $modal_content.empty();

    book = _.find(BOOKS, function(book){
        return book['slug'] == slug;
    });

    $modal_content.append(JST.book_modal({
        book: book,
        app_config: APP_CONFIG
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
        on_tag_hash(hash_slug);
    } else if (hash_type == 'book') {
        on_book_hash(hash_slug);
    } else {
        filter_books(null);
    }

    return false;
};

/*
 * Clear the hash when closing a book modal.
 */
var on_book_modal_closed = function() {
    // HACK: Set to underscore so it doesn't scroll to top
    // as it would with null/empty string.
    hasher.setHash('_');

    return true;
};

$(function() {
    $body = $('body');
    $content = $('#content');
    $books_grid = $('#books-grid');
    $modal = $('#myModal');
    $modal_content = $('#myModal .modal-content');

    // Event handlers.
    $content.on('click', 'button.tag', on_tag_clicked);
    $content.on('click', '.back-to-top', back_to_top);
    $content.on('click', 'button.clear-tags', on_clear_tags_clicked);
    $modal.on('hidden.bs.modal', on_book_modal_closed);

    // Render the book grid
    $books_grid.html(JST.book_grid({
        books: BOOKS,
        app_config: APP_CONFIG,
        book_card: JST.book_card
    }));

    // Set up the hasher bits to grab the URL hash.
    hasher.changed.add(on_hash_changed);
    hasher.initialized.add(on_hash_changed);
    hasher.init();
});
