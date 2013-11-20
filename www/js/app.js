var MOBILE = Modernizr.touch;
var SMALL = Modernizr.mq('only all and (max-width: 480px)');

var $body;
var $content;
var $books_grid;
var $all_tags;
var $tags = {};
var $clear_tags;
var $current_tag;
var $modal;
var $modal_content;
var $books_list;
var $back_to_top;
var $mobile_filters_btn;
var $filter;
var $toggle_text;
var $show_text_button;
var $show_books_button;

var next;
var previous;
var selected_tags = [];
var first_hash = true;

/*
 * Scroll to a given element.
 */
var scroll_to = function($el) {
    var top = $el.offset().top;
    $body.scrollTop(top);
};

/*
 * Jump back to the top of the page.
 */
var back_to_top = function() {
    $body.scrollTo($content, { duration:450 }, 'y');
    return false;
};

/*
 * Enable or reapply isotope to the grid.
 */
var isotope_grid = function(filter) {
    $books_grid.isotope({
        filter: filter,
        transformsEnabled: !MOBILE,
        getSortData: {
            'id': function($el) {
                return parseInt($el.data('sort'));
            }
        },
        sortBy: 'id'
    });
};

/*
 * Show/hide books in the grid.
 */
var filter_books = function() {
    $all_tags.parent().removeClass('selected unavailable');
    $all_tags.removeClass('selected unavailable');

    if (selected_tags.length > 0) {
        var filter = '';
        var label = [];

        // Update selected tags
        for (var i in selected_tags) {
            var slug = selected_tags[i];
            var $tag = $tags[slug];

            $tag.addClass('selected');
            $tag.parent().addClass('selected');
            filter += '.tag-' + slug;
            label.push(COPY.tags[slug]);
        }

        label = label.join(', ');

        // Replicate isotope filtering so that we can update
        // available tags without waiting for isotope to do its thing
        var remaining_books = _.filter(BOOKS, function(book) {
            for (var i in selected_tags) {
                var slug = selected_tags[i];

                if (_.indexOf(book.tags, slug) == -1) {
                    return false;
                }
            }

            return true;
        });

        // Hide empty tags
        for (var slug in COPY.tags) {
            var has_results = false;

            for (var i = 0; i < remaining_books.length; i++) {
                var book = remaining_books[i];

                if (_.indexOf(book.tags, slug) >= 0) {
                    has_results = true;
                    break;
                }
            }

            if (!has_results) {
                var $tag = $tags[slug];
                $tag.parent().addClass('unavailable');
                $tag.addClass('unavailable');
            }
        }

        $clear_tags.show();
        $current_tag.find('#showing-span').text('Showing books tagged ');
        $current_tag.find('#tag-span').text(label);

        console.log(filter);

        filter_books_list(filter);
        _.defer(isotope_grid, filter);
    } else {
        $clear_tags.hide();
        $current_tag.find('#showing-span').text('Showing all books');
        $current_tag.find('#tag-span').text('');

        filter_books_list(null);
        _.defer(isotope_grid, '*');
    }

    // NB: Force scroll event so that unveils will happen auto-magically
    // We wait a moment first so the grid has animated in
    _.delay(function() {
        $(window).trigger('scroll');
    }, 1000);
};

/*
 * Filter the text book list.
 */
var filter_books_list = function(filter) {
    // Don't bother with text on mobile
    if (MOBILE) {
        return;
    }

    if (filter) {
        $books_list.find('li').removeClass('visible');

        var filter = '';

        for (var i in selected_tags) {
            var slug = selected_tags[i];
            filter += '.tag-' + slug;
        }

        $books_list.find(filter).addClass('visible');
    } else {
        $books_list.find('li').addClass('visible');
    }
};

/*
 * Filter the list to a certain tag.
 */
var on_tag_clicked = function() {
    var slug = $(this).data('tag-slug');
    var already_selected = selected_tags.indexOf(slug);

    if (already_selected >= 0) {
        selected_tags.splice(already_selected, 1);
    } else {
        selected_tags.push(slug);
    }

    if (selected_tags.length > 0) {
        hasher.setHash('tag', selected_tags.join(','));
    } else {
        hasher.setHash('_');
    }

    return false;
};

var on_modal_tag_clicked = function() {
    back_to_top();
    return true;
};

/*
 * Clear the current tag
 */
var on_clear_tags_clicked = function() {
    hasher.setHash('_');

    return false;
};

/*
 * New tag hash url.
 */
var on_tag_hash = function(tags) {
    selected_tags = tags.split(',');
    filter_books();
};

/*
 * New book hash url and previous/next buttons.
 */
var on_book_hash = function(slug) {

    // Get rid of the old modal.
    // They smell so musty.
    $modal_content.empty();

    // Find this book from the list.
    book = _.find(BOOKS, function(book){
        return book['slug'] == slug;
    });

    // Set up a variable to represent this book in the grid.
    // It's null because we have TWO DIFFERENT GRIDS AAAAAAA.
    var grid_item;

    // This next/prev list is sorted two different ways.
    // The first way it can be sorted is for the grid view.
    // This time, we're checking for if the $books_grid is visible.
    if ($books_grid.is(':visible')) {

        // The grid item is an id of the book slug.
        grid_item = $('#' + book.slug);

        // Next and previous are based on hidden/not hidden isotope elements.
        next = grid_item.nextAll(':not(.isotope-hidden)').first();
        previous = grid_item.prevAll(':not(.isotope-hidden)').first();


        // And the buttons fetch the ID of the next element.
        if (next.length === 0) {
            next = null;
        } else {
            next = next.attr('id');
        }
        if (previous.length === 0) {
            previous = null;
        } else {
            previous = previous.attr('id');
        }

    } else {

        // The grid item in the second case is the anchor with the slug as it's class.
        grid_item = $('li.' + book.slug);

        // Next and previous are based whether these items are visible.
        next = grid_item.nextAll(':visible').first();
        previous = grid_item.prevAll(':visible').first();

        // And the buttons fetch the data-slug attribute of the next element.
        if (next.length === 0) {
            next = null;
        } else {
            next = next.attr('data-slug');
        }
        if (previous.length === 0) {
            previous = null;
        } else {
            previous = previous.attr('data-slug');
        }
    }

    // Now, go about our normal business of building the modal.
    $modal_content.append(JST.book_modal({
        book: book,
        next: next,
        previous: previous,
        SMALL_MOBILE: (SMALL && MOBILE)
    }));

    // Modals should be modaled whenever modalable.
    $modal.modal();

    // And hide the "back to the top" button.
    $back_to_top.hide();
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
        $modal.scrollTop(0); // #174.

        // On first load, we need to load in the books. #142
        if (first_hash) {
            filter_books();
        }
    } else {
        $modal.modal('hide');
        selected_tags = [];
        filter_books();
    }

    // Track _ the same as root
    if (new_hash == '_') {
        new_hash = '';
    }

    _gaq.push(['_trackPageview', location.pathname + '#' + new_hash]);

    first_hash = false;

    return false;
};

/*
 * Clear the hash when closing a book modal.
 */
var on_book_modal_closed = function() {
    if (selected_tags.length > 0) {
        hasher.setHash('tag', selected_tags.join(','));
    } else {
        /*
         * CEG: Don't set to empty string or it will turn into '#' which
         * will cause a scroll to top of page that we don't want when
         * closing the modal.
         */
        hasher.setHash('_');
    }

    return true;
};

// Never relayout the grid more than twice a second
var relayout = _.throttle(function() {
    $books_grid.isotope('reLayout');
}, 500);


/*
 * Begin unveiling visible books in the grid.
 */
var unveil_grid = function() {
    $books_grid.find('img').unveil(800, function() {
        //console.log('unveiling: ' + $(this).parent().parent().parent().attr('id'));
        //console.log('unveil');

        $(this).load(function() {
            relayout();
        });
    });
};

/*
 * Show and hide the filters on small screens
 */
var toggle_filter_modal = function() {
    $filter.toggleClass('hidden-xs').scrollTop(0);
};

/*
 * Toggle the text books list.
 */
var toggle_books_list = function() {
    $books_grid.toggle();
    $books_list.toggle();
    $show_text_button.toggle();
    $show_books_button.toggle();

    if ($books_grid.is(':visible')) {
        isotope_grid(); 
    }
};

$(function() {
    $body = $('body');
    $content = $('#content');
    $books_grid = $('#books-grid');
    $all_tags = $('.tags .tag');
    $clear_tags = $('.clear-tags');
    $current_tag = $('.current-tag');
    $modal = $('#myModal');
    $modal_content = $('#myModal .modal-content');
    $books_list = $('#books-list');
    $back_to_top = $('#back-to-top');
    $mobile_filters_btn = $('#mobile-filters');
    $filter = $('.filter.tags');
    $show_text_button = $('.show-text');
    $show_books_button = $('.show-books');
    $toggle_text = $('.toggle-text');


    _.each($all_tags, function(tag) {
        var $tag = $(tag);
        $tags[$tag.data('tag-slug')] = $tag;
    });

    // Event handlers.
    $body.on('click', '.filter .tag', on_tag_clicked);
    $content.on('click', '.back-to-top', back_to_top);
    $content.on('click', 'button.clear-tags', on_clear_tags_clicked);
    $modal.on('hidden.bs.modal', on_book_modal_closed);
    $modal.on('click', '.tag', on_modal_tag_clicked);
    $modal.keyup(function (e) {
        if ($('#myModal:visible').length > 0){
           if (e.which === 37 && previous !== null) {
            hasher.setHash('book', previous);
            } else if (e.which === 39 && next !== null) {
                hasher.setHash('book', next);
            }
        }
    });
    $back_to_top.on('click', back_to_top);
    $back_to_top.hide();
    $mobile_filters_btn.on('click', toggle_filter_modal);
    $filter.find('.close-modal').on('click', toggle_filter_modal);
    $toggle_text.on('click', toggle_books_list);

    $(window).on('scroll', function() {
        var y_scroll_pos = window.pageYOffset;

        var scroll_pos_test = 1000;

        if(y_scroll_pos > scroll_pos_test && $('#myModal:visible').length === 0) {
            $back_to_top.fadeIn(1000);
        } else {
            $back_to_top.fadeOut(1000);
        }

    });

    $current_tag.find('#showing-span').text('Showing all books');
    $current_tag.show();

    // Disable isotope transitions
    if (MOBILE) {
        $books_grid.addClass('no-transition');
    }

    $show_books_button.hide();

    // Set up the hasher bits to grab the URL hash.
    hasher.changed.add(on_hash_changed);
    hasher.initialized.add(on_hash_changed);
    hasher.init();

    _.delay(unveil_grid, 1000);
});
