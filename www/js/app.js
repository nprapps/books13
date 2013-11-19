var MOBILE = Modernizr.touch;
var SMALL = Modernizr.mq('only all and (max-width: 480px)');

var $body;
var $content;
var $books_grid;
var $tags;
var $all_tags;
var $clear_tags;
var $current_tag;
var $modal;
var $modal_content;
var $print_books;
var $back_to_top;
var $mobile_filters_btn;
var $filter;

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
    scroll_to($content, 0);

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

        for (i in selected_tags) {
            var slug = selected_tags[i];
            var $tag = $all_tags.filter('.tag[data-tag-slug="' + slug + '"]');

            $tag.addClass('selected');
            $tag.parent().addClass('selected');
            filter += '.tag-' + slug;
            label.push(COPY.tags[slug]);
        }

        label = label.join(', ');

        filter_print_books(filter);
        isotope_grid(filter);
        $clear_tags.show();
        $current_tag.find('span').text(label);
        $current_tag.show();

        // Hide tags with no books left in them
        for (slug in COPY.tags) {
            if (selected_tags.indexOf(slug) >= 0) {
                continue;
            }

            if ($books_grid.find('.tag-' + slug + ':not(.isotope-hidden)').length == 0) {
                var $tag = $all_tags.filter('.tag[data-tag-slug="' + slug + '"]');
                $tag.parent().addClass('unavailable');
                $tag.addClass('unavailable');
            }
        }
    } else {
        filter_print_books(null);
        isotope_grid('*');
        $clear_tags.hide();
        $current_tag.hide();
    }

    // NB: Force scroll event so that unveils will happen auto-magically
    // We wait a moment first so the grid has animated in
    _.delay(function() {
        $(window).trigger('scroll');
    }, 1000);
};

/*
 * Filter the print-friendly book list.
 */
var filter_print_books = function(filter) {
    // Don't bother with print-friendly on mobile
    if (MOBILE) {
        return;
    }

    if (filter) {
        $print_books.find('.print-book').removeClass('visible');

        var filter = '';

        for (var i in selected_tags) {
            var slug = selected_tags[i];
            filter += '.tag-' + slug;
        }

        $print_books.find(filter).addClass('visible');
    } else {
        $print_books.find('.print-book').addClass('visible');
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
    $modal_content.empty();

    book = _.find(BOOKS, function(book){
        return book['slug'] == slug;
    });

    var grid_item = $('#' + book.slug);
    next = grid_item.nextAll(':not(.isotope-hidden)').first();

    if (next.length === 0) {
        next = null;
    } else {
        next = next.attr('id');
    }

    previous = grid_item.prevAll(':not(.isotope-hidden)').first();

    if (previous.length === 0) {
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
        back_to_top(); // #174.

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
    console.log($filter);
    $filter.toggleClass('hidden-xs').scrollTop(0);
 };

$(function() {
    $body = $('body');
    $content = $('#content');
    $tags = $('.tags');
    $books_grid = $('#books-grid');
    $clear_tags = $('.clear-tags');
    $current_tag = $('.current-tag');
    $modal = $('#myModal');
    $modal_content = $('#myModal .modal-content');
    $print_books = $('.print-friendly ul');
    $back_to_top = $('#back-to-top');
    $mobile_filters_btn = $('#mobile-filters');
    $filter = $('.filter.tags');

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

    $(window).on('scroll', function() {
        var y_scroll_pos = window.pageYOffset;
        var scroll_pos_test = 500;

        if(y_scroll_pos > scroll_pos_test && $('#myModal:visible').length === 0) {
            $back_to_top.fadeIn(1000);
        } else {
            $back_to_top.fadeOut(1000);
        }

    });

    $all_tags = $('.tags .tag');

    // Set up the hasher bits to grab the URL hash.
    hasher.changed.add(on_hash_changed);
    hasher.initialized.add(on_hash_changed);
    hasher.init();

    _.delay(unveil_grid, 1000);
});
