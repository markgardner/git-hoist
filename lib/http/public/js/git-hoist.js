(function() {
	var SECOND = 1000,
		MINUTE = 60 * SECOND,
		HOUR = 60 * MINUTE,
		DAY = 24 * HOUR,
		WEEK = 7 * DAY,
		YEAR = DAY * 365,
		MONTH = YEAR / 12,
		timeRelativeFormats = [
			[ 0.7 * MINUTE, 'just now' ],
			[ 1.5 * MINUTE, 'a minute ago' ],
			[ 60 * MINUTE, 'minutes ago', MINUTE ],
			[ 1.5 * HOUR, 'an hour ago' ],
			[ DAY, 'hours ago', HOUR ],
			[ 2 * DAY, 'yesterday' ],
			[ 7 * DAY, 'days ago', DAY ],
			[ 1.5 * WEEK, 'a week ago'],
			[ MONTH, 'weeks ago', WEEK ],
			[ 1.5 * MONTH, 'a month ago' ],
			[ YEAR, 'months ago', MONTH ],
			[ 1.5 * YEAR, 'a year ago' ],
			[ Number.MAX_VALUE, 'years ago', YEAR ]
		],
		now = +new Date;


	$('time.js-time').each(function() {
		var $me = $(this),
			delta = now - Date.parse($me.attr('datetime')),
			format, i = 0, len = timeRelativeFormats.length,
			time;

		for(; i++ < len;) {
			format = timeRelativeFormats[i];

			if(delta < format[0]) {
				time = !format[2] ? format[1] : Math.round(delta/format[2]) + ' ' + format[1];
				break;
			}
		}

		$(this).html(time);
	});

	$('.clone-selector button').click(function() {
		var $me = $(this),
			$container = $me.closest('.clone-selector');

		$container.find('button.active').removeClass('active')
		$container.find('input').val($me.attr('data-path'));
		$me.addClass('active');
	});

	$('.clone-selector input').click(function() {
		$(this).select();
	})

	$('.clone-selector button.active').click();

	var $openBtn;
	$('body').on('click', '.btn-group button', function(e) {
		$openBtn = $(this).parent().toggleClass('open');

		return false;
	}).click('click', function() {
		if($openBtn) {
			$openBtn.removeClass('open');
		}
	});
}());