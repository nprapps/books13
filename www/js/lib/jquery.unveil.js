/**
 * jQuery Unveil
 * A very lightweight jQuery plugin to lazy load images
 * http://luis-almeida.github.com/unveil
 *
 * Licensed under the MIT license.
 * Copyright 2013 Luís Almeida
 * https://github.com/luis-almeida
 */

;(function($) {

  $.fn.unveil = function(threshold, callback) {

    var $w = $(window),
        th = threshold || 0,
        retina = window.devicePixelRatio > 1,
        attrib = retina? "data-src-retina" : "data-src",
        images = this,
        loaded;

    this.one("unveil", function() {
      var source = this.getAttribute(attrib);
      source = source || this.getAttribute("data-src");
      if (source) {
        this.setAttribute("src", source);
        if (typeof callback === "function") callback.call(this);
      }
    });

    function unveil() {
        console.log('unveil()');
          var inview = images.filter(function() {
            var $e = $(this);
            if ($e.is(":hidden")) return;

            var wt = $w.scrollTop(),
                wb = wt + $w.height(),
                et = $e.offset().top,
                eb = et + $e.height();

            return eb >= wt - th && et <= wb + th;
          });

          loaded = inview.trigger("unveil");
          images = images.not(loaded);
    }

    /*
     * CEG: Hacked to throttle checking image location 
     * so that images don't get unveiled while isotope is rearranging.
     */
    var unveil_slow = _.throttle(unveil, 500, { leading: false });

    $w.scroll(unveil_slow);
    $w.resize(unveil_slow);

    unveil_slow();

    return this;

  };

})(window.jQuery || window.Zepto);
