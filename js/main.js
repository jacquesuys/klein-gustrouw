/* 
    Object.create support test, and fallback for browsers without it
    Might want to make this a JS part for IE 
*/

if (typeof Object.create !== 'function') {
    Object.create = function(o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function() {},
            fBound = function() {
                return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}

var Slider = function() {
    this.options = {
        startingPos: 0
    };
};

$.extend(Slider.prototype, {
    init: function(slider, options) {
        // selector references
        this.slider = slider;
        this.$slider = $(slider);
        // counter
        this.counter = this.options.startingPos;
        this.$slideCount = this.$slider.find('li').length;
        // update existing options
        this.options = $.extend({}, this.options, options);
        // call build function
        this._build();

        if (Modernizr.csstransforms3d || Modernizr.csstransforms) {

            new Hammer(this.slider, {
                drag_lock_to_axis: true,
            }).on("dragleft dragright release", function(ev) {

                ev.gesture.preventDefault();

                switch (ev.type) {
                    case 'dragleft':
                    case 'dragright':
                        this.advanceSlider(ev.gesture.deltaX / 10 + (this.counter * -100), false);
                        break;
                    case 'release':
                        if (Math.abs(ev.gesture.deltaX) > this.$slider.width() * 0.3) {
                            if (ev.gesture.direction == 'right') {
                                this.prev();
                            } else {
                                this.next();
                            }
                        } else {
                            this.advanceSlider(this.counter * -100, undefined, true);
                        }
                        break;
                }
                // bind is for scoping rules
            }.bind(this));

            // init for IE 8
            if (!(Modernizr.csstransforms3d || Modernizr.csstransforms)) {
                this.incaseIE();
            }
        }
    },
    _build: function() {
        this.$slider
            .wrapInner('<div class="slider-container"></div>')
            .append('<a href="#" class="prev"><i class="fa fa-chevron-left"></i></a><a href="#" class="next"><i class="fa fa-chevron-right"></i></a><div class="counters"></div>');

        var $prev = $('.prev'),
            $next = $('.next'),
            $that = this;

        // cant use bind on these because of IE8, hence "$that"
        $prev.on('click', function(e) {
            e.preventDefault();
            $that.prev();
        });

        $next.on('click', function(e) {
            e.preventDefault();
            $that.next();
        });

        this.$slider.find('li').each(function(i) {
            var $html = "<span>" + (i + 1) + '</span>';
            $('.counters').append($html);
        });

        this.$slider.find('.counters span').removeClass('active').eq(this.counter).addClass('active');

        this.$slider.find('.counters').on('tap', 'span', function() {
            var $index = $(this).index(),
                $offset = $index * -100;

            $that.advanceSlider($offset, undefined, true);

            $that.$slider.find('.counters span').removeClass('active').eq($index).addClass('active');
        });
    },
    incaseIE: function() {
        // IE8 fallbacks
        var $sliderWidth = this.$slider.width(),
            $sliderHeight = this.$slider.height(),
            $track = this.$slider.find('.slider-container ul');

        if (!(Modernizr.csstransforms3d || Modernizr.csstransforms)) {
            $('.slider-container, .slider ul li').css({
                width: $sliderWidth + 'px',
                height: $sliderHeight + 'px'
            });

            $track.css({
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'z-index': 2
            });
        }
    },
    advanceSlider: function(offset, counter, animate) {
        var $track = this.$slider.find('.slider-container ul'),
            $sliderWidth = this.$slider.width();

        $track.removeClass("animate");

        if (animate) {
            $track.addClass("animate");
        }

        if (Modernizr.csstransforms3d) {
            $track.css("transform", "translate3d(" + offset + "%,0,0) scale3d(1,1,1)");
        } else if (Modernizr.csstransforms) {
            $track.css("transform", "translate(" + offset + "%,0)");
        } else {
            $track.css({
                left: -($sliderWidth * this.counter) + 'px'
            });
        }

        // add active class for animation on second slide

        if (this.counter >= 1) {
            this.$slider.find('li').removeClass('active').eq(1).addClass('active');
        } else {
            this.$slider.find('li').removeClass('active');
        }


        this.$slider.find('.counters span').removeClass('active').eq(this.counter).addClass('active');
    },
    prev: function() {
        if (this.counter > 0) {
            --this.counter;
        }
        var $offset = this.counter * -100;
        this.advanceSlider($offset, this.counter, true);
    },
    next: function() {
        var $slideCount = this.$slider.find('li').length;
        if (this.counter < $slideCount - 1) {
            ++this.counter;
        }
        var $offset = this.counter * -100;
        this.advanceSlider($offset, this.counter, true);
    }
});

// declare the slider plugin
$.fn.slider = function(options) {
    var len = this.length;
    return this.each(function(i) {
        var element = $(this),
            key = 'slider' + (len > 1 ? '-' + (++i) : ''),
            slider = (new Slider).init(this);
        element.data(key, slider).data('key', key);
    });
};

(function($) {
    var $theIndex = $('nav').find('.active').index();

    // js for moobile
    function mobileMenu() {
        if (screen.width <= 384) {
            $('nav').hide();
        } else {
            $('nav').show();
        }
    }

    $(window).on('load resize', mobileMenu);

    $('#menu').on('click', function(e) {
        e.preventDefault();
        $('nav').slideToggle(300);
    });

    // js for desktop
    $('nav a').on({
        mouseenter: function() {
            $('nav a').removeClass('active');
            $(this).addClass('active');
        },
        mouseleave: function() {
            $('nav a').removeClass('active')
                .eq($theIndex).addClass('active');
        }
    });

})(jQuery)
/*
     FILE ARCHIVED ON 09:02:16 Oct 02, 2017 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 16:52:38 Feb 01, 2020.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  LoadShardBlock: 202.951 (3)
  captures_list: 221.36
  exclusion.robots: 0.18
  esindex: 0.017
  RedisCDXSource: 2.029
  CDXLines.iter: 12.897 (3)
  PetaboxLoader3.resolve: 231.717 (3)
  load_resource: 129.385
  exclusion.robots.policy: 0.165
  PetaboxLoader3.datanode: 82.752 (4)
*/