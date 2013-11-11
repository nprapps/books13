$(function() {
    var $books_grid_class = $('#books-grid');
    filters = {};

    function setup_isotope(){
    	$books_grid_class.imagesLoaded( function(){
			$books_grid_class.isotope({
		        itemSelector : '.isotope-item',
				resizable: false, // disable normal resizing
				// masonry: { columnWidth: $books_grid_class.width() / 3 }
				masonryHorizontal: {
				    rowHeight: 360
				}
		    });
		});
    }

    
    setup_isotope();

    $("img").unveil(1200, function() {
		$(this).load(function() {
			$books_grid_class.isotope('reLayout');
		});
	});

    // update columnWidth on window resize
	$(window).smartresize(function(){
	    setup_isotope();
	});

    // when everything loads, make the "all" options selected
    $('.filter button[data-filter-value=""]').addClass('selected');

    // filter buttons
    $('.filter button').click(
    function(e){
        e.preventDefault();
        var clicked_filter = $(this);

        // if the clicked link is already selected, don't do anything
        if ( clicked_filter.hasClass('selected') ) {
            return;
        }

        var optionSet = clicked_filter.parents('.option-set');

        // get rid of the ".selected" class on any links in this group and put it on the clicked link
        optionSet.find('.selected').removeClass('selected');
        clicked_filter.addClass('selected');

        // store the filters in the filters object, indexed by the group they're in
        // i.e. filters.category = 'animal'
        var group = optionSet.attr('data-filter-group');
        filters[ group ] = clicked_filter.attr('data-filter-value');

        // convert the filters object into an array of strings which are CSS class selectors
        var filters_to_use = [];
        for ( var group in filters ) {
             filters_to_use.push( filters[ group ] );
        }

        // smash the array together to get a big selector which will filter all elements with the filter classes
        var selector = filters_to_use.join('');

        $(selector).find('img').trigger("unveil");

        // run the filter on the isotope element
        $books_grid_class.isotope({ filter: selector });
    }
  );
});