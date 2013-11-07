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
    var tag = $(this).data('tag-slug');
    hasher.setHash(tag);
};

var smooth_scroll = function(offset_element, padding) {
    var elementOffset = offset_element.offset().top;
    var distance =  elementOffset - padding;
    $('body').animate({ scrollTop: distance + "px" });
};

var on_hash_changed = function(new_hash, old_hash){
    var book_list = _.filter(BOOKS, function(book){
        return book.tags.indexOf(new_hash) >= 0;
    });

    load_books(book_list);

    smooth_scroll($('#content'), 0);
};

$(function() {
    // Variables and CONSTANTS.
    $books_target = $('#books-target');

    // Event handlers.
    $('body').on('click', 'button.tag', on_tag_clicked);

    load_books(BOOKS);
    hasher.changed.add(on_hash_changed);
    hasher.initialized.add(on_hash_changed);
    hasher.init();
});
