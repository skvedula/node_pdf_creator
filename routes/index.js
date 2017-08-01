var express = require('express');
var router = express.Router();
var pdf = require('html-pdf');
var fs = require('fs');
var options = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));
var mongoose = require('mongoose');
mongoose.connect('mongodb://skvedula:14mongodb@ds129593.mlab.com:29593/findacargo');

var PoSchema = mongoose.Schema({
	"COUNTRY CODE": {
		type: String,
	},
	"AREA": {
		type: String
	},
	"ZONE": {
		type: Number
	},
	"ZIP": {
		type: Number
	},
	"CITY": {
		type: String
	},
	"STREET": {
		type: String
	},
	"": {
		type: String
	},
	"Land": {
		type: String
	}
});

var PostCodeObj = mongoose.model('post_code', PoSchema)

router.get('/:id', function(req, res, next) {
	var data = {
		deliveryid: "delivery.deliveryid",
		recipientclientid: "delivery.recipientclientid",
		recipientname: "delivery.recipientname",
		recipientemail: "delivery@recipientemail" || 'N/A',
		recipientphone: "delivery.recipientphone",
		deliveryaddress: "delivery.deliveryaddress"
	}

	PostCodeObj.find({"ZIP": 100}, function(err, resp){
		console.log(resp[0].AREA, resp[0].ZONE);
		data["area"] = resp[0].AREA;
		data["zone"] = resp[0].ZONE;
		res.render('layout', {data}, function(err, html){
			pdf.create(html, options).toStream(function(err, stream){
				stream.pipe(res);
			});  	
		});
	});


	// res.render('layout', {data});
});

module.exports = router;