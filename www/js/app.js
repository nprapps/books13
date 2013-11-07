$(function() {
    // Variables and CONSTANTS.
    var $books_target = $('#books-target');

    // Utility functions.
    var load_books = function(book_list) {
        _.each(book_list, function(element, index, list){
            $books_target.append(JST.book_card({
                book: element,
                app_config: APP_CONFIG
            }));
        });
    };

    // Stuff that runs on the page load.
    var init = function() {
        load_books(BOOKS);
    };

    // Click targets.
    $('body').on('click', 'button.tag', function(){
        console.log($(this).attr('data-tag-name'));
    });

    // Run on page load.
    // Typically, we put all this in init().
    init();
});
