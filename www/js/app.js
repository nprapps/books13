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
var $adwrapper;

var next;
var previous;
var selected_tags = [];
var skip_scroll = false;
var first_hash = true;
var isotope_loaded = false;

/*
 * Scroll to a given element.
 */
var scroll = function($el) {
    var top = $el.offset().top;

    $body.scrollTop(top);
};

/*
 * Jump back to the top of the page.
 */
var back_to_top = function() {
    scroll($body, 0);

    return false;
};

/*
 * Enable or reapply isotope to the grid.
 */
var isotope_grid = function(filter) {
    if ($adwrapper) {
        // A bit of a hack, we use the visible printer-friendly books
        // to determine where to put the ad in the grid
        var $visible_books = $print_books.find('.print-book.visible');
        var i = Math.min($visible_books.length - 1, 2);
        var $that_book = $visible_books.eq(i);
        var ad_sort = parseInt($that_book.data('sort')) + 1; 

        $adwrapper.data('sort', ad_sort);

        // NB: Trying to do this before isotope renders the first time is an error
        if (isotope_loaded) {
            $books_grid.isotope('updateSortData', $books_grid.find('.isotope-item'));
        }

        // Never filter out ad
        filter += ',.adwrapper';
    }

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

    isotope_loaded = true;
}

/*
 * Show/hide books in the grid.
 */
var filter_books = function() {
    $all_tags.removeClass('selected unavailable');

    if (selected_tags.length > 0) {
        var filter = '';
        var label = [];

        for (i in selected_tags) {
            var slug = selected_tags[i];
            var $tag = $('.tags .tag[data-tag-slug="' + slug + '"]');
        
            $tag.addClass('selected');
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

            if ($('.book.tag-' + slug + ':visible').length == 0) {
                var $tag = $('.tags .tag[data-tag-slug="' + slug + '"]');
                $tag.addClass('unavailable');
            }
        }
    } else {
        filter_print_books(null);
        isotope_grid('*');
        $clear_tags.hide();
        $current_tag.hide();
    }
};

/*
 * Filter the print-friendly book list.
 */
var filter_print_books = function(filter) {
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
}

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
        hasher.setHash();
    }

    return false;
};

/*
 * Clear the current tag
 */
var on_clear_tags_clicked = function() {
    hasher.setHash();

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

    if (next.length == 0) {
        next = null;
    } else {
        next = next.attr('id');
    }

    previous = grid_item.prevAll(':not(.isotope-hidden)').first();

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

        if (!skip_scroll) {
            back_to_top();
        }
        
        skip_scroll = false;
    } else if (hash_type == 'book') {
        on_book_hash(hash_slug);

        // On first load, we need to load in the books. #142
        if (first_hash) {
            filter_books();

            first_hash = false;
        }
    } else {
        $modal.modal('hide');
        selected_tags = [];

        if (!skip_scroll) {
            filter_books();
        }

        skip_scroll = false;
    }

    // Track _ the same as root
    if (new_hash == '_') {
        new_hash = '';
    }

    _gaq.push(['_trackPageview', location.pathname + '#' + new_hash]);

    return false;
};

/*
 * Clear the hash when closing a book modal.
 */
var on_book_modal_closed = function() {
    skip_scroll = true;

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
  
    // Event handlers.
    $body.on('click', '.tag', on_tag_clicked);
    $content.on('click', '.back-to-top', back_to_top);
    $content.on('click', 'button.clear-tags', on_clear_tags_clicked);
    $modal.on('hidden.bs.modal', on_book_modal_closed);
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
    $(window).on('scroll', function() {
        var y_scroll_pos = window.pageYOffset;
        var scroll_pos_test = 500;

        if(y_scroll_pos > scroll_pos_test && $('#myModal:visible').length === 0) {
            $back_to_top.fadeIn(1000);
        } else {
            $back_to_top.fadeOut(1000);
        } 

    });

    for (var i = 0; i < BOOKS.length; i++) {
        if (BOOKS[i].text.length == 0) {
            BOOKS[i].teaser = '';
            continue;
        }

        var j = 200;

        while (BOOKS[i].text[j] != ' ') {
            j--;
        }

        BOOKS[i].teaser = '&#8220;' + BOOKS[i].text.substring(0, j) + '...&#8221;';
    }

    // Render the book grid
    $books_grid.html(JST.book_grid({
        books: BOOKS,
        book_card: JST.book_card
    }));

    if (!SMALL) {
        $books_grid.append(JST.grid_ad({
            sort: '3'  
        }));
    
        $adwrapper = $('.adwrapper');
    }
    
    $all_tags = $('.tags .tag');

    // Never relayout the grid more than twice a second
    // And never the first time its called since it won't be
    // loaded anyway
    var relayout = _.throttle(function() {
        $books_grid.isotope('reLayout');
    }, 500);
    
    $books_grid.find('img').unveil(1200, function() {
        //console.log('unveiling: ' + $(this).parent().parent().parent().attr('id'));
        //console.log('unveil');

        $(this).load(function() {
            relayout(); 
        });
    });
    
    // Set up the hasher bits to grab the URL hash.
    hasher.changed.add(on_hash_changed);
    hasher.initialized.add(on_hash_changed);
    hasher.init();
});
