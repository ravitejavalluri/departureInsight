;var app = (function ($, undefined) {

	var $grid = $('#GridView1'),
		data  = [];

	_getData = function (url) {
		return $.ajax({
			url: url,
			dataType: 'html'
		});
	};
	
	_processTrainData = function (html) {
		var $grid    = $(html).find('#GridView1'),
			cols     = ['depart', 'to', 'track', 'line', 'train', 'status'],
			deferred = [];
			
		$grid.find('tr[style]').each( function (index, element) {
			var $row = $(this),
				obj  = {};
						
			if ( index == 0 || $row.find('td').length !== 6 ) return;
			
			obj['stopsUrl'] = '' + $row.closest('a').attr('href');

			$row.find('td').each( function (index, element) {
				obj[ cols[index] ] = $.trim( $(element).text() );
			});
			
			obj['stopsUrl'] = 'http://dv.njtransit.com/mobile/train_stops.aspx?sid=NP&train=' + obj['train'];
			
			data.push( obj );
			
			deferred.push( _getData( obj['stopsUrl'] ).then( _processStopsData( obj, data ) ) );
		});		
		
		return $.when.apply( $, deferred );
		
	};
	
	_processStopsData = function (obj, data) {
	
		var defer = $.Deferred();
		
		return function (html) {
			var $grid = $(html).find('#table_stops');
				stops = [];
				
			$grid.find('td').each( function (index, element) {
				var text  = $.trim( $(this).find('p').text() ),
					parts = $.map( text.split(/\bat\b/), function (val) { return $.trim( val ); } );
					
				stops.push({ location: parts[0], arrival: parts[1] });
			});
			
			obj['stops'] = stops;
			
			return defer.resolve();
		};
	};
	
	_display = function () {
	
		var data = _filter();
		
		var tmpl = Handlebars.compile( $('#trains-tmpl').html() );

		$('#trains')
			.find('tbody')
			.empty()
			.append( tmpl( {trains: data} ) )
			.find('tr')
				.each( function (index) {
					$.data( this, 'stops', data[index]['stops'] );
				});
		
		$('#trains').on('click', 'tr', _onClickTrainRow);
		
	};
	
	_onClickTrainRow = function (evt) {		
		var thisRow = this,
			tmpl    = Handlebars.compile( $('#stops-tmpl').html() );
				
		$('#stops')
			.find('tbody')
			.empty()
			.append( tmpl( {stops: $.data( thisRow, 'stops')} ) );
	};
	
	_filter = function () {
	
		var subset = [];
		
		$.each( data, function (index, train) {
		
			$.each( train['stops'], function ( index, stop ) {
				if ( train['line'] === 'Northeast Corrdr' && stop['location'].toLowerCase().indexOf('metropark') != -1 ) {
					subset.push( train );
					return false;
				}
			});
			
		});
				
		return subset;
	};
	
	init = function () {
		_getData('http://dv.njtransit.com/mobile/tid-mobile.aspx?sid=NP').then( _processTrainData ).then( _display );
	};
	
	return {
		init: init
	};


})( window.jQuery );