var express = require('express');
var router = express.Router();
var pdf = require('html-pdf');
var fs = require('fs');
var options = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));

router.get('/:id', function(req, res, next) {
	var data = {
		deliveryid: "delivery.deliveryid",
		recipientclientid: "delivery.recipientclientid",
		recipientname: "delivery.recipientname",
		recipientemail: "delivery@recipientemail" || 'N/A',
		recipientphone: "delivery.recipientphone",
		deliveryaddress: "delivery.deliveryaddress"
	}
  res.render('layout', {data}, function(err, html){
		pdf.create(html, options).toStream(function(err, stream){
			stream.pipe(res);
		});  	
	});
	// res.render('layout', {data});
});

module.exports = router;