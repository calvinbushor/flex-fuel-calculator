var check = require('validator').check;

function flexFuelCalculator() {}

flexFuelCalculator.prototype.val

flexFuelCalculator.prototype.validate = function() {
	var that, methods;

	that    = this;
	methods = {};

	function fieldIsEmpty(field, data) {
		var empty;

		try {
			check(data[field], 'Field {' + field + '} cannot be empty.').notEmpty();
			empty = false;
		} catch (e) {
			empty = true;
		}

		return empty;
	}

	methods.notEmpty = function(required, data) {
		var valid;

		if ( undefined === required ) throw new Error('Var {required} cannot be undefined.');
		if ( undefined === data ) throw new Error('Var {data} cannot be undefined.');

		valid = true;

		required.forEach(function(field) {
			if ( fieldIsEmpty(field, data) ) {
				valid = false;
			}
		});

		return valid;
	}

	return methods;
}

flexFuelCalculator.prototype.calculate = function(body, callback) {
	var that, data, required, err;

	if ( undefined === body ) throw new Error('Var {body} is required.');
	if ( undefined === callback ) throw new Error('Var {callback} is required.');

	that 	 = this;
	required = ['mpge', 'mpge', 'pricee', 'priceg'];	

	if ( !that.validate().notEmpty(required, body) ) {
		err = {
			message: 'Not all required fields were provided.',
			required: required,
			code:     400
		};

		callback(err, null);
		return;
	}

	that = this;
	data = {
		inputs: {
			mpge: 	undefined,
			mpgg:   undefined,
			pricee: undefined,
			priceg: undefined
		},
		e85: {
			cpm: undefined,
			mpd: undefined
		},
		gas: {
			cpm: undefined,
			mpd: undefined
		},
		winner: undefined,
		savings: {
			money: undefined,
			miles: undefined,
			tank:  undefined
		}
	};

	data['inputs']['mpge']   = body['mpge'];
	data['inputs']['mpgg']   = body['mpgg'];
	data['inputs']['pricee'] = body['pricee'];
	data['inputs']['priceg'] = body['priceg'];

	data['e85']['cpm'] = that.get().costPerMile(body['mpge'], body['pricee']);
	data['e85']['mpd'] = that.get().milesPerDollar(body['mpge'], body['pricee']);

	data['gas']['cpm'] = that.get().costPerMile(body['mpgg'], body['priceg']);
	data['gas']['mpd'] = that.get().milesPerDollar(body['mpgg'], body['priceg']);

	data['winner'] = that.get().winner(data['e85'], data['gas']);
	data['savings']['money'] = that.get().savings(data['e85']['cpm'], data['gas']['cpm']);
	data['savings']['miles'] = that.get().savings(data['e85']['mpd'], data['gas']['mpd']);

	if ( undefined !== body['tank'] ) {
		data['savings']['tank']  = that.get().savingsPerTank(data['savings']['money'], body['tank']);	
	}	

	callback(null, data);
}

flexFuelCalculator.prototype.get = function() {
	var that, methods;

	that    = this;
	methods = {};

	methods.costPerMile = function(mpg, price) {
		var cost;

		cost = (price / mpg).toFixed(3);

		return cost;
	}

	methods.milesPerDollar = function(mpg, price) {
		return (mpg / price).toFixed(3);;
	}

	methods.savings = function(a, b) {
		if ( a >= b ) {
			return (a - b).toFixed(3);
		}

		return (b - a).toFixed(3);
	}

	methods.savingsPerTank = function(savings, tank) {
		return (savings * tank).toFixed(3);;
	}

	methods.winner = function(e85, gas) {
		if ( e85['cpm'] > gas['cpm'] && e85['mpd'] < gas['mpd'] ) {
			return 'gas';
		} else if ( e85['cpm'] < gas['cpm'] && e85['mpd'] > gas['mpd'] ) {
			return 'e85';
		} else if ( e85['cpm'] < gas['cpm'] && e85['mpd'] < gas['mpd'] ) {
			return 'less but more';
		} else if ( e85['cpm'] > gas['cpm'] && e85['mpd'] > gas['mpd'] ) {
			return 'more but less';
		} else {
			return 'tie';
		}
	}

	return methods;
}

module.exports = new flexFuelCalculator();