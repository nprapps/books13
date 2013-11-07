var $books_target;

var load_books = function(book_list) {

    $books_target.empty();

    _.each(book_list, function(element, index, list){

        $books_target.append(JST.book_card({
            book: element,
            app_config: APP_CONFIG
        }));

    });

};

var on_tag_clicked = function(){

    // Sets up the tag slug we can use in the URL.
    var tag = $(this).data('tag-slug');

    // Post this tag hash to the URL and let
    // hasher handle the rest.
    hasher.setHash(tag);
};

var smooth_scroll = function(offset_element, padding) {

    // Calculate the element against the top of the page.
    var elementOffset = offset_element.offset().top;

    // Subtract the padding.
    var distance =  elementOffset - padding;

    // Scroll exactly that far. And make it all animate-y.
    $('body').animate({ scrollTop: distance + "px" });

};

var on_hash_changed = function(new_hash, old_hash){
    // If the hash isn't blank, filter.
    if (new_hash !== '') {

        // Set up a filtered list of all books.
        var book_list = _.filter(BOOKS, function(book){

            // Specifically, filter on the tag.
            return book.tags.indexOf(new_hash) >= 0;
        });

        // Load our filtered subset of books.
        load_books(book_list);

        // Scroll to the top of the #content div.
        smooth_scroll($('#content'), 0);

    } else {

        // Otherwise, just load everything.
        load_books(BOOKS);

    }
};

$(function() {
    // Variables and CONSTANTS.
    $books_target = $('#books-target');

    // Event handlers.
    $('body').on('click', 'button.tag', on_tag_clicked);

    // Set up the hasher bits to grab the URL hash.
    hasher.changed.add(on_hash_changed);
    hasher.initialized.add(on_hash_changed);
    hasher.init();
});
