var AM = require('./modules/account-manager');
var CT = require('./modules/country-list');
var RT = require('./modules/road-type');
var ST = require('./modules/sea-type');
var CM = require('./modules/contacts_model');
var ED = require('./modules/email-dispatcher');
var validator = require("email-validator");
var mailgun = require('./modules/mailgun_api');
var os = require('os');
var async = require('async');
var ifaces = os.networkInterfaces();
var fs = require('fs');
var express = require('express');
var router = express.Router();
var formidable = require('formidable'),
    http = require('http'),
    util = require('util');
var multipart = require('multiparty');
var bodyParser = require('body-parser');
var initials = require('initials');
var Mixpanel = require('mixpanel');
var json2csv = require('json2csv');
//var jsoncsv = require('nice-json2csv');
//var upload = multer({dest: '/root/Backup/uploads/'});
var path = require('path');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var Amplitude = require('amplitude');
var jwt = require('jsonwebtoken');
var ua = require('universal-analytics');
var visitor = ua('UA-71899001-2');
var maxmind = require('maxmind');
var getIP = require('ipware')().get_ip;
var schedule = require('node-schedule');
var Pusher = require('pusher');
var _ = require('lodash');
var mime = require('mime');
var enumConstant = require('../routes/Constant/enum');
var distance = require('google-distance');
var moment = require('moment');
var helperUtil = require('../routes/Utils/helperUtil');
//var request = require("request");
//var querystring = require('querystring');
////var http = require('http');
////var fs = require('fs');
//var needle = require('needle');
var json2xls = require('json2xls');

var contact_data_empty = {
    name: '',
    company: '',
    email: '',
    phone: ''
};

var pusher = new Pusher({
    appId: '164333',
    key: 'ed1edc67bfc5a99939f1',
    secret: 'f135461e63c742cebfec',
    cluster: 'mt1',
    encrypted: true
});

//pusher.trigger('test_channel', 'my_evenHt', {"message": "hello world"});

//const tracker_id = '1136afdd5cdaef9859615cb1d549b589';
const tracker_id = 'c60d1985c2948cc20de631c1e59a579e';
//var mixpanel = Mixpanel.init('39d0bbc94e6d6a46185436ae8e5112a9');//Production Key
var mixpanel = Mixpanel.init('35b08bf5d7f756c6462e052b48eb22df'); //Dev Key


/* GET home page. */
router.get('/gd', function(req, res, next) {

    AM.getLoadsM({ userID: req.param('id'), sdate: req.param('date') }, function(e, o) {
        if (o) {
            if (o.length < 1) {
                var result = "{'status':'no-deliveries'}";
                result = result.replace(/\'/g, '"');
                res.status(200).send(result);
            } else {

                res.status(200).send(o)
            }
        } else {
            var result = "{'status':'details-not-found'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        }
    });


});


//router.get('/dltall', function(req,res){


//AM.delAllRecords({},function(e,o){

//});

//});

router.post('/login', function(req, res) {

    console.log(req.param('email').toLowerCase());

    AM.manualLoginM(req.param('email'), req.param('pass'), function(e, o) {
        if (e) {
            var result = "{'status':'" + e + "'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        } else {
            var result = "{'status':'success','data':" + o + "}";
            result = result.replace(/\'/g, '"');

            res.status(200).send(result);
        }
    });
});

router.post('/ca', function(req, res) {

    //  buyer         :  req.param('buyer'),
    //  freightForwarder            :  req.param('ff'),
    //  carrier   :  req.param('carrier'),

    AM.addNewAccountM({
        name: req.param('name'),
        email: req.param('email'),
        ccode: req.param('ccode'),
        phone: req.param('mbl'),
        category: req.param('cat'),
        buyer: '0',
        freightForwarder: '0',
        carrier: '1',
        pass: req.param('pass'),
        shortName: initials(req.param('name')),
        imagePath: '',
        facebookRegistration: '0',
        manager: '0',
        approved: '0'
    }, function(e, o) {
        if (e) {
            console.log(e);
            var result = "{'status':'" + e + "'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        } else {
            var result = "{'status':'success','data':" + o + "}";
            result = result.replace(/\'/g, '"');

            res.status(200).send(result);
        }
    });
});
router.post('/ca/v0.0.1/', function(req, res) {



    AM.addNewAccountM({
        name: req.param('name'),
        email: req.param('email'),
        ccode: req.param('country'),
        phone: req.param('mbl'),
        category: '3',
        buyer: req.param('buyer'),
        freightForwarder: req.param('ff'),
        carrier: req.param('transporter'),
        pass: req.param('pass'),
        shortName: initials(req.param('name')),
        imagePath: '',
        facebookRegistration: '0',
        manager: '0',
        approved: '0'


    }, function(e, o) {
        if (e) {
            console.log(e);
            var result = "{'status':'" + e + "'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        } else {
            var result = "{'status':'success','data':" + o + "}";
            result = result.replace(/\'/g, '"');

            res.status(200).send(result);
        }
    });
});
router.post('/onboarding/select-type', function(req, res) {

    AM.createTruck({
        identifier: req.param('identifier'),
        vehicalType: req.param('vType'),
        type: req.param('type'),
        allowCargo: [].concat(req.param('acargo')),
        userID: new require('mongodb').ObjectID(req.param('id'))
    }, function(e, o) {

        if (e) {
            console.log(e);
            var result = "{'status':'failed'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        } else {
            console.log(o);
            var result = "{'status':'success'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);

        }
    });

});

router.post('/onboarding/select-vehicle', function(req, res) {

    AM.userAddressM({
        address: req.param('add'),
        userID: new require('mongodb').ObjectID(req.param('id'))
    }, function(e, o) {
        if (e) {
            console.log(o);
            var result = "{'status':'failed'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        } else {
            var result = "{'status':'success'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        }
    });

});

router.get('/caw', function(req, res) {

    res.redirect('/signup');

});

router.post('/caw', function(req, res) {
    console.log(req.param('cat'));

    AM.addNewAccount({
        name: req.param('name'),
        email: req.param('email'),
        ccode: req.param('country'),
        phone: req.param('mbl'),
        category: req.param('cat'),
        buyer: '0',
        freightForwarder: '0',
        carrier: '0',
        pass: req.param('pass')


    }, function(e, o) {
        if (e) {
            var result = "{'status':'" + e + "'}";
            result = result.replace(/\'/g, '"');
            res.render('signup', { status: 'failed', countries: CT, error: e });
        } else {
            var result = "{'status':'success'}";
            result = result.replace(/\'/g, '"');
            req.session.user = o;
            if (req.session.user == null && req.session.user == undefined) {
                res.render('signin', { error: '' });
            } else {

                if (req.session.category == 0) {
                    //                  res.render('Buyer',{title:'Buyer : Nemlevering', page:'/buyer', go:'Buyer', user:req.session.user, kind:'Buyer'});
                    //                  res.redirect('/buyer');

                    res.render('buyer', { udata: req.session.user });
                } else {
                    //                  res.render('driver',{title:'Driver : Nemlevering', user:req.session.user, loadData:o});
                    res.render('driver', { udata: req.session.user });
                }

            }
        }
    });
});

//router.get('/signup', function(req, res)
//{
//res.render('signup',{countries:CT,status:'',error:''});
//}
//);

// router.get('/cawm', function(req, res){
//
//  if(req.session.user!=null && req.session.user!=undefined)
//  {
//      res.redirect('/');
//  }
//  else
//  {
//      res.render('signup-multi',{udata:req.session.user,countries:CT,status:'',error:''});
//  }
//
// });

router.post('/cawm', function(req, res) {

    if (validator.validate(req.param('email'))) {

        var code = CT.filter(function(item) {
            return item.code == req.param('country');
        });

        AM.addNewAccount({
            name: req.param('name'),
            email: req.param('email'),
            ccode: code[0].dial_code,
            codeISO: req.param('country'),
            phone: req.param('mbl'),
            category: '3',
            buyer: req.param('buyer') != undefined ? '1' : '0',
            freightForwarder: req.param('ff') != undefined ? '1' : '0',
            carrier: req.param('transporter') != undefined ? '1' : '0',
            pass: req.param('pass'),
            shortName: req.param('name').charAt(0),
            imagePath: '',
            facebookRegistration: '0',
            manager: req.param('email').indexOf('nemlevering.dk') > -1 ? '1' : '0',
            approved: '0',
            monthlyInvoice: '0',
            carrierActive: '0',
            token: new require('mongodb').ObjectID()
        }, function(e, o) {
            if (e) {
                var result = "{'status':'" + e + "'}";
                result = result.replace(/\'/g, '"');
                if (req.param('buyer') != undefined) {
                    //redirecting to buyer sign up page                 
                    res.render('buyer-signup', { status: 'failed', countries: CT, error: e });
                } else {
                    //redirecting to carrier transporter sign up page
                    res.render('carrier-signup', { status: 'failed', countries: CT, error: e });
                }

            } else {
                //var text = "Hi "+ o.name+",<br/>";
                //text+="You have successfully signed up at Nemlevering. Please click on the link below to compete your registration<br/>";
                //text+="<a href='http://localhost:3000/verify'></a>";
                //mailgun.send(o.email, "Sign up at Nemlevering successful", text, function(err,success){
                //    if (err) {
                //        console.log('Error sending cargo email');
                //    } else {
                //        console.log('Success sending cargo email');
                //    }
                //});

                if (req.param('transporter') != undefined) {

                    var text = "Hi " + o.name + ",<br/>";
                    text += "has successfully signed up as Carrier at Nemlevering.";
                    text += "His Email account is :" + o.email;

                    mailgun.send('carriers@nemlevering.dk', "Signed up at Nemlevering", text, function(err, success) {
                        if (err) {
                            console.log('Error sending cargo email');
                        } else {
                            console.log('Success sending cargo email');
                        }
                    }); //As user Signed Up so emaill will go from accounts@findacargo.com
                }


                var result = "{'status':'success'}";
                result = result.replace(/\'/g, '"');
                req.session.user = o;
                req.session.user.password = req.param('pass');

                AM.addGroupId(req.session.user, function(err, data) {
                    req.session.user = data;
                    req.session.user.password = req.param('pass');
                    if (req.session.user == null && req.session.user == undefined) {
                        res.render('signin', { error: '' });
                    } else {

                        visitor.pageview(" - Signup with Email", "Signup with Email", "http://dashboard.nemlevering.dk").event("Signup with Email", "Signup with Email", "http://dashboard.nemlevering.dk").send();
                        var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                        var data = {
                            event_type: "Signup with Email", // required
                            country: req.session.user.codeISO,
                            platform: "WEB",
                            user_properties: {
                                Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                                Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                                Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                                Email: req.session.user.email,
                                Phone: req.session.user.phone,
                                Country: req.session.user.codeISO
                            }

                        }
                        var data1 = {
                            event_type: "Signup", // required
                            country: req.session.user.codeISO,
                            platform: "WEB",
                            user_properties: {
                                Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                                Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                                Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                                Email: req.session.user.email,
                                Phone: req.session.user.phone,
                                Country: req.session.user.codeISO
                            }

                        }
                        amplitude.track(data);
                        amplitude.track(data1);

                        mixpanel.track("Signup with Email", {
                            distinct_id: req.session.user._id,
                            email: req.session.user.email,
                            name: req.session.user.name,
                            Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                            Email: req.session.user.email,
                            Phone: req.session.user.phone,
                            Country: req.session.user.codeISO,
                            Host: req.headers.host


                        });

                        mixpanel.track("Signup", {
                            distinct_id: req.session.user._id,
                            email: req.session.user.email,
                            name: req.session.user.name,
                            Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                            Email: req.session.user.email,
                            Phone: req.session.user.phone,
                            Country: req.session.user.codeISO,
                            Host: req.headers.host

                        });

                        //                  if(req.session.user.buyer==1)
                        //                  {
                        //                  //res.render('Buyer',{title:'Buyer : Nemlevering', page:'/buyer', go:'Buyer', user:req.session.user, kind:'Buyer'});
                        //                  //res.redirect('/buyer');

                        //                  res.render('buyer',{udata:req.session.user});
                        //                  }
                        //                  else
                        //                  {
                        //                  //res.render('driver',{title:'Driver : Nemlevering', user:req.session.user, loadData:o});
                        //                  res.render('driver',{udata:req.session.user});
                        //                  }
                        if (req.session.user.carrier == 1) {
                            res.redirect('/onboarding/select-type');
                        } else {
                            res.redirect('/');
                        }

                    }
                });
            }
        });
    } else {
        var result = "{'status':'failed'}";
        if (req.param('buyer') != undefined) {
            res.render('buyer-signup', { status: 'failed', countries: CT, error: e });
        } else {
            res.render('carrier-signup', { status: 'failed', countries: CT, error: e });
        }
        //res.render('signup-multi',{status:'failed',countries:CT, error:'Email Validation failed'});
    }

});

router.get('/signup', function(req, res) {
    res.render('signup-multi', { countries: CT, status: '', error: '' });
});
router.get('/signup/buyer', function(req, res) {
    res.render('buyer-signup', { countries: CT, status: '', error: '' });
});
router.get('/signup/carrier', function(req, res) {
    res.render('carrier-signup', { countries: CT, status: '', error: '' });
});
/*************************************Manager Signup***********************************************/

router.get('/manager-signup', function(req, res) {
    res.render('signup-manager', { countries: CT, status: '', error: '' });
});

router.get('/signup-manager', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.redirect('/');

    } else {
        res.render('signup-manager', { countries: CT, status: '', error: '' });
    }
});

router.post('/signup-manager', function(req, res) {
    console.log(req.param('cat'));

    AM.addNewAccount({
        name: req.param('name'),
        email: req.param('email'),
        ccode: req.param('country'),
        phone: req.param('mbl'),
        category: '3',
        buyer: '1',
        freightForwarder: '1',
        carrier: '1',
        pass: req.param('pass'),
        shortName: req.param('name').charAt(0),
        imagePath: '',
        facebookRegistration: '0',
        manager: '1',
        approved: '0'


    }, function(e, o) {
        if (e) {
            var result = "{'status':'" + e + "'}";
            result = result.replace(/\'/g, '"');
            res.render('signup-manager', { status: 'failed', countries: CT, error: e });
        } else {

            var result = "{'status':'success'}";
            result = result.replace(/\'/g, '"');
            req.session.user = o;
            if (req.session.user == null && req.session.user == undefined) {
                res.render('signin', { error: '' });
            } else {

                visitor.pageview(" - Manager Signup with Email", "Manager Signup with Email", "http://dashboard.nemlevering.dk").event("Manager Signup with Email", "Manager Signup with Email", "http://dashboard.nemlevering.dk").send();
                var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                var data = {
                    event_type: "Manager Signup with Email" // required

                }
                amplitude.track(data);

                if (req.session.user.buyer == 1) {
                    //res.render('Buyer',{title:'Buyer : Nemlevering', page:'/buyer', go:'Buyer', user:req.session.user, kind:'Buyer'});
                    //res.redirect('/buyer');

                    res.render('buyer', { udata: req.session.user });
                } else {
                    //res.render('driver',{title:'Driver : Nemlevering', user:req.session.user, loadData:o});
                    res.render('driver', { udata: req.session.user });
                }

            }
        }
    });
});

/*********************************End of Manager signup*******************************************/


router.get('/', function(req, res) {

    //  req.session.user=null;
    //console.log(req.headers.host);
    //console.log(os.hostname());


    //  var ipInfo = getIP(req);
    //  console.log(ipInfo);
    if (req.headers.host == "dashboard.nemlevering.dk") {
        mixpanel = Mixpanel.init('39d0bbc94e6d6a46185436ae8e5112a9');
    } else {
        mixpanel = Mixpanel.init('35b08bf5d7f756c6462e052b48eb22df');

    }
    if (req.session.user == null && req.session.user == undefined) {
        res.render('signin', { error: '' });
    } else {
        //      var ip = req.headers['x-forwarded-for'] || 
        //      req.connection.remoteAddress || 
        //      req.socket.remoteAddress ||
        //      req.connection.socket.remoteAddress;
        //      console.log(ip);
        //      mixpanel.track("User Profiles", {
        //      distinct_id: req.session.user._id,
        //      email: req.session.user.email,
        //      name: req.session.user.name

        //      });
        //      mixpanel.people.set(req.session.user._id, {
        //      $email: req.session.user.email,
        //      $first_name: req.session.user.name,
        //      $created: req.session.user.date,
        //      $ip:  ip
        //      });

        //      var i = schedule.scheduleJob('*/1 * * * *', function(){
        //      console.log('job 1');
        //      });
        //      var k = schedule.scheduleJob('*/1 * * * *', function(){
        //      console.log('Job 2');
        //      });



        mixpanel.people.set_once('Signup Date', req.session.user.date);

        console.log(req.session.user);

        if (req.session.user.buyer == 1) {
            //res.render('Buyer',{title:'Buyer : Nemlevering', page:'/buyer', go:'Buyer', user:req.session.user, kind:'Buyer'});
            //res.redirect('/buyer');



            res.render('buyer', { udata: req.session.user });
        } else {
            //res.render('driver',{title:'Driver : Nemlevering', user:req.session.user, loadData:o});
            var hasBankDetails = "0";
            var hasFleet = "0";
            var hasRates = "0";
            var hasTrips = "0";

            async.parallel([function(callback) {
                AM.getUserBank(req.session.user._id, function(err, obj) {
                    if (err) {
                        return callback(err, null)
                    } else {
                        hasBankDetails = obj ? "1" : "0";
                        return callback(null);
                    }

                });

            }, function(callback) {
                AM.getTrucks({ userID: req.session.user._id, groupId: req.session.user.groupId }, function(e, o) {
                    if (e) {
                        return callback(e, null);
                    } else {
                        hasFleet = o.length <= 0 ? "0" : "1";
                        hasRates = o.length <= 0 ? "0" : "1";
                        return callback(null);
                    }
                });

            }, function(callback) {
                AM.getTrips({ userID: req.session.user._id, groupId: req.session.user.groupId }, function(e, o) {
                    if (e) {
                        return callback(e, null);
                    } else {
                        hasTrips = o.length <= 0 ? "0" : "1";
                        return callback(null);
                    }
                });
            }], function done(err, results) {
                if (err) {
                    throw err;
                }
                res.render('driver', { udata: req.session.user, hasBankDetails: hasBankDetails, hasFleet: hasFleet, hasRates: hasRates, hasTrips: hasTrips });
            });
        }

    }
});
router.post('/', function(req, res, next) {



    AM.manualLogin(req.param('user'), req.param('lpass'), function(e, o) {

        if (e) {
            res.render('signin', { status: 'failed', error: e });
        } else {
            //          request({
            //                uri: "https://dev.api.nemlevering.dk/v1/auth/login",
            //                method: "POST",
            //                form: {
            //                  email: req.param('user'),
            //                  password:req.param('lpass')
            //                },
            //                timeout: 10000,
            //                followRedirect: true,
            //                maxRedirects: 10
            //              }, function(error, response, body) {
            //                console.log(response.statusCode);
            //              });

            //          request.post(
            //                  'https://dev.api.nemlevering.dk/v1/auth/login',
            //                  { form: {
            //                      email: req.param('user'),
            //                      password:req.param('lpass')
            //                    } },
            //                  function (error, response, body) {
            //                        
            //                        console.log(response);
            //                      if (!error && response.statusCode == 200) {
            //                          console.log(body)
            //                      }
            //                  }
            //              );

            //          request({
            //              url: "https://dev.api.nemlevering.dk/v1/auth/login",
            //              method: "POST",
            //              json: true,   // <--Very important!!!
            //              body: {
            //                  email: req.param('user'),
            //                  password:req.param('lpass')
            //                }
            //          }, function (error, response, body){
            //              console.log(body);
            //          });

            //          var data = {
            //                    payload: {
            //                      value: JSON.stringify({
            //                          email: req.param('user'),
            //                          password:req.param('lpass')
            //                        }),
            //                      content_type: 'application/json'
            //                    }
            //                  }
            //
            //                  needle
            //                    .post('https://dev.api.nemlevering.dk/v1/auth/login', data, { parse: true },function(err, resp, body) {
            //                        // you can pass params as a string or as an object.
            //                        console.log(body);
            //                        
            //                    });







            if (!o.active && typeof o.active != 'undefined') {
                req.session.user = o;
                res.redirect('passchange');
            } else {
                req.session.user = o;
                req.session.user.password = req.param('lpass');

                //              if (req.param('agree') != undefined){
                //              res.cookie('email', o.email, { maxAge: 900000 });
                //              res.cookie('pass', o.pass, { maxAge: 900000 });
                //              res.cookie('id', o._id, { maxAge: 900000 });
                //              }
                if (req.session.user != null && req.session.user != undefined) {



                    visitor.pageview("/ - Login with Email", "Login with Email", "http://dashboard.nemlevering.dk").event("Login with Email", "Login with Email", "http://dashboard.nemlevering.dk").send();
                    var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                    var data = {
                        event_type: "Login with Email", // required
                        country: req.session.user.codeISO,
                        platform: "WEB",
                        user_properties: {
                            Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                            Email: req.session.user.email,
                            Phone: req.session.user.phone,
                            Country: req.session.user.codeISO
                        }

                    }
                    amplitude.track(data);

                    var data1 = {
                        event_type: "Login", // required
                        country: req.session.user.codeISO,
                        platform: "WEB",
                        user_properties: {
                            Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                            Email: req.session.user.email,
                            Phone: req.session.user.phone,
                            Country: req.session.user.codeISO
                        }
                    }
                    amplitude.track(data1);

                    mixpanel.track("Login with Email", {
                        distinct_id: req.session.user._id,
                        email: req.session.user.email,
                        name: req.session.user.name,
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO,
                        Host: req.headers.host

                    });

                    mixpanel.track("Login", {
                        distinct_id: req.session.user._id,
                        email: req.session.user.email,
                        name: req.session.user.name,
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO,
                        Host: req.headers.host

                    });

                    //console.log(req.session.user);

                    //                  if(req.session.user.buyer==1)
                    //                  {
                    //                  //res.render('Buyer',{title:'Buyer : Nemlevering', page:'/buyer', go:'Buyer', user:req.session.user, kind:'Buyer'});
                    //                  //res.redirect('/buyer');

                    //                  res.render('buyer',{udata:req.session.user, event:'1'});
                    //                  }
                    //                  else
                    //                  {
                    //                  //res.render('driver',{title:'Driver : Nemlevering', user:req.session.user, loadData:o});
                    //                  res.render('driver',{udata:req.session.user, event:'1'});
                    //                  }
                    res.redirect('/');
                } else {
                    res.redirect('/');
                }
            }
        }
    });


});
router.get('/trip', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {


        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day = date.getDate();
        day = (day < 10 ? "0" : "") + day;
        console.log("'" + day + "/" + month + "/" + year + "'");
        AM.getTrips({ userID: req.session.user._id, groupId: req.session.user.groupId, sdate: day + "-" + month + "-" + year }, function(e, o) {

            console.log(o);
            AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                if (!err) {

                    if (o.length <= 0) {
                        res.render('noDataTrip', { title: 'Trips : Nemlevering', page: ['/trip/create', '/trip/scheduled/create'], go: ['Create Trip', 'Create Scheduled Trip'], udata: req.session.user, kind: 'Trips', category: '', message: 'You have no Trips', description: 'Trips allow you to coordinate loads and deliveries. We send you suggest new loads from prospect clients for future trips, return trips or for nearby pickups when your driver uses our app live on the road.', event: req.session.user.event });
                    } else {

                        res.render('trip', { title: 'Trips :: Nemlevering', udata: req.session.user, loadData: o, drivers: data, category: 'trip', event: req.session.user.event });
                    }
                }
            })
        });
    } else {
        res.redirect('/');
    }

});
router.get('/cargo', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {

        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        AM.getLoads({ userID: req.session.user._id, groupId: req.session.user.groupId, sdate: month + "-" + day + "-" + year }, function(e, o) {
            if (o.length <= 0) {
                res.render('noCargo', { title: 'Delivery : Nemlevering', page: '/cargo/create', go: 'Create Delivery', udata: req.session.user, userID: req.session.user._id, kind: 'Delivery', category: '', message: 'You have no Deliveries', description: 'Deliveries are assigned to a certain trip, allowing you to plan your deliveries and existing capacity. We send you suggested new Deliveries from prospect clients when you have spare capacity on your truck', lang: 'node_delivery', event: req.session.user.event });
            } else {


                res.render('load', { title: 'Delivery :: Nemlevering', udata: req.session.user, userID: req.session.user._id, loadData: o, category: 'cargo', event: req.session.user.event });
            }
        });

    } else {
        res.redirect('/');
    }


});
router.get('/fleet', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {

        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        AM.getTrucks({ userID: req.session.user._id, groupId: req.session.user.groupId, sdate: day + "/" + month + "/" + year }, function(e, o) {
            if (o.length <= 0) {
                res.render('noFleet', { title: 'Fleets :: Nemlevering', page: '/fleet/create', go: 'Add To Fleet', udata: req.session.user, userID: req.session.user._id, kind: 'Fleet', category: '', message: 'You have no vehicles in fleet', description: 'Registering your vehicles allow you to allocate incoming transportation requests manually from prospect clients. We also suggest new Deliveries from nearby pickups when your driver uses our app live on the road.', event: req.session.user.event });
            } else {
                console.log(o);
                AM.getVehicles(function(error, vehicles) {
                    if (vehicles) {
                        _.forEach(o, function(truck) {
                            var vehicle = _.filter(vehicles, function(item) {
                                return item.typeId == truck.type;
                            });
                            truck.description = vehicle[0] && vehicle[0].description;
                        });
                        res.render('truck', { title: 'Fleet :: Nemlevering', udata: req.session.user, userID: req.session.user._id, loadData: o, road: RT, sea: ST, category: 'fleet', event: req.session.user.event });
                    }
                });
            }
        });
    } else {
        res.redirect('/');
    }


});

router.get('/trip/create', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {
        AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
            if (!err) {
                console.log(data);
                res.render('createTrip', { u_id: req.session.user._id, drivers: data, udata: req.session.user, title: 'Create Trip :: Nemlevering', category: 'ct' });
            }
        });
    } else {
        res.redirect('/');
    }
});

//router.get('/ct', function(req, res, next)
//      {
//  if(req.session.user!=null && req.session.user!=undefined)
//  {
//      AM.getDrivers({company:req.session.user._id},function(err,data){
//          if(!err){
//              console.log(data);
//              res.render('createTrip',{u_id:req.session.user._id,drivers:data,udata:req.session.user, title:'Create Trip :: Nemlevering', category:'ct' });
//          }
//      });
//  }else
//  {
//      res.redirect('/');
//  }
//      });

router.get('/trip/scheduled/create', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {
        AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
            if (!err) {
                console.log(data);
                res.render('createScheduledTrip', { u_id: req.session.user._id, drivers: data, udata: req.session.user, title: 'Create Trip :: Nemlevering', category: 'ct' });
            }
        });
    } else {
        res.redirect('/');
    }
});

router.post('/trip/create', function(req, res) {


    AM.createTrip({
        name: req.param('name'),
        origin: req.param('origin'),
        destination: req.param('destination'),
        startDateTime: req.param('startDate'),
        endDateTime: req.param('endDate'),
        userType: req.param('userType'),
        driver: req.param('driver'),
        assigned_vehicle: {},
        scheduled: 0,
        userID: new require('mongodb').ObjectID(req.session.user._id),
        groupId: req.session.user.groupId
    }, function(e, o) {
        if (e) {
            console.log(e);
            res.render('createTrip', { status: 'failed', udata: req.session.user, userID: req.session.user._id, category: 'ct' });
        } else {
            if (req.session.user != null && req.session.user != undefined) {

                visitor.pageview(" - Create Trip", "Create Trip", "http://dashboard.nemlevering.dk").event("Create Trip", "Create Trip", "http://dashboard.nemlevering.dk").send();
                var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                var data = {
                    event_type: "Create Trip", // required
                    country: req.session.user.codeISO,
                    platform: "WEB",
                    user_properties: {
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO
                    }

                }
                amplitude.track(data);

                mixpanel.track("Create Trip", {
                    distinct_id: req.session.user._id,
                    email: req.session.user.email,
                    name: req.session.user.name,
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO,
                    Host: req.headers.host

                });

                var date = new Date();
                req.session.user.event = 1;

                res.redirect('/trip');
            } else {
                res.redirect('/');
            }
        }

    });




});

router.post('/trip/scheduled/create', function(req, res) {


    var days = {};
    days.sun = req.param('sun') == undefined ? false : true;
    days.sat = req.param('sat') == undefined ? false : true;
    days.mon = req.param('mon') == undefined ? false : true;
    days.tue = req.param('tue') == undefined ? false : true;
    days.wed = req.param('wed') == undefined ? false : true;
    days.thu = req.param('thu') == undefined ? false : true;
    days.fri = req.param('fri') == undefined ? false : true;

    console.log(days);

    AM.createTrip({
        name: req.param('name'),
        origin: req.param('origin'),
        destination: req.param('destination'),
        startDateTime: req.param('startDate'),
        endDateTime: req.param('endDate'),
        userType: req.param('userType'),
        driver: req.param('driver'),
        repeats: req.param('repeats'),
        interval: req.param('interval'),
        repeatBy: req.param('domw'),
        onDays: days,
        startsOn: req.param('start'),
        endsOn: req.param('ends'),
        occur: req.param('occur'),
        endDate: req.param('ends_on'),
        shouldEnd: false,
        occurrences: 0,
        assigned_vehicle: {},
        scheduled: 1,
        userID: new require('mongodb').ObjectID(req.session.user._id),
        groupId: req.session.user.groupId
    }, function(e, o) {
        if (e) {
            console.log(e);
            res.render('createTrip', { status: 'failed', udata: req.session.user, userID: req.session.user._id, category: 'ct' });
        } else {
            if (req.session.user != null && req.session.user != undefined) {

                visitor.pageview(" - Create Trip", "Create Trip", "http://dashboard.nemlevering.dk").event("Create Trip", "Create Trip", "http://dashboard.nemlevering.dk").send();
                var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                var data = {
                    event_type: "Create Trip", // required
                    country: req.session.user.codeISO,
                    platform: "WEB",
                    user_properties: {
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO
                    }

                }
                amplitude.track(data);

                mixpanel.track("Create Trip", {
                    distinct_id: req.session.user._id,
                    email: req.session.user.email,
                    name: req.session.user.name,
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO,
                    Host: req.headers.host

                });

                var date = new Date();
                req.session.user.event = 1;

                res.redirect('/trip');
            } else {
                res.redirect('/');
            }
        }

    });




});
router.get('/trip/delete', function(req, res, next) {
    AM.deleteTrip(req.param('tripID'), function(e, o) {
        visitor.pageview(" - Delete Trip", "Delete Trip", "http://dashboard.nemlevering.dk").event("Delete Trip", "Delete Trip", "http://dashboard.nemlevering.dk").send();
        var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
        var data = {
            event_type: "Delete Trip", // required
            country: req.session.user.codeISO,
            platform: "WEB",
            user_properties: {
                Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                Email: req.session.user.email,
                Phone: req.session.user.phone,
                Country: req.session.user.codeISO
            }

        }
        amplitude.track(data);

        mixpanel.track("Delete Trip", {
            distinct_id: req.session.user._id,
            email: req.session.user.email,
            name: req.session.user.name,
            Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
            Email: req.session.user.email,
            Phone: req.session.user.phone,
            Country: req.session.user.codeISO,
            Host: req.headers.host

        });

        req.session.user.event = 3;
        if (!e)
            res.redirect('/trip');
    });

});

router.get('/trip/update', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {

        AM.getTrip({ userID: req.session.user._id, tripID: req.param('tripID') }, function(e, o) {
            if (o) {
                console.log(o);
                AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                    if (!err) {
                        res.render('updateTrip', { u_id: req.session.user._id, drivers: data, udata: req.session.user, data: o, category: '' });
                    }
                });
            } else {
                console.log(e);
                res.redirect('/trip');
            }
        });
    } else {
        res.redirect('/');
    }



});

router.get('/trip/scheduled/update', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {

        AM.getTrip({ userID: req.session.user._id, tripID: req.param('tripID') }, function(e, o) {
            if (o) {
                console.log(o);
                AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                    if (!err) {
                        res.render('updateScheduledTrip', { u_id: req.session.user._id, drivers: data, udata: req.session.user, data: o, category: '' });
                    }
                });
            } else {
                console.log(e);
                res.redirect('/trip');
            }
        });
    } else {
        res.redirect('/');
    }



});

router.get('/trip/view', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {

        AM.getTrip({ userID: req.session.user._id, tripID: req.param('tripID') }, function(e, o) {
            if (o) {
                console.log(o);
                res.render('viewTrip', { u_id: req.session.user._id, udata: req.session.user, data: o });
            } else {
                console.log(e);
                res.redirect('/trip');
            }
        });
    } else {
        res.redirect('/');
    }



});
router.post('/trip/update', function(req, res, next) {

    console.log(req.param('name'));

    AM.updateTrip({
        name: req.param('name'),
        origin: req.param('origin'),
        destination: req.param('destination'),
        startDateTime: req.param('startDate'),
        endDateTime: req.param('endDate'),
        userType: req.param('userType'),
        driver: req.param('driver'),
        scheduled: req.param('scheduled') == undefined ? 0 : 1,
        tripID: req.param('tripID'),
        userID: new require('mongodb').ObjectID(req.session.user._id)
    }, function(e, o) {

        if (o) {
            visitor.pageview(" - Edit Trip", "Edit Trip", "http://dashboard.nemlevering.dk").event("Edit Trip", "Edit Trip", "http://dashboard.nemlevering.dk").send();
            var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
            var data = {
                event_type: "Edit Trip", // required
                country: req.session.user.codeISO,
                platform: "WEB",
                user_properties: {
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO
                }

            }
            amplitude.track(data);
            mixpanel.track("Edit Trip", {
                distinct_id: req.session.user._id,
                email: req.session.user.email,
                name: req.session.user.name,
                Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                Email: req.session.user.email,
                Phone: req.session.user.phone,
                Country: req.session.user.codeISO,
                Host: req.headers.host

            });
            req.session.user.event = 2;
            res.redirect('/trip');
        } else {
            console.log(e);
            res.redirect('/trip');
        }

    });

});

router.post('/trip/scheduled/update', function(req, res, next) {

    var days = {};
    days.sun = req.param('sun') == undefined ? false : true;
    days.sat = req.param('sat') == undefined ? false : true;
    days.mon = req.param('mon') == undefined ? false : true;
    days.tue = req.param('tue') == undefined ? false : true;
    days.wed = req.param('wed') == undefined ? false : true;
    days.thu = req.param('thu') == undefined ? false : true;
    days.fri = req.param('fri') == undefined ? false : true;

    console.log(days);

    console.log(req.param('name'));

    AM.updateTrip({
        name: req.param('name'),
        origin: req.param('origin'),
        destination: req.param('destination'),
        startDateTime: req.param('startDate'),
        endDateTime: req.param('endDate'),
        userType: req.param('userType'),
        driver: req.param('driver'),
        repeats: req.param('repeats'),
        interval: req.param('interval'),
        onDays: days,
        startsOn: req.param('start'),
        endsOn: req.param('ends'),
        occur: req.param('occur'),
        endDate: req.param('ends_on'),
        shouldEnd: false,
        occurrences: 0,
        scheduled: 1,
        tripID: req.param('tripID'),
        userID: new require('mongodb').ObjectID(req.session.user._id)
    }, function(e, o) {

        if (o) {
            visitor.pageview(" - Edit Trip", "Edit Trip", "http://dashboard.nemlevering.dk").event("Edit Trip", "Edit Trip", "http://dashboard.nemlevering.dk").send();
            var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
            var data = {
                event_type: "Edit Trip", // required
                country: req.session.user.codeISO,
                platform: "WEB",
                user_properties: {
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO
                }

            }
            amplitude.track(data);
            mixpanel.track("Edit Trip", {
                distinct_id: req.session.user._id,
                email: req.session.user.email,
                name: req.session.user.name,
                Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                Email: req.session.user.email,
                Phone: req.session.user.phone,
                Country: req.session.user.codeISO,
                Host: req.headers.host

            });
            req.session.user.event = 2;
            res.redirect('/trip');
        } else {
            console.log(e);
            res.redirect('/trip');
        }

    });

});

router.get('/cargo/create', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {

        data = { user_id: req.session.user._id, groupId: req.session.user.groupId };
        var count = 0000;
        AM.getLoadsCount(req.session.user._id, req.session.user.groupId, function(err, obj) {
            obj = obj + 1;
            CM.getAllContacts(data, function(error, object) {

                if (error) {
                    //console.log(e);
                    AM.getTrips({

                        userID: req.session.user._id,
                        groupId: req.session.user.groupId

                    }, function(e, o) {

                        if (!o) {
                            AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                if (!err) {
                                    console.log(data);
                                    res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', drivers: data });
                                }
                            });

                        } else {

                            if (o.length <= 0) {
                                AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                    if (!err) {
                                        console.log(data);
                                        res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', drivers: data });
                                    }
                                });

                            } else {
                                AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                    if (!err) {
                                        console.log(data);
                                        res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: o, old_data: contact_data_empty, page: '/trip/create', drivers: data });
                                    }
                                });

                            }

                        }

                    });

                } else {
                    if (object.length <= 0) {
                        AM.getTrips({

                            userID: req.session.user._id,
                            groupId: req.session.user.groupId

                        }, function(e, o) {

                            if (!o) {
                                AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                    if (!err) {
                                        console.log(data);
                                        res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', drivers: data });
                                    }
                                });

                            } else {

                                if (o.length <= 0) {
                                    AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                        if (!err) {
                                            console.log(data);
                                            res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', drivers: data });
                                        }
                                    });

                                } else {
                                    AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                        if (!err) {
                                            console.log(data);
                                            res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: o, old_data: contact_data_empty, page: '/trip/create', drivers: data });
                                        }
                                    });

                                }

                            }

                        });
                    } else {
                        AM.getTrips({

                            userID: req.session.user._id,
                            groupId: req.session.user.groupId

                        }, function(e, o) {

                            if (!o) {
                                AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                    if (!err) {
                                        console.log(data);
                                        res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: object, category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', drivers: data });
                                    }
                                });

                            } else {

                                if (o.length <= 0) {
                                    AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                        if (!err) {
                                            console.log(data);
                                            res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: object, category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', drivers: data });
                                        }
                                    });

                                } else {
                                    AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                        if (!err) {
                                            console.log(data);
                                            res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: object, category: 'cc', counter: 0000 + obj, trips: o, old_data: contact_data_empty, page: '/trip/create', drivers: data });
                                        }
                                    });

                                }

                            }

                        });
                    }

                }
            });
        });






    } else {
        res.redirect('/');
    }

});
router.post('/cargo/create', function(req, res, next) {

    var picDate = req.param('pickupDate').replace(/\//g, "-");
    var client = req.param('clientID');
    if (req.body.nonuserEmail != '' && req.body.nonuserEmail) {
        client = req.body.nonuserEmail;
    }
    var originll = JSON.parse(req.param('originLatLng'));
    var destll = JSON.parse(req.param('destinationLatLng'));


    AM.createLoad({
        name: req.param('name'),
        ClientID: client,
        deliveryId: req.param('name'),
        origin: req.param('origin'),
        destination: req.param('destination'),
        pickupTimeFrom: req.param('picktimeFrom'),
        pickupTimeTo: req.param('picktimeTo'),
        deliverTimeFrom: req.param('picktimeFrom'),
        deliverTimeTo: req.param('picktimeTo'),
        pickupDate: picDate,
        deliveryDate: picDate,
        typeLoad: req.param('typeLoad'),
        volume: req.param('volume'),
        weight: req.param('weight'),
        area: req.param('area'),
        otherDetails: req.param('other'),
        originLatLng: { type: "Point", coordinates: [originll.lat, originll.lng] },
        destLatLng: { type: "Point", coordinates: [destll.lat, destll.lng] },
        status: 0,
        userID: new require('mongodb').ObjectID(req.session.user._id),
        groupId: req.session.user.groupId
    }, function(e, o) {

        if (e) res.render('createLoad', { status: 'failed', udata: req.session.user, category: 'cc' });
        else {
            if (req.session.user != null && req.session.user != undefined) {
                if (req.body.nonuserEmail != '' && req.body.nonuserEmail) {
                    var text = req.session.user.name + " is transporting a cargo for you.<br /><br/>";
                    text += "See more details:<br/>";
                    text += "<a href='dev.dashboard.nemlevering.dk/cargo/view?loadID=" + o.ops[0]._id + "'>Link to Cargo details Page</a><br/><br/>";
                    text += "-- Easy shipping powered by <a href=\"http://nemlevering.dk\">Nemlevering</a>"
                    mailgun.send(req.body.nonuserEmail, req.session.user.name + " just setup a cargo delivery for you", text, function(err, success) {
                        if (err) {
                            console.log('Error sending cargo email');
                        } else {
                            console.log('Success sending cargo email');
                        }
                    }, (req.session.user.name + '<' + req.session.user.email + '>'));
                }

                console.log(o);
                pusher.trigger(req.session.user._id, 'new_load', o.ops[0]);
                visitor.pageview(" - Create Delivery", "Create Delivery", "http://dashboard.nemlevering.dk").event("Create Delivery", "Create Delivery", "http://dashboard.nemlevering.dk").send();
                var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                var data = {
                    event_type: "Create Delivery", // required
                    country: req.session.user.codeISO,
                    platform: "WEB",
                    user_properties: {
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO
                    }

                }
                amplitude.track(data);

                mixpanel.track("Create Delivery", {
                    distinct_id: req.session.user._id,
                    email: req.session.user.email,
                    name: req.session.user.name,
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO,
                    Host: req.headers.host

                });

                var date = new Date();
                req.session.user.event = 1;
                if (req.param('trips') == 'undefined' || req.param('trips') == '-') {

                    res.redirect('/cargo');

                } else {
                    AM.assignTrip({
                        userID: new require('mongodb').ObjectID(req.session.user._id),
                        groupId: req.session.user.groupId,
                        cargoID: new require('mongodb').ObjectID(o.ops[0]._id),
                        tripID: getObjectId(req.param('tripID'))
                    }, function(e, o) {

                        if (o) {
                            res.redirect('/cargo');
                        }

                    });
                }
            } else {
                res.redirect('/');
            }
        }
    });



});


router.get('/cargo/delete', function(req, res, next) {
    AM.deleteLoad(req.param('loadID'), function(e, o) {
        visitor.pageview(" - Delete Delivery", "Delete Delivery", "http://dashboard.nemlevering.dk").event("Delete Delivery", "Delete Delivery", "http://dashboard.nemlevering.dk").send();
        var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
        var data = {
            event_type: "Delete Delivery", // required
            country: req.session.user.codeISO,
            platform: "WEB",
            user_properties: {
                Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                Email: req.session.user.email,
                Phone: req.session.user.phone,
                Country: req.session.user.codeISO
            }

        }
        amplitude.track(data);

        mixpanel.track("Delete Delivery", {
            distinct_id: req.session.user._id,
            email: req.session.user.email,
            name: req.session.user.name,
            Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
            Email: req.session.user.email,
            Phone: req.session.user.phone,
            Country: req.session.user.codeISO,
            Host: req.headers.host

        });
        req.session.user.event = 3;
        if (!e)
            res.redirect('/cargo');
    });

});
router.get('/cargo/update', function(req, res, next) {

    if (req.session.user != null && req.session.user != undefined) {
        AM.getLoad({ userID: req.session.user._id, loadID: req.param('loadID') }, function(errs, objc) {
            if (objc) {
                if (objc.typeLoad === null || objc === undefined) {
                    objc.typeLoad = null;
                }
                data = { user_id: req.session.user._id, groupId: req.session.user.groupId };
                console.log(objc);
                CM.getAllContacts(data, function(error, object) {

                    if (error) {
                        //console.log(e);
                        AM.getTrips({

                            userID: req.session.user._id,
                            groupId: req.session.user.groupId

                        }, function(e, o) {

                            if (!o) {
                                res.render('updateLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', data: objc });
                            } else {

                                if (o.length <= 0) {
                                    res.render('updateLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', data: objc });
                                } else {
                                    res.render('updateLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', trips: o, old_data: contact_data_empty, page: '/trip/create', data: objc });
                                }

                            }

                        });

                    } else {
                        if (object.length <= 0) {
                            AM.getTrips({

                                userID: req.session.user._id,
                                groupId: req.session.user.groupId

                            }, function(e, o) {

                                if (!o) {
                                    res.render('updateLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', data: objc });
                                } else {

                                    if (o.length <= 0) {
                                        res.render('updateLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', data: objc });
                                    } else {
                                        res.render('updateLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', trips: o, old_data: contact_data_empty, page: '/trip/create', data: objc });
                                    }

                                }

                            });
                        } else {
                            AM.getTrips({

                                userID: req.session.user._id,
                                groupId: req.session.user.groupId

                            }, function(e, o) {

                                if (!o) {
                                    res.render('updateLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: object, category: 'cc', trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', data: objc });
                                } else {

                                    if (o.length <= 0) {
                                        res.render('updateLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: object, category: 'cc', trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/trip/create', data: objc });
                                    } else {
                                        res.render('updateLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: object, category: 'cc', trips: o, old_data: contact_data_empty, page: '/trip/create', data: objc });
                                    }

                                }

                            });
                        }

                    }
                });
                //res.render('updateLoad',{u_id:req.session.user._id, udata:req.session.user, data:o});
            } else {
                console.log(errs);
                res.redirect('/cargo');
            }
        });
    } else {
        res.redirect('/');
    }

});

router.get('/cargo/view', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {
        AM.getLoad({ userID: req.session.user._id, loadID: req.param('loadID') }, function(e, o) {
            if (o) {
                console.log(o);
                res.render('viewLoad', { u_id: req.session.user._id, udata: req.session.user, data: o });
            } else {
                console.log(e);
                res.redirect('/cargo');
            }
        });
    } else {
        res.redirect('/');
    }
});

router.get('/accountHistory', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {
        var fixedDiscount = 0;
        if (req.session.user.fixedDiscount != undefined) {
            fixedDiscount = req.session.user.fixedDiscount;
        }
        res.render('accountHistory', { udata: req.session.user, fixedDiscount: fixedDiscount });
    } else {
        res.redirect('/');
    }
});

router.get('/getAccountStatementBuyer', function(req, res) {
    var userId;
    if (req.session.user === null || req.session.user === undefined) {
        res.render('signin', { error: '' });
    } else {
        if (req.query.userId) {
            userId = req.query.userId;
        } else {
            userId = req.session.user._id;
        }

        AM.getAccountStatement(userId, function(e, o) {
            if (!o) {
                res.send({ data: [] });
            } else {
                res.send({ data: o });
            }
        });
    }
});


router.post('/cargo/update', function(req, res, next) {

    var client = req.param('clientID');
    if (req.body.nonuserEmail != '' && req.body.nonuserEmail) {
        client = req.body.nonuserEmail;
    }
    var picDate = req.param('pickupDate').replace(/\//g, "-");

    AM.updateLoad({
        name: req.param('name'),
        ClientID: client,
        deliveryId: req.param('name'),
        origin: req.param('origin'),
        destination: req.param('destination'),
        pickupTimeFrom: req.param('picktimeFrom'),
        pickupTimeTo: req.param('picktimeTo'),
        deliverTimeFrom: req.param('picktimeFrom'),
        deliverTimeTo: req.param('picktimeTo'),
        pickupDate: picDate,
        deliveryDate: picDate,
        typeLoad: req.param('typeLoad'),
        volume: req.param('volume'),
        weight: req.param('weight'),
        area: req.param('area'),
        otherDetails: req.param('other'),
        originLatLng: req.param('originLatLng'),
        destLatLng: req.param('destinationLatLng'),
        status: 0,
        userID: new require('mongodb').ObjectID(req.session.user._id),
        loadID: req.param('loadID')
    }, function(e, o) {

        if (o) {
            visitor.pageview(" - Edit Delivery", "Edit Delivery", "http://dashboard.nemlevering.dk").event("Edit Delivery", "Edit Delivery", "http://dashboard.nemlevering.dk").send();
            var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
            var data = {
                event_type: "Edit Delivery", // required
                country: req.session.user.codeISO,
                platform: "WEB",
                user_properties: {
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO
                }

            }
            amplitude.track(data);

            mixpanel.track("Edit Delivery", {
                distinct_id: req.session.user._id,
                email: req.session.user.email,
                name: req.session.user.name,
                Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                Email: req.session.user.email,
                Phone: req.session.user.phone,
                Country: req.session.user.codeISO,
                Host: req.headers.host

            });
            req.session.user.event = 2;
            res.redirect('/cargo');
        } else {
            //console.log(e);
            res.redirect('/cargo');
        }
    });

});
router.get('/fleet/create', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {
        AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
            if (!err) {
                AM.getVehicles(function(error, vehicles) {
                    if (vehicles) {
                        res.render('createTruck', { u_id: req.session.user._id, drivers: data, udata: req.session.user, title: 'Add To Fleet :: Nemlevering', category: 'cf', vehicles: vehicles });
                    }
                });
            }
        })
    } else {
        res.redirect('/');
    }
});

//buyer organization update

router.post('/buyOrganizationUpdate', function(req, res, next) {

    var userType = req.param('userType');
    var companyDetails = {};
    if (userType == 'company') {
        companyDetails["companyName"] = req.param('companyName');
        companyDetails["taxId"] = req.param('taxId');
        companyDetails["companyAddress"] = req.param('companyAddress');
    }
    var userName = req.param('name');
    if (userName == "" || userName == undefined || userName == null) {
        userName = req.session.user.name;
    }
    var cpr = req.param('cpr');
    if (cpr == "" || cpr == undefined || cpr == null) {
        cpr = "";
    }
    var hasOrganized = req.param('hasOrganized');


    AM.updateBuyerUserOrganization({
        companyDetails: companyDetails,
        name: userName,
        userType: userType,
        cpr: cpr,
        hasOrganized: hasOrganized,
        userID: req.session.user._id
    }, function(e, o) {

        if (e) {
            console.log('Failed Buyer Organization settings update:' + e);
        } else {
            console.log('Success Buyer updating organization settings');

            AM.getAccountByEmail(req.session.user.email, function(err, user) {
                req.session.user = user;
                res.redirect('/organization');
            })
        }

    });
});



// organization update

router.post('/organizationUpdate', function(req, res, next) {

    var licenceUrls = JSON.parse(req.body.licenceImageUrl);

    var insuranceUrls = JSON.parse(req.body.insuranceImageUrl);

    var haulageUrls = JSON.parse(req.body.haulageImageUrl);

    var specialUrls = JSON.parse(req.body.specialImageUrl);

    var commercialUrls = JSON.parse(req.body.commercialImageUrl);

    var railwayUrls = JSON.parse(req.body.railwayImageUrl);

    var airUrls = JSON.parse(req.body.airImageUrl);

    var shipUrls = JSON.parse(req.body.shipImageUrl);

    var userType = req.param('userType');
    var companyDetails = {};
    if (userType == 'company') {
        companyDetails["companyName"] = req.param('companyName');
        companyDetails["taxId"] = req.param('taxId');
        companyDetails["companyAddress"] = req.param('companyAddress');
    }
    var userName = req.param('name');
    if (userName == "" || userName == undefined || userName == null) {
        userName = req.session.user.name;
    }
    var cpr = req.param('cpr');
    if (cpr == "" || cpr == undefined || cpr == null) {
        cpr = "";
    }
    var hasOrganized = req.param('hasOrganized');


    AM.updateUserOrganization({
        licenceDocUrl: licenceUrls,
        insuranceDocUrl: insuranceUrls,
        haulageDocUrl: haulageUrls,
        specialDocUrl: specialUrls,
        commercialDocUrl: commercialUrls,
        railwayDocUrl: railwayUrls,
        airDocUrl: airUrls,
        shipDocUrl: shipUrls,
        companyDetails: companyDetails,
        name: userName,
        userType: userType,
        cpr: cpr,
        hasInsurance: req.param('hasInsurance'),
        hasHaulageLicense: req.param('hasHaulageLicense'),
        hasSpecialTransport: req.param('hasSpecialTransport'),
        hasCommercialLicence: req.param('hasCommercialLicence'),
        hasRailwayService: req.param('hasRailwayService'),
        hasAirService: req.param('hasAirService'),
        hasShipService: req.param('hasShipService'),
        hasOrganized: hasOrganized,

        userID: req.session.user._id
    }, function(e, o) {

        if (e) {
            console.log('Failed Organization settings update:' + e);
        } else {
            console.log('Success updating organization settings');

            AM.getAccountByEmail(req.session.user.email, function(err, user) {
                req.session.user = user;
                res.redirect('/organization');
            })
        }

    });
});

// organizationUpdateEdit 
router.post('/organizationUpdateEdit', function(req, res, next) {

    var licenceUrls = JSON.parse(req.body.licenceImageUrl);

    var insuranceUrls = JSON.parse(req.body.insuranceImageUrl);

    var haulageUrls = JSON.parse(req.body.haulageImageUrl);

    var specialUrls = JSON.parse(req.body.specialImageUrl);

    var commercialUrls = JSON.parse(req.body.commercialImageUrl);

    var railwayUrls = JSON.parse(req.body.railwayImageUrl);

    var airUrls = JSON.parse(req.body.airImageUrl);

    var shipUrls = JSON.parse(req.body.shipImageUrl);

    var userType = req.param('userType');
    var companyDetails = {};
    if (userType == 'company') {
        companyDetails["companyName"] = req.param('companyName');
        companyDetails["taxId"] = req.param('taxId');
        companyDetails["companyAddress"] = req.param('companyAddress');
    }
    var userName = req.param('name');
    if (userName == "" || userName == undefined || userName == null) {
        userName = req.session.user.name;
    }
    var cpr = req.param('cpr');
    if (cpr == "" || cpr == undefined || cpr == null) {
        cpr = "";
    }


    AM.updateUserOrganizationEdit({
        licenceDocUrl: licenceUrls,
        insuranceDocUrl: insuranceUrls,
        haulageDocUrl: haulageUrls,
        specialDocUrl: specialUrls,
        commercialDocUrl: commercialUrls,
        railwayDocUrl: railwayUrls,
        airDocUrl: airUrls,
        shipDocUrl: shipUrls,
        companyDetails: companyDetails,
        name: userName,
        userType: userType,
        cpr: cpr,
        hasInsurance: req.param('hasInsurance'),
        hasHaulageLicense: req.param('hasHaulageLicense'),
        hasSpecialTransport: req.param('hasSpecialTransport'),
        hasCommercialLicence: req.param('hasCommercialLicence'),
        hasRailwayService: req.param('hasRailwayService'),
        hasAirService: req.param('hasAirService'),
        hasShipService: req.param('hasShipService'),

        userID: req.session.user._id
    }, function(e, o) {

        if (e) {
            console.log('Failed Organization settings update:' + e);
        } else {
            console.log('Success updating organization settings');

            AM.getAccountByEmail(req.session.user.email, function(err, user) {
                req.session.user = user;
                res.redirect('/organization');
            })
        }

    });
});


router.post('/fleet/create', function(req, res, next) {

    var imageUrls = JSON.parse(req.param('fleetImageUrl'));

    AM.createTruck({
        identifier: req.param('name'),
        vehicalType: req.param('vType'),
        type: req.param('type'),
        allowCargo: [].concat(req.param('acargo')),
        driver: req.param('driver'),
        volume: req.param('volume'),
        weight: req.param('weight'),
        area: req.param('area'),
        length: req.param('length'),
        width: req.param('width'),
        height: req.param('height'),
        color: req.param('color'),
        brand: req.param('brand'),
        model: req.param('model'),
        lift: req.param('lift'),
        refrigerated: req.param('refrigerated') ? req.param('refrigerated') : '0',
        imageUrls: imageUrls,
        userID: new require('mongodb').ObjectID(req.session.user._id),
        groupId: req.session.user.groupId
    }, function(e, o) {
        if (e) res.render('createTruck', { status: 'failed', udata: req.session.user, category: 'cf' });
        else {
            if (req.session.user != null && req.session.user != undefined) {
                visitor.pageview(" - Create Fleet", "Create Fleet", "http://dashboard.nemlevering.dk").event("Create Fleet", "Create Fleet", "http://dashboard.nemlevering.dk").send();
                var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                var data = {
                    event_type: "Create Fleet", // required
                    country: req.session.user.codeISO,
                    platform: "WEB",
                    user_properties: {
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO
                    }

                }
                amplitude.track(data);

                mixpanel.track("Create Fleet", {
                    distinct_id: req.session.user._id,
                    email: req.session.user.email,
                    name: req.session.user.name,
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO,
                    Host: req.headers.host

                });

                var date = new Date();
                req.session.user.event = 1;
                res.redirect('/fleet');
            } else {
                res.redirect('/');
            }
        }
    });

});
router.get('/fleet/delete', function(req, res, next) {
    AM.deleteTruck(req.param('truckID'), function(e, o) {

        visitor.pageview(" - Delete Fleet", "Delete Fleet", "http://dashboard.nemlevering.dk").event("Delete Fleet", "Delete Fleet", "http://dashboard.nemlevering.dk").send();
        var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
        var data = {
            event_type: "Delete Fleet", // required
            country: req.session.user.codeISO,
            platform: "WEB",
            user_properties: {
                Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                Email: req.session.user.email,
                Phone: req.session.user.phone,
                Country: req.session.user.codeISO
            }

        }
        amplitude.track(data);

        mixpanel.track("Delete Fleet", {
            distinct_id: req.session.user._id,
            email: req.session.user.email,
            name: req.session.user.name,
            Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
            Email: req.session.user.email,
            Phone: req.session.user.phone,
            Country: req.session.user.codeISO,
            Host: req.headers.host

        });

        req.session.user.event = 3;
        if (!e)
            res.redirect('/fleet');
    });

});
router.post('/fleet/update', function(req, res, next) {

    var imageUrls = JSON.parse(req.param('fleetImageUrl'));

    AM.updateTruck({
        identifier: req.param('name'),
        vehicalType: req.param('vType'),
        type: req.param('type'),
        allowCargo: [].concat(req.param('acargo')),
        volume: req.param('volume'),
        weight: req.param('weight'),
        area: req.param('area'),
        length: req.param('length'),
        width: req.param('width'),
        height: req.param('height'),
        color: req.param('color'),
        brand: req.param('brand'),
        model: req.param('model'),
        refrigerated: req.param('refrigerated') ? req.param('refrigerated') : '0',
        userID: new require('mongodb').ObjectID(req.session.user._id),
        truckID: req.param('truckID'),
        driver: req.param('driver'),
        imageUrls: imageUrls
    }, function(e, o) {
        if (o) {
            visitor.pageview(" - Edit Fleet", "Edit Fleet", "http://dashboard.nemlevering.dk").event("Edit Fleet", "Edit Fleet", "http://dashboard.nemlevering.dk").send();
            var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
            var data = {
                event_type: "Edit Fleet", // required
                country: req.session.user.codeISO,
                platform: "WEB",
                user_properties: {
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO
                }

            }
            amplitude.track(data);

            mixpanel.track("Edit Fleet", {
                distinct_id: req.session.user._id,
                email: req.session.user.email,
                name: req.session.user.name,
                Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                Email: req.session.user.email,
                Phone: req.session.user.phone,
                Country: req.session.user.codeISO,
                Host: req.headers.host

            });
            req.session.user.event = 2;
            res.redirect('/fleet');
        } else {
            console.log(e);
            res.redirect('/fleet');
        }

    });
});
router.get('/fleet/update', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {
        AM.getTruck({ userID: req.session.user._id, truckID: req.param('truckID') }, function(e, o) {
            if (o) {
                console.log(o);
                var allowCargos = null;
                if (o.allowCargo) {
                    allowCargos = o.allowCargo;
                }

                AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                    if (!err) {
                        AM.getVehicles(function(error, vehicles) {
                            if (vehicles) {
                                res.render('updateTruck', { u_id: req.session.user._id, drivers: data, udata: req.session.user, data: o, allowCargo: allowCargos, vehicles: vehicles });
                            }
                        });
                    }
                })
            } else {
                console.log(e);
                res.redirect('/fleet');
            }
        });

    } else {
        res.redirect('/');
    }

});
router.get('/fleet/view', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {
        AM.getTruck({ userID: req.session.user._id, truckID: req.param('truckID') }, function(e, o) {
            if (o) {
                console.log(o);
                AM.getDriver({ _id: o.driver }, function(err, data) {
                    if (!err) {
                        AM.getVehiclesDescription(o.type, function(error, vehicle) {
                            if (vehicle) {
                                res.render('viewTruck', { u_id: req.session.user._id, udata: req.session.user, data: o, driver: data, road: vehicle, sea: ST });
                            }
                        });
                    }
                })


            } else {
                console.log(e);
                res.redirect('/fleet');
            }
        });

    } else {
        res.redirect('/');
    }

});

router.get('/logout', function(req, res) {
    req.session.user = null;
    res.redirect('/');
});

router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }),
    function(req, res) {



    });
router.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/logout'
    }),
    function(req, res) {

        console.log(req.user);

        AM.addNewAccount({
            name: req.user.name.givenName + " " + req.user.name.familyName,
            email: req.user.emails[0].value,
            ccode: "",
            phone: "",
            category: "3",
            buyer: '1',
            freightForwarder: '1',
            carrier: '1',
            shortName: req.user.name.givenName.charAt(0),
            imagePath: '',
            pass: req.user.id,
            facebookRegistration: '1',
            manager: req.user.emails[0].value.indexOf('nemlevering.dk') > -1 ? '1' : '0',
            approved: '0'


        }, function(e, o) {
            if (e == "email_used") {
                res.render('signin', { status: 'failed', error: "Email is already in use.Please use any  other email." });
            } else {
                if (e) {
                    AM.manualLogin(req.user.emails[0].value, req.user.id, function(e, o) {
                        if (e) {
                            res.render('signin', { status: 'failed' });
                        } else {
                            req.session.user = o;
                            req.session.user.password = req.user.id;
                            console.log(req.session.user);
                            //              if (req.param('agree') != undefined){
                            //              res.cookie('email', o.email, { maxAge: 900000 });
                            //              res.cookie('pass', o.pass, { maxAge: 900000 });
                            //              res.cookie('id', o._id, { maxAge: 900000 });
                            //              }
                            AM.addGroupId(req.session.user, function(err, data) {
                                req.session.user = data;
                                req.session.user.password = req.user.id;
                                if (req.session.user != null && req.session.user != undefined) {

                                    visitor.pageview(" - Login with Facebook", "Login with Facebook", "http://dashboard.nemlevering.dk").event("Login with Facebook", "Login with Facebook", "http://dashboard.nemlevering.dk").send();
                                    var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                                    var data = {
                                        event_type: "Login with Facebook", // required
                                        country: req.session.user.codeISO,
                                        platform: "WEB",
                                        user_properties: {
                                            Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                                            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                                            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                                            Email: req.session.user.email,
                                            Phone: req.session.user.phone,
                                            Country: req.session.user.codeISO
                                        }

                                    }

                                    var data1 = {
                                        event_type: "Login", // required
                                        country: req.session.user.codeISO,
                                        platform: "WEB",
                                        user_properties: {
                                            Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                                            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                                            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                                            Email: req.session.user.email,
                                            Phone: req.session.user.phone,
                                            Country: req.session.user.codeISO
                                        }

                                    }
                                    amplitude.track(data1);
                                    amplitude.track(data);

                                    mixpanel.track("Login with Facebook", {
                                        distinct_id: req.session.user._id,
                                        email: req.session.user.email,
                                        name: req.session.user.name,
                                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                                        Email: req.session.user.email,
                                        Phone: req.session.user.phone,
                                        Country: req.session.user.codeISO,
                                        Host: req.headers.host

                                    });

                                    mixpanel.track("Login", {
                                        distinct_id: req.session.user._id,
                                        email: req.session.user.email,
                                        name: req.session.user.name,
                                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                                        Email: req.session.user.email,
                                        Phone: req.session.user.phone,
                                        Country: req.session.user.codeISO,
                                        Host: req.headers.host

                                    });

                                    var date = new Date();

                                    var hour = date.getHours();
                                    hour = (hour < 10 ? "0" : "") + hour;

                                    var min = date.getMinutes();
                                    min = (min < 10 ? "0" : "") + min;

                                    var sec = date.getSeconds();
                                    sec = (sec < 10 ? "0" : "") + sec;

                                    var year = date.getFullYear();

                                    var month = date.getMonth() + 1;
                                    month = (month < 10 ? "0" : "") + month;

                                    var day = date.getDate();
                                    day = (day < 10 ? "0" : "") + day;
                                    AM.getTrips({ userID: req.session.user._id, groupId: req.session.user.groupId, sdate: "\"" + day + "/" + month + "/" + year + "\"" }, function(e, o) {
                                        if (o.length <= 0) {
                                            res.redirect('/')
                                        } else {
                                            res.redirect('/')
                                        }
                                    });
                                } else {
                                    res.redirect('/');
                                }

                            });
                        }
                    });
                } else {
                    var result = "{'status':'success'}";
                    result = result.replace(/\'/g, '"');
                    req.session.user = o;
                    req.session.user.password = req.user.id;
                    AM.addGroupId(req.session.user, function(err, data) {
                        req.session.user = data;
                        req.session.user.password = req.user.id;

                        if (req.session.user == null && req.session.user == undefined) {
                            res.render('signin', {});
                        } else {
                            //              visitor.pageview(" - Signup with Facebook", "Signup with Facebook", "http://dashboard.nemlevering.dk").event("Signup with Facebook", "Signup with Facebook", "http://dashboard.nemlevering.dk").send();
                            //              var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                            //              var data = {
                            //              event_type: "Signup with Facebook" // required

                            //              }
                            //              var data1 = {
                            //              event_type: "Signup" // required

                            //              }
                            //              amplitude.track(data);
                            //              amplitude.track(data1);
                            //console.log(o);
                            res.redirect('/more-info');

                        }
                    });
                }
            }
        });

        //  res.redirect('/');
    });

router.get('/more-info', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('more-info', { udata: req.session.user, countries: CT, event: '3' });
    } else {
        res.redirect('/');
    }


});

router.post('/more-info', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {
        var code = CT.filter(function(item) {
            return item.code == req.param('country');
        });
        AM.updateUserInfo({
            phone: req.param('mbl'),
            ccode: code[0].dial_code,
            codeISO: req.param('country'),
            buyer: req.param('buyer') != undefined ? '1' : '0',
            freightForwarder: req.param('ff') != undefined ? '1' : '0',
            carrier: req.param('transporter') != undefined ? '1' : '0',
            userID: req.session.user._id

        }, function(e, o) {

            if (e) {
                var result = "{'status':'" + e + "'}";
                result = result.replace(/\'/g, '"');
                res.render('signup-multi', { status: 'failed', countries: CT, error: e });
            } else {

                var result = "{'status':'success'}";
                result = result.replace(/\'/g, '"');
                req.session.user = o;
                if (req.session.user == null && req.session.user == undefined) {
                    res.render('signin', { error: '' });
                } else {

                    visitor.pageview(" - Signup with Facebook", "Signup with Facebook", "http://dashboard.nemlevering.dk").event("Signup with Email", "Signup with Facebook", "http://dashboard.nemlevering.dk").send();
                    var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                    var data = {
                        event_type: "Signup with Facebook", // required
                        country: req.session.user.codeISO,
                        platform: "WEB",
                        user_properties: {
                            Freight_Forwarder: req.session.user.carrier == '1' ? 'Yes' : 'No',
                            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                            Email: req.session.user.email,
                            Phone: req.session.user.phone,
                            Country: req.session.user.codeISO
                        }

                    }

                    var data1 = {
                        event_type: "Signup", // required
                        country: req.session.user.codeISO,
                        platform: "WEB",
                        user_properties: {
                            Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                            Email: req.session.user.email,
                            Phone: req.session.user.phone,
                            Country: req.session.user.codeISO
                        }

                    }

                    amplitude.track(data1);

                    amplitude.track(data);

                    mixpanel.track("Signup with Facebook", {
                        distinct_id: req.session.user._id,
                        email: req.session.user.email,
                        name: req.session.user.name,
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO,
                        Host: req.headers.host

                    });

                    mixpanel.track("Signup", {
                        distinct_id: req.session.user._id,
                        email: req.session.user.email,
                        name: req.session.user.name,
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO,
                        Host: req.headers.host

                    });
                    //console.log(o);
                    if (req.session.user.carrier == 1) {
                        res.redirect('/onboarding/select-type');
                    } else {
                        res.redirect('/');
                    }

                }
            }




        });
    } else {
        res.redirect('/');
    }

});

router.post('/fbs', function(req, res) {

    AM.addNewAccountM({
        name: req.param('name'),
        email: req.param('email'),
        ccode: req.param('ccode'),
        phone: req.param('mbl'),
        category: req.param('cat'),
        pass: req.param('pass'),
        buyer: '1',
        freightForwarder: '1',
        carrier: '1',
        shortName: req.param('name').charAt(0),
        imagePath: '',
        facebookRegistration: '1'


    }, function(e, o) {
        if (e) {
            var result = "{'status':'" + e + "'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        } else {
            var result = "{'status':'success','data':" + o + "}";
            result = result.replace(/\'/g, '"');

            res.status(200).send(result);
        }
    });



});




router.get('/buyer', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('buyer', { udata: req.session.user });
    } else {
        res.redirect('/');
    }
});
router.get('/driver', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('driver', { udata: req.session.user });
    } else {
        res.redirect('/');
    }
});
router.get('/invite', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('invite', { udata: req.session.user });
    } else {
        res.redirect('/');
    }
});

router.get('/invitedriver', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('inviteDriver', { udata: req.session.user });
    } else {
        res.redirect('/');
    }
});

router.get('/security', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('security', { udata: req.session.user });
    } else {
        res.redirect('/');
    }
});
router.get('/profile', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {

        var bank = {
            accountNumber: '',
            holderName: '',
            bankName: '',
            swift_iban: '',
            international: '0',
            address: ''

        }

        AM.getUserAddress(req.session.user._id, function(e, o) {

            if (!o) {
                AM.getUserBank(req.session.user._id, function(err, obj) {

                    if (!obj) {
                        res.render('profile', { udata: req.session.user, countries: CT, address: "na", bankdetails: bank });
                    } else {
                        res.render('profile', { udata: req.session.user, countries: CT, address: "na", bankdetails: obj });
                    }

                });

            } else {
                AM.getUserBank(req.session.user._id, function(err, obj) {

                    if (!obj) {
                        res.render('profile', { udata: req.session.user, countries: CT, address: o.address, bankdetails: bank });
                    } else {
                        res.render('profile', { udata: req.session.user, countries: CT, address: o.address, bankdetails: obj });
                    }

                });

            }


        });

    } else {
        res.redirect('/');
    }
});
router.get('/profile/notifications', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        AM.getProfileSettings(req.session.user._id, function(e, o) {

            if (!o) {
                res.render('notifications', { udata: req.session.user, settings: [] });
            } else {
                res.render('notifications', { udata: req.session.user, settings: o });
            }

        });

    } else {
        res.redirect('/');
    }
});

router.post('/setProfileSettings/:enabled/:others/:reservation/:confirmation/:recommendation/:general/:reminder/:dailyReport/:dailyOverview/:weeklyOverview/:userID', function(req, res) {

    AM.setProfileSettings({
        enabled: req.params.enabled == "true" ? true : false,
        messageFromOtherUsers: req.params.others == "true" ? true : false,
        reservationUpdates: req.params.reservation == "true" ? true : false,
        confirmationUpdates: req.params.confirmation == "true" ? true : false,
        recommendations: req.params.recommendation == "true" ? true : false,
        generalNotifications: req.params.general == "true" ? true : false,
        reminders: req.params.reminder == "true" ? true : false,

        scheduledDailyReport: req.params.dailyReport == "true" ? true : false,
        scheduledDailyOverview: req.params.dailyOverview == "true" ? true : false,
        scheduledWeeklyOverview: req.params.weeklyOverview == "true" ? true : false,

        userID: getObjectId(req.params.userID)

    }, function(e, o) {

        if (o) {
            res.status(200).send("Success");
        } else {
            res.status(400).send("Failed");
        }


    });


});

router.get('/tav', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('tav', { udata: req.session.user });
    } else {
        res.redirect('/');
    }
});
router.get('/projects', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('projects', { udata: req.session.user });
    } else {
        res.redirect('/');
    }
});
router.get('/payments', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('payments', { udata: req.session.user });
    } else {
        res.redirect('/');
    }
});


router.post('/cmd', function(req, res) {

    AM.markCargoDelivered({
        status: 3,
        cargoID: req.param('cargoID'),
        userID: req.param('userID')
    }, function(e, o) {

        if (e) {
            console.log(e);
            var result = "{'status':'failed'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        } else {
            console.log(o);
            var result = "{'status':'success'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);

        }

    });

});
router.post('/mcdW', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {

        AM.markCargoDelivered({
            status: req.param('status'),
            cargoID: req.param('cargoID'),
            userID: req.session.user._id
        }, function(e, o) {

            if (e) {
                res.redirect('/cargo');
            } else {
                res.redirect('/cargo');

            }

        })
    } else {
        res.redirect('/');
    }

});
router.post('/pushLoc', function(req, res) {

    AM.updateLocation({
        lat: req.param('lat'),
        lng: req.param('lng'),
        userID: req.param('userID')
    }, function(e, o) {

        if (e) {
            console.log(e);
            var result = "{'status':'failed'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        } else {
            console.log(o);
            var result = "{'status':'success'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);

        }

    })

});
router.get('/csp', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {


        res.render('prototype', { udata: req.session.user });

    } else {
        res.redirect('/');
    }

});

router.get('/organization', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {

        if (req.session.user.buyer == '1' && req.session.user.carrier != '1') {
            res.render('buyerOrganization', { udata: req.session.user });
        } else {
            var bank = {
                accountNumber: '',
                holderName: '',
                bankName: '',
                swift_iban: '',
                international: '0',
                address: ''
            }
            AM.getUserBank(req.session.user._id, function(err, obj) {

                if (!obj) {
                    if (!req.session.user.hasOrganized) {
                        res.render('organization', { udata: req.session.user, bankdetails: bank });
                    } else {
                        res.render('updateOrganization', { udata: req.session.user, bankdetails: bank });
                    }
                } else {
                    if (!req.session.user.hasOrganized) {
                        res.render('organization', { udata: req.session.user, bankdetails: obj });
                    } else {
                        res.render('updateOrganization', { udata: req.session.user, bankdetails: obj });
                    }
                }

            });
        }
    } else {
        res.redirect('/');
    }

});


router.post('/updateProfile', function(req, res) {
    var form = new formidable.IncomingForm();
    //"/home/ubuntu/fac/uploads/
    //"/home/ttnd/Documents/image_upload/
    form.uploadDir = "/home/ubuntu/fac/uploads/";
    form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
        AM.updateUser({
            name: fields.name,
            email: fields.email,
            ccode: fields.ccode,
            phone: fields.mbl,
            shortName: fields.name.charAt(0),
            userID: req.session.user._id
        }, function(e, o) {

            if (e) {
                if (files.photo.name == "") {
                    res.writeHead(400, { 'content-type': 'text/plain' });
                    res.write('received upload:\n\n');
                }
                console.log('Failed Profile settings update:' + e);
            } else {
                console.log('Success updating profile settings');

                AM.getAccountByEmail(o && o.email, function(err, user) {
                    req.session.user = user;
                    res.redirect('/profile');
                })
            }

        });
    });
    form.on('end', function(fields, files) {
        if (this.openedFiles[0].size) {
            AM.updatePhoto({
                imagePath: this.openedFiles[0].path,
                userID: req.session.user._id
            }, function(e, o) {

                if (e) {
                    console.log(e);
                } else {
                    console.log(o);
                }
            });
        }
    });
});



router.delete('/removeFile', function(req, res) {

    var filePath = req.query.filePath;
    fs.unlink(filePath, function(err) {
        if (err) return console.log(err);

        res.send({
            status: "200",
            responseType: "string",
            response: "success"
        });
    });
});

router.delete('/removeFleetFile', function(req, res) {

    var filePath = req.query.filePath;
    var truckID = req.query.truckID;

    fs.unlink(filePath, function(err) {
        if (err) {
            return console.log(err);
        } else {
            AM.updateTruckImage(filePath, truckID, function(err, data) {
                return;
            });
        }
    });
});

router.delete('/removeOrganizeFile', function(req, res) {
    var filePath = req.query.filePath;
    var user = req.session.user;


    fs.unlink(filePath, function(err) {
        if (err) {
            return console.log(err);
        } else {
            AM.updateOraganizeFile(filePath, user, function(err, data) {
                res.send({
                    status: "200",
                    responseType: "string",
                    response: "success"
                });
            });
        }
    });
});



router.post('/upload', function(req, res) {
    console.log("Running");
    var form = new formidable.IncomingForm();
    //"/home/ubuntu/fac/uploads/
    form.uploadDir = "/home/ubuntu/fac/uploads/";
    form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
        console.log(fields);
    });
    form.on('file', function(name, file) {
        res.writeHead(200, { 'content-type': 'text/plain' });
        //      res.write('received upload:\n\n');
        res.end(file.path);
    });
});

router.post('/fleetUpload', function(req, res) {

    var form = new formidable.IncomingForm();
    //"/home/ubuntu/fac/uploads/    
    var pwd = __dirname.substr(0, __dirname.lastIndexOf('/'));
    form.uploadDir = path.join(pwd, "image_upload/");
    form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
        console.log(fields);
    });
    //Handling session of the user
    if (req.session.user == null && req.session.user == undefined) {
        res.render('signin', { error: '' });
    } else {
        form.on('file', function(name, file) {
            res.writeHead(200, { 'content-type': 'text/plain' });
            var filePath = 'image_upload/' + file.path.substr(file.path.lastIndexOf('/') + 1);
            res.end(filePath);
        });
    }

});

router.get('/home/ubuntu/fac/uploads/:file', function(req, res) {
    file = req.params.file;
    var dirname = "/home/ubuntu/fac/";
    var img = fs.readFileSync(dirname + "uploads/" + file);
    res.writeHead(200, { 'Content-Type': 'image/jpg' });
    res.end(img, 'binary');

});
router.post('/uDetails', function(req, res) {

    AM.updateUser({
        name: req.param('name'),
        email: req.param('email'),
        ccode: req.param('ccode'),
        phone: req.param('mbl'),
        shortName: req.param('name').charAt(0),
        userID: req.param('id')
    }, function(e, o) {

        if (e) {
            console.log(e);
            var result = "{'status':'failed'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        } else {
            console.log(o);
            var result = "{'status':'success'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);

        }

    });
});
router.post('/uPhoto', function(req, res) {

    AM.updatePhoto({
        imagePath: req.param('path'),
        userID: req.param('id')
    }, function(e, o) {

        if (e) {
            console.log(e);
            var result = "{'status':'failed'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);
        } else {
            console.log(o);
            var result = "{'status':'success'}";
            result = result.replace(/\'/g, '"');
            res.status(200).send(result);

        }

    });
});

router.get('/tdeliveries', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {

        AM.todaysDeliveries({ userID: req.session.user._id, sdate: req.param('date') }, function(e, o) {
            if (o) {
                if (o.length <= 0) {
                    res.render('noDeliveries', { title: 'Today\'s Deliveries : Nemlevering', page: '/cct', go: 'Today\'s Deliveries', udata: req.session.user, userID: req.session.user._id, kind: 'Delivery', category: '', message: 'You have no deliveries planned for this day', description: 'Please check with another dates', date: req.param('date') });
                } else {

                    res.render('today_delivery', { title: 'Today\'s Deliveries :: Nemlevering', page: '/cct', udata: req.session.user, userID: req.session.user._id, loadData: o, category: 'cargo', date: req.param('date') });
                }


            } else {
                res.redirect("/tdeliveries?date=" + req.param('date'));
            }

            //          res.render('today_delivery',{udata:req.session.user, date:req.param('date')});
        });
    } else {
        res.redirect('/');
    }

});
router.get('/trip/planned', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {
        if (req.param('vehicle') == 'all') {
            AM.plannedTrips({ userID: req.session.user._id, groupId: req.session.user.groupId, sdate: req.param('date') }, function(e, o) {

                if (o) {
                    if (o.length <= 0) {
                        res.render('noDeliveries', { title: 'Planned Trips', page: '/cargo/today/create', go: 'Planned Trips', udata: req.session.user, userID: req.session.user._id, kind: 'Delivery', category: '', message: 'You have no deliveries planned for this day', description: 'Please check with another dates', date: req.param('date') });
                    } else {


                        AM.getTrucks({
                            userID: req.session.user._id,
                            groupId: req.session.user.groupId

                        }, function(err, data) {

                            if (data) {
                                if (data.length > 0) {
                                    res.render('planned_trips', { title: 'Planned Trips', page: '/cargo/today/create', udata: req.session.user, userID: req.session.user._id, loadData: o, category: 'cargo', date: req.param('date'), trucks: data, vehicle: req.param('vehicle') });
                                } else {
                                    res.render('planned_trips', { title: 'Planned Trips', page: '/cargo/today/create', udata: req.session.user, userID: req.session.user._id, loadData: o, category: 'cargo', date: req.param('date'), trucks: [{ "identifier": "You don't have any trucks yet!", "_id": "93", }], vehicle: req.param('vehicle') });
                                }
                            }

                        });


                    }


                } else {
                    res.redirect("/trip/planned?date=" + req.param('date') + "&vehicle=all");
                }
            });

            //          res.render('planned_trips',{udata:req.session.user, date:req.param('date')});
        } else {

            AM.plannedTripsVehicleWise({ userID: req.session.user._id, groupId: req.session.user.groupId, sdate: req.param('date'), vehicle: req.param('vehicle') }, function(e, o) {

                if (o) {

                    if (o.length <= 0) {
                        res.render('noDeliveries', { title: 'Planned Trips : Nemlevering', page: '/cargo/today/create', go: 'Planned Trips', udata: req.session.user, userID: req.session.user._id, kind: 'Delivery', category: '', message: 'You have no deliveries planned for this day', description: 'Please check with another dates', date: req.param('date') });
                    } else {


                        AM.getTrucks({
                            userID: req.session.user._id,
                            groupId: req.session.user.groupId

                        }, function(err, data) {

                            if (data) {
                                if (data.length > 0) {
                                    res.render('planned_trips', { title: 'Planned Trips :: Nemlevering', page: '/cargo/today/create', udata: req.session.user, userID: req.session.user._id, loadData: o, category: 'cargo', date: req.param('date'), trucks: data, vehicle: req.param('vehicle') });
                                } else {
                                    res.render('planned_trips', { title: 'Planned Trips :: Nemlevering', page: '/cargo/today/create', udata: req.session.user, userID: req.session.user._id, loadData: o, category: 'cargo', date: req.param('date'), trucks: [{ "identifier": "You don't have any trucks yet!", "_id": "93", }], vehicle: req.param('vehicle') });
                                }
                            }

                        });


                    }


                } else {
                    res.redirect("/trip/planned?date=" + req.param('date') + "&vehicle=all");
                }
            });

        }

    } else {
        res.redirect('/');
    }

});

router.get('/cct', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {

        data = { user_id: req.session.user._id, groupId: req.session.user.groupId };

        CM.getAllContacts(data, function(e, o) {

            if (e) {
                console.log(e);
                res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc' });
            } else {
                if (o.length <= 0) {
                    res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc' });
                } else {
                    res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: o, category: 'cc' });
                }

            }
        });


    } else {
        res.redirect('/');
    }

});
router.post('/cct', function(req, res, next) {
    var picDate = req.param('pickupDate').replace(/\//g, "-");

    var delDate = req.param('deliveryDate').replace(/\//g, "-");

    console.log(delDate);
    AM.createLoad({
        name: req.param('name'),
        ClientID: req.param('clientID'),
        deliveryId: req.param('name'),
        origin: req.param('origin'),
        destination: req.param('destination'),
        pickupTimeFrom: req.param('picktimeFrom'),
        pickupTimeTo: req.param('picktimeTo'),
        deliverTimeFrom: req.param('deltimeFrom'),
        deliverTimeTo: req.param('deltimeTo'),
        deliveryDate: delDate,
        pickupDate: picDate,
        typeLoad: req.param('typeLoad'),
        otherDetails: req.param('other'),
        status: 0,
        userID: new require('mongodb').ObjectID(req.session.user._id),
        groupId: req.session.user.groupId
    }, function(e, o) {

        if (e) res.render('createLoad', { status: 'failed', udata: req.session.user, category: 'cc' });
        else {
            if (req.session.user != null && req.session.user != undefined) {
                visitor.pageview(" - Create Delivery", "Create Delivery", "http://dashboard.nemlevering.dk").event("Create Delivery", "Create Delivery", "http://dashboard.nemlevering.dk").send();
                var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                var data = {
                    event_type: "Create Delivery", // required
                    country: req.session.user.codeISO,
                    platform: "WEB",
                    user_properties: {
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO
                    }

                }
                amplitude.track(data);

                mixpanel.track("Create Delivery", {
                    distinct_id: req.session.user._id,
                    email: req.session.user.email,
                    name: req.session.user.name,
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO,
                    Host: req.headers.host

                });
                var date = new Date();

                var hour = date.getHours();
                hour = (hour < 10 ? "0" : "") + hour;

                var min = date.getMinutes();
                min = (min < 10 ? "0" : "") + min;

                var sec = date.getSeconds();
                sec = (sec < 10 ? "0" : "") + sec;

                var year = date.getFullYear();

                var month = date.getMonth() + 1;
                month = (month < 10 ? "0" : "") + month;

                var day = date.getDate();
                day = (day < 10 ? "0" : "") + day;

                AM.getLoads({ userID: req.session.user._id, groupId: req.session.user.groupId, sdate: month + "-" + day + "-" + year }, function(e, o) {
                    if (o.length <= 0) {
                        res.render('noData', { title: 'Deliveries :: Nemlevering', page: '/cct', go: 'Create Delivery', udata: req.session.user, userID: req.session.user._id, kind: 'Delivery', category: '', message: 'You have no Deliveries', description: 'Deliveries are assigned to a certain trip, allowing you to plan your deliveries and existing capacity. We send you suggested new Deliveries from prospect clients when you have spare capacity on your truck' });
                    } else {

                        res.redirect('/tdeliveries?date=' + delDate);
                    }
                });
            } else {
                res.redirect('/');
            }
        }
    });

});

router.get('/trip/today/create', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {

        req.session.date = req.param('date');

        //res.render('createTrip',{u_id:req.session.user._id, udata:req.session.user, title:'Create Trip :: Nemlevering', category:'ct' });
        AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
            if (!err) {
                console.log(data);
                res.render('createTrip', { u_id: req.session.user._id, drivers: data, udata: req.session.user, title: 'Create Trip :: Nemlevering', category: 'ct' });
            }
        });
    } else {
        res.redirect('/');
    }
});

router.post('/trip/today/create', function(req, res) {


    AM.createTrip({
        name: req.param('name'),
        origin: req.param('origin'),
        destination: req.param('destination'),
        startDateTime: req.param('startDate'),
        endDateTime: req.param('endDate'),
        assigned_vehicle: {},
        scheduled: req.param('scheduled') == undefined ? 0 : 1,
        userID: new require('mongodb').ObjectID(req.session.user._id),
        groupId: req.session.user.groupId
    }, function(e, o) {
        if (e) {
            console.log(e);
            res.render('createTrip', { status: 'failed', udata: req.session.user, userID: req.session.user._id, category: 'ct' });
        } else {
            if (req.session.user != null && req.session.user != undefined) {

                visitor.pageview(" - Create Trip", "Create Trip", "http://dashboard.nemlevering.dk").event("Create Trip", "Create Trip", "http://dashboard.nemlevering.dk").send();
                var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                var data = {
                    event_type: "Create Trip", // required
                    country: req.session.user.codeISO,
                    platform: "WEB",
                    user_properties: {
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO
                    }

                }
                amplitude.track(data);


                mixpanel.track("Create Trip", {
                    distinct_id: req.session.user._id,
                    email: req.session.user.email,
                    name: req.session.user.name,
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO,
                    Host: req.headers.host

                });

                var date = new Date();

                var hour = date.getHours();
                hour = (hour < 10 ? "0" : "") + hour;

                var min = date.getMinutes();
                min = (min < 10 ? "0" : "") + min;

                var sec = date.getSeconds();
                sec = (sec < 10 ? "0" : "") + sec;

                var year = date.getFullYear();

                var month = date.getMonth() + 1;
                month = (month < 10 ? "0" : "") + month;

                var day = date.getDate();
                day = (day < 10 ? "0" : "") + day;
                console.log("'" + day + "/" + month + "/" + year + "'");
                AM.getTrips({ userID: req.session.user._id, groupId: req.session.user.groupId, sdate: day + "-" + month + "-" + year }, function(e, o) {

                    console.log(o);

                    if (o.length <= 0) {
                        res.render('noData', { title: 'Trips :: Nemlevering', page: '/trip/today/create', go: 'Create Trip', udata: req.session.user, kind: 'Trip', category: '', message: 'You have no Trips', description: 'Trips allow you to coordinate Deliveries and deliveries. We send you suggest new Deliveries from prospect clients for future trips, return trips or for nearby pickups when your driver uses our app live on the road.' });
                    } else {
                        res.redirect('/tdeliveries?date=' + req.session.date);
                    }
                });
            } else {
                res.redirect('/');
            }
        }

    });




});

router.get('/cargo/today/create', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {

        data = { user_id: req.session.user._id, groupId: req.session.user.groupId };
        var count = 0000;
        AM.getLoadsCount(req.session.user._id, req.session.user.groupId, function(err, obj) {
            obj = obj + 1;
            CM.getAllContacts(data, function(error, object) {

                if (error) {
                    //console.log(e);
                    AM.getTrips({

                        userID: req.session.user._id,
                        groupId: req.session.user.groupId

                    }, function(e, o) {

                        if (!o) {
                            AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                if (!err) {
                                    res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/ctp', drivers: data });
                                }
                            });
                        } else {

                            if (o.length <= 0) {
                                AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                    if (!err) {
                                        res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/ctp', drivers: data });
                                    }
                                });
                            } else {
                                AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                    if (!err) {
                                        res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: o, old_data: contact_data_empty, page: '/ctp', drivers: data });
                                    }
                                });
                            }

                        }

                    });

                } else {
                    if (object.length <= 0) {
                        AM.getTrips({

                            userID: req.session.user._id,
                            groupId: req.session.user.groupId

                        }, function(e, o) {

                            if (!o) {
                                AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                    if (!err) {
                                        res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/ctp', drivers: data });
                                    }
                                });
                            } else {

                                if (o.length <= 0) {
                                    AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                        if (!err) {
                                            res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/ctp', drivers: data });
                                        }
                                    });
                                } else {
                                    AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                        if (!err) {
                                            res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: [{ "email": "You don't have any contacts yet!", "_id": "93", }], category: 'cc', counter: 0000 + obj, trips: o, old_data: contact_data_empty, page: '/ctp', drivers: data });
                                        }
                                    });
                                }

                            }

                        });
                    } else {
                        AM.getTrips({

                            userID: req.session.user._id,
                            groupId: req.session.user.groupId

                        }, function(e, o) {

                            if (!o) {
                                AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                    if (!err) {
                                        res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: object, category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/ctp', drivers: data });
                                    }
                                });
                            } else {

                                if (o.length <= 0) {
                                    AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                        if (!err) {
                                            res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: object, category: 'cc', counter: 0000 + obj, trips: [{ "name": "No Trips to show", "_id": "-" }], old_data: contact_data_empty, page: '/ctp', drivers: data });
                                        }
                                    });
                                } else {
                                    AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
                                        if (!err) {
                                            res.render('createLoad', { u_id: req.session.user._id, udata: req.session.user, title: 'Create Delivery :: Nemlevering', contacts: object, category: 'cc', counter: 0000 + obj, trips: o, old_data: contact_data_empty, page: '/ctp', drivers: data });
                                        }
                                    });
                                }

                            }

                        });
                    }

                }
            });
        });



    } else {
        res.redirect('/');
    }

});
router.post('/cargo/today/create', function(req, res, next) {
    var picDate = req.param('pickupDate').replace(/\//g, "-");

    var delDate = req.param('deliveryDate').replace(/\//g, "-");

    console.log(delDate);
    AM.createLoad({
        name: req.param('name'),
        ClientID: req.param('clientID'),
        deliveryId: req.param('name'),
        origin: req.param('origin'),
        destination: req.param('destination'),
        pickupTimeFrom: req.param('picktimeFrom'),
        pickupTimeTo: req.param('picktimeTo'),
        deliverTimeFrom: req.param('deltimeFrom'),
        deliverTimeTo: req.param('deltimeTo'),
        deliveryDate: delDate,
        pickupDate: picDate,
        typeLoad: req.param('typeLoad'),
        otherDetails: req.param('other'),
        status: 0,
        userID: new require('mongodb').ObjectID(req.session.user._id),
        groupId: req.session.user.groupId
    }, function(e, o) {

        if (e) res.render('createLoad', { status: 'failed', udata: req.session.user, category: 'cc' });
        else {
            if (req.session.user != null && req.session.user != undefined) {
                visitor.pageview(" - Create Delivery", "Create Delivery", "http://dashboard.nemlevering.dk").event("Create Delivery", "Create Delivery", "http://dashboard.nemlevering.dk").send();
                var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                var data = {
                    event_type: "Create Delivery", // required
                    country: req.session.user.codeISO,
                    platform: "WEB",
                    user_properties: {
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO
                    }

                }
                amplitude.track(data);


                mixpanel.track("Create Delivery", {
                    distinct_id: req.session.user._id,
                    email: req.session.user.email,
                    name: req.session.user.name,
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO,
                    Host: req.headers.host

                });
                var date = new Date();

                var hour = date.getHours();
                hour = (hour < 10 ? "0" : "") + hour;

                var min = date.getMinutes();
                min = (min < 10 ? "0" : "") + min;

                var sec = date.getSeconds();
                sec = (sec < 10 ? "0" : "") + sec;

                var year = date.getFullYear();

                var month = date.getMonth() + 1;
                month = (month < 10 ? "0" : "") + month;

                var day = date.getDate();
                day = (day < 10 ? "0" : "") + day;

                AM.getLoads({ userID: req.session.user._id, groupId: req.session.user.groupId, sdate: month + "-" + day + "-" + year }, function(e, o) {
                    if (o.length <= 0) {
                        res.render('noData', { title: 'Deliveries :: Nemlevering', page: '/cargo/today/create', go: 'Create Delivery', udata: req.session.user, userID: req.session.user._id, kind: 'Delivery', category: '', message: 'You have no Deliveries', description: 'Deliveries are assigned to a certain trip, allowing you to plan your deliveries and existing capacity. We send you suggested new Deliveries from prospect clients when you have spare capacity on your truck' });
                    } else {

                        res.redirect('/trip/planned?date=' + delDate + "&vehicle=all");
                    }
                });
            } else {
                res.redirect('/');
            }
        }
    });

});

router.get('/ctp', function(req, res, next) {
    if (req.session.user != null && req.session.user != undefined) {

        req.session.date = req.param('date');

        //res.render('createTrip',{u_id:req.session.user._id, udata:req.session.user, title:'Create Trip :: Nemlevering', category:'ct' });
        AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
            if (!err) {
                console.log(data);
                res.render('createTrip', { u_id: req.session.user._id, drivers: data, udata: req.session.user, title: 'Create Trip :: Nemlevering', category: 'ct' });
            }
        });
    } else {
        res.redirect('/');
    }
});

router.post('/ctp', function(req, res) {


    AM.createTrip({
        name: req.param('name'),
        origin: req.param('origin'),
        destination: req.param('destination'),
        startDateTime: req.param('startDate'),
        endDateTime: req.param('endDate'),
        assigned_vehicle: {},
        scheduled: req.param('scheduled') == undefined ? 0 : 1,
        userID: new require('mongodb').ObjectID(req.session.user._id),
        groupId: req.session.user.groupId

    }, function(e, o) {
        if (e) {
            console.log(e);
            res.render('createTrip', { status: 'failed', udata: req.session.user, userID: req.session.user._id, category: 'ct' });
        } else {
            if (req.session.user != null && req.session.user != undefined) {

                visitor.pageview(" - Create Trip", "Create Trip", "http://dashboard.nemlevering.dk").event("Create Trip", "Create Trip", "http://dashboard.nemlevering.dk").send();
                var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                var data = {
                    event_type: "Create Trip", // required
                    country: req.session.user.codeISO,
                    platform: "WEB",
                    user_properties: {
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO
                    }

                }
                amplitude.track(data);

                mixpanel.track("Create Trip", {
                    distinct_id: req.session.user._id,
                    email: req.session.user.email,
                    name: req.session.user.name,
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO,
                    Host: req.headers.host

                });

                var date = new Date();

                var hour = date.getHours();
                hour = (hour < 10 ? "0" : "") + hour;

                var min = date.getMinutes();
                min = (min < 10 ? "0" : "") + min;

                var sec = date.getSeconds();
                sec = (sec < 10 ? "0" : "") + sec;

                var year = date.getFullYear();

                var month = date.getMonth() + 1;
                month = (month < 10 ? "0" : "") + month;

                var day = date.getDate();
                day = (day < 10 ? "0" : "") + day;
                console.log("'" + day + "/" + month + "/" + year + "'");
                AM.getTrips({ userID: req.session.user._id, groupId: req.session.user.groupId, sdate: day + "-" + month + "-" + year }, function(e, o) {

                    console.log(o);

                    if (o.length <= 0) {
                        res.render('noData', { title: 'Trips :: Nemlevering', page: '/ctp', go: 'Create Trip', udata: req.session.user, kind: 'Trip', category: '', message: 'You have no Trips', description: 'Trips allow you to coordinate Deliveries and deliveries. We send you suggest new Deliveries from prospect clients for future trips, return trips or for nearby pickups when your driver uses our app live on the road.' });
                    } else {
                        res.redirect('/trip/planned?date=' + req.session.date);
                    }
                });
            } else {
                res.redirect('/');
            }
        }

    });




});

router.get('/forgot-pass', function(req, res) {


    res.render('recover-password', { udata: req.session.user });



});
router.post('/forgot-pass', function(req, res) {


    AM.getAccountByEmail(req.param('email'), function(e, o) {

        if (!o) {
            console.log(e);
            res.status(400).send('We don\'t have your email in our database. Please retry with correct email');
        } else {

            var token = jwt.sign(o, 'lkjshfglkjsdhfgkjasglkajhsdflkjahkljhsdflkjaksljhdlkfajhsglkjhadfglkjhskljhdfglkjhslkdjhfg', {
                expiresIn: '1800s' // expires in 24 hours
            });

            o.token = token;

            ED.dispatchResetPasswordLink(o, function(err, obj) {
                if (err) {
                    console.log(err);
                    res.status(400).send("Sorry, Can't send reset link. We are facing some issues with our email server.");
                } else {
                    res.status(200).send();
                }
            });
        }
    });


});
router.get('/reset-password', function(req, res) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.param('tkn');

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, 'lkjshfglkjsdhfgkjasglkajhsdflkjahkljhsdflkjaksljhdlkfajhsglkjhadfglkjhskljhdfglkjhslkdjhfg', function(err, decoded) {
            if (err) {
                res.render('link-expired', {});
            } else {
                // if everything is good, save to request for use in other routes
                req.session.decoded = decoded;

                //console.log(req.session.decoded._id);

                res.render('reset-password', {});

            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});

router.post('/security', function(req, res) {
    AM.changePassword(req.session.user._id, req.body.oldPass, req.body.password, function(err, data) {
        if (err) {
            res.status(400).send('Email Not Found');
        } else {
            res.render('security', { udata: req.session.user, status: data });
        }
    })
});

router.post('/reset-password', function(req, res) {

    AM.updatePassword(req.session.decoded._id, req.param('pass'), function(e, o) {

        if (!o) {
            res.status(400).send('Email Not Found');
        } else {
            res.status(200).send();
        }

    });

});
router.get('/subscribers', function(req, res) {
    res.redirect('/');
});
router.post('/subscribers', function(req, res) {
    AM.getAccountByEmail(req.param('email'), function(e, o) {

        if (!o) {
            console.log(e);
            res.status(400).send('We don\'t have your email in our database. Please retry with correct email');
        } else {
            var token = jwt.sign(o, 'lkjshfglkjsdhfgkjasglkajhsdflkjahkljhsdflkjaksljhdlkfajhsglkjhadfglkjhskljhdfglkjhslkdjhfg', {
                expiresIn: '5s' // expires in 20 seconds
            });
            res.status(200).send(token);
        }
    });
});

//router.get('/accountsList', function(req, res){

//res.redirect('/subscribers');
//});
//router.post('/accountsList', function(req, res){

//var token = req.param('tkn');

//// decode token
//if (token) {

//// verifies secret and checks exp
//jwt.verify(token, 'lkjshfglkjsdhfgkjasglkajhsdflkjahkljhsdflkjaksljhdlkfajhsglkjhadfglkjhskljhdfglkjhslkdjhfg', function(err, decoded) {
//if (err) {
//res.render('link-expired',{});
//} else {
//// if everything is good, save to request for use in other routes
//req.session.decoded = decoded;

//console.log(req.param('date'));

//AM.getAllRecords({ccode:req.param('cc'),sdate:req.param('date')},function(e, o){
//if(!o)
//{
//res.render('aList',{udata:req.session.user,data: [{"email":"-","name":"-","phone":"-","ccode":"-",}], length:'0', countries:CT,cc:req.param('cc'), date:req.param('date')});
//}
//else
//{

//res.render('aList',{udata:req.session.user,loadData: o, countries:CT, length:o.length, countries:CT,cc:req.param('cc'), date:req.param('date')});
//}
//});

//}
//});

//} else {

//// if there is no token
//// return an error
//return res.status(403).send({
//success: false,
//message: 'No token provided.'
//});

//}

//});

router.get('/trip/assign', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {

        AM.getTrips({

            userID: req.session.user._id,
            groupId: req.session.user.groupId

        }, function(e, o) {

            if (!o) {
                res.render('assign_trip', { udata: req.session.user, u_id: req.session.user._id, loadData: [{ "name": "No Trips to show", "_id": "-", }], cargoName: req.param('name'), cargoID: req.param('id') });
            } else {

                if (o.length <= 0) {
                    res.render('assign_trip', { udata: req.session.user, u_id: req.session.user._id, loadData: [{ "name": "No Trips to show", "_id": "-", }], cargoName: req.param('name'), cargoID: req.param('id') });
                } else {
                    res.render('assign_trip', { udata: req.session.user, u_id: req.session.user._id, loadData: o, cargoName: req.param('name'), cargoID: req.param('id') });
                }

            }

        });

    } else {
        res.redirect('/');
    }

});
router.post('/trip/assign', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {
        AM.assignTrip({
            userID: new require('mongodb').ObjectID(req.session.user._id),
            groupId: req.session.user.groupId,
            cargoID: new require('mongodb').ObjectID(req.param('cargoID')),
            tripID: new require('mongodb').ObjectID(req.param('tripID'))
        }, function(e, o) {

            if (o) {
                res.status(200).send();
            }

        });
    } else {
        res.redirect('/');
    }

});
router.get('/driver/assign', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
            if (!err) {
                res.render('assign_driver', { udata: req.session.user, u_id: req.session.user._id, drivers: data, tripName: req.param('identifier'), tripID: req.param('id') });
            }
        })
    }
})
router.post('/driver/assign', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        AM.driverAvailable(req.session.user, req.param('driver'), function(err, status) {
            if (!err) {
                AM.getTrip({ userID: req.session.user._id, tripID: req.param('tripID') }, function(e, o) {
                    if (!e) {
                        AM.updateTrip({
                            name: o.name,
                            origin: o.origin,
                            destination: o.destination,
                            startDateTime: o.startDateTime,
                            endDateTime: o.endDateTime,
                            userType: o.userType,
                            driver: req.param('driver'),
                            scheduled: o.scheduled,
                            tripID: req.param('tripID'),
                            userID: new require('mongodb').ObjectID(req.session.user._id)
                        }, function(e, o) {
                            if (!e) {
                                res.status(200).send({ status: status, driver: req.param('driver') });
                            }
                        })
                    }
                })
            }
        })
    }
})
router.get('/fleet/assign', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {

        AM.getTrucks({

            userID: req.session.user._id,
            groupId: req.session.user.groupId


        }, function(e, o) {

            if (!o) {
                res.render('assign_truck', { udata: req.session.user, u_id: req.session.user._id, loadData: [{ "name": "No Trucks to show", "_id": "-", }], tripName: req.param('identifier'), tripID: req.param('id') });
            } else {

                if (o.length <= 0) {
                    res.render('assign_truck', { udata: req.session.user, u_id: req.session.user._id, loadData: [{ "name": "No Trucks to show", "_id": "-", }], tripName: req.param('identifier'), tripID: req.param('id') });
                } else {
                    res.render('assign_truck', { udata: req.session.user, u_id: req.session.user._id, loadData: o, tripName: req.param('identifier'), tripID: req.param('id') });
                }

            }

        });

    } else {
        res.redirect('/');
    }

});
router.post('/fleet/assign', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {
        AM.assignTruck({
            userID: new require('mongodb').ObjectID(req.session.user._id),
            truckID: new require('mongodb').ObjectID(req.param('truckID')),
            tripID: new require('mongodb').ObjectID(req.param('tripID'))
        }, function(e, o) {

            if (o) {
                res.status(200).send();
            }

        });
    } else {
        res.redirect('/');
    }

});

//router.get('/manage-admin', function(req, res){
//AM.getAllManagers(function(e, o){
//if(!o)
//{
//res.render('manager-list',{data: [{"_id":"93","email":"-","name":"-","phone":"-","ccode":"-",}], length:'0'});
//}
//else
//{

//res.render('manager-list',{loadData: o, countries:CT, length:o.length});
//}
//});

//});

//router.post('/manage-admin/:permit/:userID', function(req, res){

//AM.updateManager(
//{
//userID:req.params.userID,
//permit:req.params.permit

//},function(e, o){

//if(e)
//{
//res.status(400).send('Failed');
//}
//else
//{
//res.status(200).send('Success');
//}



//});


//});

router.get('/markClientForMonthlyInvoice', function(req, res) {
    var payBy = req.query.monthlyinvoice;
    if (payBy == undefined) {
        payBy = 'all';
    }

    if (req.session.user != null && req.session.user != undefined) {
        AM.getAllBuyers(payBy, function(e, o) {
            if (!o) {
                res.render('markBuyerMonthlyInvoice', {
                    data: [{
                        "_id": "93",
                        "email": "-",
                        "name": "-",
                        "phone": "-",
                        "ccode": "-",
                    }],
                    length: '0',
                    type: payBy
                });
            } else {
                res.render('markBuyerMonthlyInvoice', { loadData: o, countries: CT, length: o.length, type: payBy });
            }
        });
    } else {
        res.redirect('/');
    }
});



router.get('/recentOrders', function(req, res) {

    if (req.session.user == null || req.session.user == undefined) {
        res.redirect('/');
    } else {
        res.render('recentOrders', { udata: req.session.user });
    }

});


router.post('/clientFixedDiscount/:userID', function(req, res) {
    var discount = req.body.discount;
    var fixedPrice5k = req.body.fixedPrice5k;
    var fixedPrice15k = req.body.fixedPrice15k;
    var userID = req.params.userID;
    if (req.session.user != null && req.session.user != undefined) {
        AM.updateBuyerDiscount({
            userID: userID,
            discount: discount,
            fixedPrice5k: fixedPrice5k,
            fixedPrice15k: fixedPrice15k
        }, function(e, o) {
            if (e) {
                res.status(400).send('Failed');
            } else {
                res.status(200).send('Success');
            }
        });
    } else {
        res.redirect('/');
    }
});

router.post('/markClientForMonthlyInvoice/:mark/:userID', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {
        AM.updateBuyer({
            userID: req.params.userID,
            mark: req.params.mark

        }, function(e, o) {

            if (e) {
                res.status(400).send('Failed');
            } else {
                res.status(200).send('Success');
            }



        });
    } else {
        res.redirect('/');
    }


});


router.get('/markCarrierActive', function(req, res) {

    if (req.session.user == null && req.session.user == undefined) {
        res.render('signin', { error: '' });
    } else {

        AM.getAllCarriers(function(e, o) {

            if (!o) {
                res.render('markCarriersActive', { loadData: [], countries: CT, data: [{ "_id": "93", "email": "-", "name": "-", "phone": "-", "ccode": "-", }], length: '0' });
            } else {
                res.render('markCarriersActive', { loadData: o, countries: CT, length: o.length });
            }

        });
    }

});

router.post('/markCarrierActive/:mark/:userID', function(req, res) {

    AM.updateCarrier({
        userID: req.params.userID,
        mark: req.params.mark

    }, function(e, o) {

        if (e) {
            res.status(400).send('Failed');
        } else {
            res.status(200).send('Success');
        }



    });


});

router.get('/deliveriesSubmit', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('deliveriesSubmit', { udata: req.session.user });
    } else {
        res.redirect('/');
    }
});

router.get('/activeCarrier', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {


        AM.getAllActiveCarriers(req.param('country'), function(e, o) {
            if (!o) {
                res.render('active_carrier', { loadData: [], countries: CT, country: req.param('country') });
            } else {
                res.render('active_carrier', { loadData: o, countries: CT, country: req.param('country') });
            }
        });
    } else {
        res.redirect('/');
    }
});

router.get('/weeklydeliveries', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('buyer_weekly_deliveries.jade', { udata: req.session.user, loadData: [] });

    } else {
        res.redirect('/');
    }
});

/*Get weekly scheduled deliveries created by upload file*/
router.get('/route', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        AM.getWeeklyPlan(req.session.user._id, function(e, weekPlan) {
            if (weekPlan.length <= 0) {
                res.render('all_planned_deliveries.jade', { udata: req.session.user, loadData: [], weekPlan: [] });
            } else {
                AM.getRoutesWeekPlan(req.session.user._id, function(err, routes) {
                    if (routes.length <= 0) {
                        res.render('all_planned_deliveries.jade', { udata: req.session.user, loadData: [], weekPlan: [] });
                    } else {
                        res.render('all_planned_deliveries.jade', { udata: req.session.user, loadData: [], weekPlan: weekPlan, routes: routes });
                    }
                })
            }
        });


    } else {
        res.redirect('/');
    }
});
router.get('/livetracking', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('live_tracking.jade', { udata: req.session.user, loadData: [], deliveryStatus: enumConstant.SCHEDULED_DELIVERY_STATUS });

    } else {
        res.redirect('/');
    }
});


router.get('/deliveryLiveTracking', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('view_schedule_delivery.jade', { udata: req.session.user, status: enumConstant.SCHEDULED_DELIVERY_STATUS });

    } else {
        res.redirect('/');
    }
});

router.get('/route/:id', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        res.render('week_deliveries_plan.jade', { udata: req.session.user, loadData: [], status: enumConstant.SCHEDULED_DELIVERY_STATUS });

    } else {
        res.redirect('/');
    }
});


router.get('/dayroute', function(req, res) {
    var day = req.query.day;

    if (req.session.user != null && req.session.user != undefined) {
        res.render('day_deliveries_plan.jade', { udata: req.session.user, loadData: [], status: enumConstant.SCHEDULED_DELIVERY_STATUS });

    } else {
        res.redirect('/');
    }
});


router.get('/downloadtemplate', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        var workingDir = __dirname.substr(0, __dirname.lastIndexOf('/'));
        var file = workingDir + '/uploads/Template_to_upload_deliveries .xlsx';

        var filename = path.basename(file);
        var mimetype = mime.lookup(file);

        res.setHeader('Content-disposition', 'attachment; filename=' + filename);

        res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        //res.setHeader('Content-disposition', 'attachment; filename=data.xlsx');
        //res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.download(file);

        //var filestream = fs.createReadStream(file);
        //filestream.pipe(res);

        // var workingDir = __dirname.substr(0,__dirname.lastIndexOf('/'));
        // var file = workingDir + '/uploads/Template_to_upload_deliveries .xlsx';
        // res.download(file);

    } else {
        res.redirect('/');
    }
});

/**
 * get routes of a day of week with delivery detail
 */
router.get('/routes/:week/:day*?', function(req, res) {
    var userId = req.query.userId;
    if (_.isEmpty(userId)) {
        userId = req.session.user._id;
    }
    if (req.session.user != null && req.session.user != undefined) {
        AM.getDayRoutes({
            week: req.params.week,
            day: req.params.day,
            userId: userId
        }, function(error, routes) {

            if (error) {
                res.status(400).send('Failed');
            } else {
                AM.getWeekDaysScheduledDeliveries({
                    week: req.params.week,
                    day: req.params.day,
                    userId: userId,
                    routes: routes
                }, function(err, deliveries, scheduledRoutes) {
                    routes = scheduledRoutes;
                    if (error) {
                        res.status(400).send('Failed');
                    } else {
                        var asyncArray = [];
                        _.forEach(routes, function(dayRoute) {
                            _.forEach(dayRoute && dayRoute.solution && dayRoute.solution.routes, function(route) {
                                var f = function(callback) {
                                    AM.getAccountByUserId(route.driverId, function(err, driverDetail) {
                                        if (driverDetail) {
                                            route.driver = { name: driverDetail.name, email: driverDetail.email, phone: driverDetail.phone };
                                        }
                                        callback();
                                    });
                                };
                                asyncArray.push(f);
                            });
                        });
                        async.parallel(asyncArray, function(asyncError, done) {
                            if (done) {
                                res.status(200).send({ routes: routes, weekPlan: deliveries });
                            } else {
                                res.status(400).send('Failed');
                            }
                        })

                    }
                });
            }
        })

    } else {
        res.redirect('/');
    }
});

router.get('/livestatus/:id', function(req, res) {
    var userId = req.query.userId;
    if (_.isEmpty(userId)) {
        userId = req.session.user._id;
    }
    if (req.session.user == null || req.session.user == undefined) {
        res.status(401).send({ message: 'error in delete' });
    } else {
        var id = req.params.id;
        AM.getLiveStatus(id, function(err, obj) {
            var eta = {};
            var origin = '';
            var etarequest = {};
            if (obj && obj.carrier) {
                AM.getAccountByUserId(obj.carrier.accountId, function(err, driverDetail) {
                    AM.getTruck({ userID: userId, truckID: obj.carrier.vehicle && obj.carrier.vehicle.id }, function(error, truck) {
                        console.log('truck details:', truck);
                        if (obj.carrier.status == 7) {
                            return res.status(200).send({ progressLog: obj.carrier.progressLog, status: obj.carrier.status, eta: eta, driver: driverDetail });
                        } else {
                            if (truck && truck.liveDelivery) {
                                etarequest.origin = (truck.liveDelivery.location && truck.liveDelivery.location.coordinates) ? ('' + truck.liveDelivery.location.coordinates[1] + ',' + truck.liveDelivery.location.coordinates[0]) : obj.pickupaddress;
                                etarequest.destination = obj.deliveryaddress;
                                etarequest.status = 8;
                                helperUtil.getDeliveriesETA(etarequest, function(etaError, etaSuccess) {
                                    console.log('google distance response', etaSuccess);
                                    if (etaError) {
                                        console.log('google distance error', etaError);
                                    } else {
                                        eta = etaSuccess && etaSuccess.eta;
                                    }
                                    return res.status(200).send({ status: obj.carrier.status, eta: eta, location: true, locationCoordinates: truck.liveDelivery.location && truck.liveDelivery.location.coordinates, driver: driverDetail });
                                });

                            } else {
                                return res.status(200).send({ status: obj.carrier.status, location: false, driver: driverDetail });
                            }
                        }

                    });
                });
            } else {
                etarequest.origin = obj.pickupaddress;
                etarequest.destination = obj.deliveryaddress;
                etarequest.pickupdeadline = obj.pickupdeadline;
                etarequest.deliverydate = obj.deliverydate;
                etarequest.status = 0;
                helperUtil.getDeliveriesETA(etarequest, function(etaError, etaSuccess) {
                    if (etaError) {

                    } else {
                        eta = etaSuccess && etaSuccess.eta;
                    }
                    return res.status(200).send({ status: 0, eta: eta });
                });
            }

        });
    }
});

router.get('/location', function(req, res) {
    if (req.session.user == null || req.session.user == undefined) {
        res.status(401).send({ message: 'error in delete' });
    } else {
        var vehicles = JSON.parse(req.query.vehicles);
        var asyncArray = [];
        _.forEach(vehicles, function(vehicle) {
            var asyncFunction = function(callback) {
                AM.getTruck({ userID: req.session.user._id, truckID: vehicle.vehicleId }, function(error, truck) {
                    console.log('truck details:', truck);
                    if (truck && truck.liveDelivery && truck.liveDelivery.available) {
                        vehicle.location = true;
                        vehicle.locationCoordinates = truck.liveDelivery.location && truck.liveDelivery.location.coordinates;
                        callback();
                    } else {
                        callback();
                    }
                });
            };
            asyncArray.push(asyncFunction);
        });
        async.parallel(asyncArray, function(err, done) {
            return res.status(200).send({ vehicles: vehicles });
        });
    }
});

router.get('/search/deliveries/:searchText', function(req, res) {
    if (req.session.user == null || req.session.user == undefined) {
        res.status(401).send({ message: 'Unauthorized' });
    } else {
        var searchText = req.params.searchText;
        var date = req.query.date;

        AM.searchDeliveries(searchText, date, req.session.user._id, function(err, response) {
            if (response) {
                var asyncArray = [];
                _.forEach(response, function(obj) {
                    var asyncFunction = function(callback) {
                        var eta = {};
                        var origin = '';
                        var etarequest = {};
                        if (obj && obj.carrier) {
                            AM.getTruck({ userID: req.session.user._id, truckID: obj.carrier.vehicle && obj.carrier.vehicle.id }, function(error, truck) {
                                if (obj.carrier.status == 7) {
                                    callback();
                                } else {
                                    if (truck && truck.liveDelivery) {
                                        etarequest.origin = (truck.liveDelivery.location && truck.liveDelivery.location.coordinates) ? ('' + truck.liveDelivery.location.coordinates[1] + ',' + truck.liveDelivery.location.coordinates[0]) : obj.pickupaddress;
                                        etarequest.destination = obj.deliveryaddress;
                                        etarequest.status = 8;
                                        helperUtil.getDeliveriesETA(etarequest, function(etaError, etaSuccess) {
                                            console.log('google distance response', etaSuccess);
                                            if (etaError) {
                                                console.log('google distance error', etaError);
                                            } else {
                                                obj.eta = etaSuccess && etaSuccess.eta;
                                            }
                                            callback();
                                        });

                                    } else {
                                        callback();
                                    }
                                }

                            });
                        } else {
                            etarequest.origin = obj.pickupaddress;
                            etarequest.destination = obj.deliveryaddress;
                            etarequest.pickupdeadline = obj.pickupdeadline;
                            etarequest.deliverydate = obj.deliverydate;
                            etarequest.status = 0;
                            helperUtil.getDeliveriesETA(etarequest, function(etaError, etaSuccess) {
                                if (etaError) {} else {
                                    obj.eta = etaSuccess && etaSuccess.eta;
                                }
                                callback();
                            });
                        }
                    };
                    asyncArray.push(asyncFunction);
                });
                async.parallel(asyncArray, function(asyncError, asyncSuccess) {
                    return res.status(200).send({ deliveries: response });
                });
            } else {
                res.status(400).send({ error: err });
            }
        })
    }
});

router.delete('/deleteWeekPlan/:week', function(req, res) {

    if (req.session.user == null || req.session.user == undefined) {
        res.status(401).send({ message: 'error in delete' });
    } else {
        var week = req.params.week;
        var userId = req.query.userId;
        if (_.isEmpty(userId)) {
            userId = req.session.user._id;
        }

        AM.removeWeekPlan(week, userId, function(err, obj) {
            if (obj) {
                return res.status(204).send();
            } else {
                return res.status(500).json(err);
            }
        });
    }
});

router.get('/checkDeliveryStarted/:week', function(req, res) {

    if (req.session.user == null || req.session.user == undefined) {
        res.status(401).send({ message: 'error in get' });
    } else {
        var week = req.params.week;
        var userId = req.query.userId;
        var currentWeek = req.query.currentWeek;

        if (_.isEmpty(userId)) {
            userId = req.session.user._id;
        }

        AM.checkDeliveryStarted(week, userId, currentWeek, function(err, obj) {
            if (obj) {
                res.send({ data: '' });
            } else {
                res.send({ data: err });
            }
        });

    }
});

router.delete('/deleteRoute', function(req, res) {
    var routeId = req.query.routeId;
    var routeDate = req.query.routeDate;
    var vehicleId = req.query.vehicleId;
    var deliveryIds = req.query.deliveryIds;

    if (req.session.user == null || req.session.user == undefined) {
        res.status(401).send({ message: 'error in delete' });
    } else {
        AM.deleteRoutes(routeId, routeDate, vehicleId, deliveryIds, function(err, obj) {
            if (obj) {
                return res.status(204).send();
            } else {
                return res.status(500).json(err);
            }
        });
    }
});


router.post('/markClientScheduled/:mark/:userID', function(req, res) {

    AM.markClientScheduled({
        userID: req.params.userID,
        mark: req.params.mark

    }, function(e, o) {

        if (e) {
            res.status(400).send('Failed');
        } else {
            res.status(200).send('Success');
        }
    });
});


/*router.get('/subscribers_userType/', function(req, res){
    if(req.session.user!=null && req.session.user!=undefined)
    {
        AM.getSubscribers_Type(req.param('type'), function(e, o){

            if(o)
            {

                res.render('subscribers_user',{loadData:o, countries:CT, type:req.param('type')});

            }
            else
            {
                res.render('subscribers_user',{loadData:[], countries:CT, type:req.param('type')});
            }

        });
    } else {
        res.redirect('/');
    }

});*/

router.get('/getAllOrganizations', function(req, res) {

    AM.getAllOrganizations(function(e, o) {
        if (o) {
            res.status(200).send(o);
        } else {
            res.status(400).send([]);
        }
    });
});

router.get('/subscribers_organization', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {


        AM.getSubscribers_Org(req.param('org'), req.param('country'), req.param('userType'), function(e, o) {
            if (o) {
                res.render('subscribers_org', { loadData: o, countries: CT, org: req.param('org'), country: req.param('country'), userType: req.param('userType') });
            } else {
                res.render('subscribers_org', { loadData: [], countries: CT, org: req.param('org'), country: req.param('country'), userType: req.param('userType') });
            }
        });
    } else {
        res.redirect('/');
    }
});


//router.get('/changeFormat', function(req, res){

//AM.changeDateFormat(function(e, o)
//{
//res.send();
//});

//});

router.get('/onboarding/select-type', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {
        res.render('obsf', { udata: req.session.user, event: '2' });
    } else {
        res.redirect('/');
    }

    //  res.render('obsf',{udata:req.session.user});

});
router.get('/onboarding/select-vehicle', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
        var data = {
            event_type: "Onboarding Step- Fleet Types selected", // required
            country: req.session.user.codeISO,
            platform: "WEB",
            user_properties: {
                Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                Email: req.session.user.email,
                Phone: req.session.user.phone,
                Country: req.session.user.codeISO
            }


        }
        amplitude.track(data);

        mixpanel.track("Onboarding Step- Fleet Types selected", {
            distinct_id: req.session.user._id,
            email: req.session.user.email,
            name: req.session.user.name,
            Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
            Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
            Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
            Email: req.session.user.email,
            Phone: req.session.user.phone,
            Country: req.session.user.codeISO,
            Host: req.headers.host

        });

        req.session.td = {};
        req.session.td.road = req.param('road');
        req.session.td.rail = req.param('rail');
        req.session.td.sea = req.param('sea');
        req.session.td.air = req.param('air');
        AM.getVehicles(function(error, vehicles) {
            if (vehicles) {
                res.render('vehicle-details', { udata: req.session.user, roads: vehicles, road: req.param('road') });
            }
        });
    } else {
        res.redirect('/');
    }

});

router.post('/obssw', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {

        var document = {}
        var data = [];
        document.userID = new require('mongodb').ObjectID(req.session.user._id);
        if (req.session.td.road === 'true') {



            data.push({

                identifier: "Road 1",
                vehicalType: "Road",
                type: req.param('subVehicle')[0],
                allowCargo: ["Machinery"],
                userID: new require('mongodb').ObjectID(req.session.user._id),
                groupId: req.session.user._id,
                date: new Date()
            })



        }
        if (req.session.td.sea === 'true') {
            data.push({

                identifier: "Sea 1",
                vehicalType: "Sea",
                type: "1",
                allowCargo: ["Machinery"],
                userID: new require('mongodb').ObjectID(req.session.user._id),
                groupId: req.session.user._id,
                date: new Date()
            })
        }
        if (req.session.td.air === 'true') {
            data.push({

                identifier: "Air 1",
                vehicalType: "Air",
                type: "1",
                allowCargo: ["Machinery"],
                userID: new require('mongodb').ObjectID(req.session.user._id),
                groupId: req.session.user._id,
                date: new Date()
            })
        }
        if (req.session.td.rail === 'true') {
            data.push({

                identifier: "Rail 1",
                vehicalType: "Rail",
                type: "1",
                allowCargo: ["Machinery"],
                userID: new require('mongodb').ObjectID(req.session.user._id),
                groupId: req.session.user._id,
                date: new Date()
            })
        }

        document.data = data;
        AM.createFleets(document, function(e, o) {

            if (e) {} else {
                //console.log(o);
                var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                var data = {
                    event_type: "Onboarding Step- Vehicles in Fleet Selected", // required
                    country: req.session.user.codeISO,
                    platform: "WEB",
                    user_properties: {
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO
                    }

                }
                amplitude.track(data);

                mixpanel.track("Onboarding Step- Vehicles in Fleet Selected", {
                    distinct_id: req.session.user._id,
                    email: req.session.user.email,
                    name: req.session.user.name,
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO,
                    Host: req.headers.host

                });

                res.redirect('/address/details');

            }
        });
    } else {
        res.redirect('/');
    }

});

router.get('/obssw', function(req, res) {


    if (req.session.user != null && req.session.user != undefined) {
        res.render('vehicle-details', { udata: req.session.user, roads: RT, road: req.param('road') });
    } else {
        res.redirect('/');
    }

});

router.get('/address/details', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {

        res.render('address-details', { udata: req.session.user });
    } else {
        res.redirect('/');
    }

});

router.post('/address/details', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {
        AM.userAddressM({
            address: req.param('add'),
            userID: req.session.user._id
        }, function(e, o) {
            if (e) {} else {
                var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                var data = {
                    event_type: "Onboarding Step- HQ Location added", // required
                    country: req.session.user.codeISO,
                    platform: "WEB",
                    user_properties: {
                        Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                        Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                        Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                        Email: req.session.user.email,
                        Phone: req.session.user.phone,
                        Country: req.session.user.codeISO
                    }

                }
                amplitude.track(data);

                mixpanel.track("Onboarding Step- HQ Location added", {
                    distinct_id: req.session.user._id,
                    email: req.session.user.email,
                    name: req.session.user.name,
                    Freight_Forwarder: req.session.user.freightForwarder == '1' ? 'Yes' : 'No',
                    Buyer: req.session.user.buyer == '1' ? 'Yes' : 'No',
                    Carrier: req.session.user.carrier == '1' ? 'Yes' : 'No',
                    Email: req.session.user.email,
                    Phone: req.session.user.phone,
                    Country: req.session.user.codeISO,
                    Host: req.headers.host

                });

                res.redirect('/');
            }
        });

    } else {
        res.redirect('/');
    }

});

router.post('/addressUpdate', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {
        AM.userAddressUpdate({
            address: req.param('add'),
            userID: req.session.user._id
        }, function(e, o) {
            if (e) { res.status(400).send(); } else {
                //              var amplitude = new Amplitude(tracker_id, { user_id: req.session.user.email });
                //              var data = {
                //              event_type: "Onboarding Step- HQ Location added" , // required
                //              country: req.session.user.codeISO,
                //              platform:"WEB",
                //              user_properties: {
                //              Freight_Forwarder:req.session.user.freightForwarder=='1'?'Yes':'No',
                //              Buyer:req.session.user.buyer=='1'?'Yes':'No',
                //              Carrier:req.session.user.carrier=='1'?'Yes':'No',
                //              Email:req.session.user.email,
                //              Phone:req.session.user.phone,
                //              Country: req.session.user.codeISO
                //              } 

                //              }
                //              amplitude.track(data);

                //              mixpanel.track("Onboarding Step- HQ Location added", {
                //              distinct_id: req.session.user._id,
                //              email: req.session.user.email,
                //              name: req.session.user.name,
                //              Freight_Forwarder:req.session.user.freightForwarder=='1'?'Yes':'No',
                //              Buyer:req.session.user.buyer=='1'?'Yes':'No',
                //              Carrier:req.session.user.carrier=='1'?'Yes':'No',
                //              Email:req.session.user.email,
                //              Phone:req.session.user.phone,
                //              Country: req.session.user.codeISO

                //              });

                res.status(200).send();
            }
        });

    } else {
        res.redirect('/');
    }

});
//by date we will get all the page flow 
router.get('/routes/:date', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        AM.getOverviewForDay(date,
            function(error, data) {
                if (error) {
                    res.status(400).send('Failed');
                } else {
                    res.status(200).send(data);
                }
            })
    } else {
        res.redirect('/');
    }
})

router.post('/bankUpdate', function(req, res) {

    AM.carrierBankDetailsUpdate({
        accountNumber: req.param('accountNumber'),
        holderName: req.param('holderName'),
        bankName: req.param('bankName'),
        address: req.param('your_address'),
        nationality: req.param('nationality'),
        swift_iban: req.param('code'),
        international: req.param('type'),
        userID: req.session.user._id

    }, function(e, o) {

        if (e) { res.status(400).send(); } else {

            res.status(200).send();
        }
    });
});


/******* Vehicle Details ********/

router.get('/vehicles', function(req, res) {
    AM.getVehicles(function(err, data) {
        res.render('vehicles', { loadData: data });
    });

});

router.get('/addVehicle', function(req, res) {

    res.render('create_vehicle', {});

});
router.post('/addVehicle', function(req, res) {

    console.log(req.param('name'));

    AM.addVehicle({
        name: req.param('name'),
        type: req.param('type'),
        allowedCargo: [].concat(req.param('acargo'))

    }, function(err, obj) {

        res.redirect('/vehicles');



    });

});

/********************************/
/***************Vehicle Rate*****************/

router.get('/rates', function(req, res) {

    if (req.session.user != null && req.session.user != undefined) {

        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day = date.getDate();
        day = (day < 10 ? "0" : "") + day;
        AM.getTrucks({ userID: req.session.user._id, groupId: req.session.user.groupId, sdate: day + "/" + month + "/" + year }, function(e, o) {
            if (o.length <= 0) {
                res.render('noFleet', { title: 'Pricing & Rates :: Nemlevering', page: '/fleet/create', go: 'Setup Fleet', udata: req.session.user, userID: req.session.user._id, kind: 'Pricing & Rates', category: '', message: 'You have no vehicles in fleet', description: 'Registering your vehicles allow you to allocate incoming transportation requests manually from prospect clients. We also suggest new Deliveries from nearby pickups when your driver uses our app live on the road.', event: req.session.user.event });
            } else {
                console.log(o);
                res.render('vehicle_rates', { title: 'Fleet :: Nemlevering', udata: req.session.user, groupId: req.session.user.groupId, userID: req.session.user._id, loadData: o, road: RT, sea: ST, category: 'fleet', event: req.session.user.event });
            }
        });
    } else {
        res.redirect('/');
    }

});

router.post('/saveRate/:userID/:vehicleID/:basePrice/:pricePerKm', function(req, res) {


    AM.saveRate({

        userID: getObjectId(req.params.userID),
        groupId: req.session.user.groupId,
        vehicleID: getObjectId(req.params.vehicleID),
        basePrice: req.params.basePrice,
        pricePerKm: req.params.pricePerKm
    }, function(err, object) {


        if (err) {
            res.status(400).send('0');
        } else {
            res.status(200).send('1');
        }

    });
});

router.get('/getRate/:userId/:vehicleId', function(req, res) {

    var groupId = req.params.userId;

    AM.getRate(groupId, req.params.vehicleId, function(err, obj) {

        if (obj) {
            res.send(obj);
        } else {
            res.send('not-found');
        }
    });


});

/********************************************/

router.get('/addDist', function(req, res) {

    AM.addDistance(function(e, o) {

        res.status(200).send();
    });

});

router.post('/setProfile', function(req, res) {

    mixpanel.people.set(req.session.user._id, {
        $email: req.session.user.email,
        $first_name: req.session.user.name,
        $created: req.session.user.date,
        $ip: req.param('ip'),
        $host: req.headers.host
    }, {
        $ip: req.param('ip')
    });

});

router.get('/getTrips', function(req, res) {

    AM.getTrips({ userID: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
        if (!err) {
            res.status(200).send(data);
        }
    });

});

router.get('/getDrivers', function(req, res) {

    AM.getDrivers({ company: req.session.user._id, groupId: req.session.user.groupId }, function(err, data) {
        if (!err) {
            res.status(200).send(data);
        }
    });

});

router.get('/iso', function(req, res) {
    AM.addISO(CT, function(e, o) {

        res.status(200).send();

    });
});

router.get('/getCSV', function(req, res) {
    AM.getCSV(function(e, o) {
        var fields = ['email', 'phone', 'name'];

        console.log('Running');

        json2csv({ data: o, fields: fields }, function(err, csv) {
            if (err) console.log(err);
            console.log(csv);
            //          res.writeHead(200, {'Content-Type': 'text/csv' });
            //          res.end(csv, 'binary');

            //          fs.writeFile('file.csv', csv, function(err) {
            //                if (err) throw err;
            //                console.log('file saved');
            //              });

        });

        //      res.csv(o, "myFile.csv");
        var xls = json2xls(o);

        fs.writeFileSync('data.xlsx', xls, 'binary');
        var img = fs.readFileSync("data.xlsx");
        res.writeHead(200, { 'Content-Type': 'text/csv' });
        res.end(img, 'binary');
        //      res.status(200).end('your file saved');
        //res.end(xls,'binary');


    });

});

router.get('/tDelivery', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        //var date = req.params.date;
        AM.getTodayDeliveries({ userID: req.session.user._id }, function(err, obj) {
            if (obj) {
                AM.getVehicles(function(error, vehicles) {
                    if (vehicles) {
                        _.forEach(obj, function(delivery) {
                            var vehicle = _.filter(vehicles, function(item) {
                                return item.typeId == delivery.vehicleType;
                            });
                            delivery.vehicleDescription = vehicle[0] && vehicle[0].description;
                        });
                        res.send({ deliveries: obj });
                    }
                });
            } else {
                res.send('not-found');
            }
        });
    }


});
router.get('/tDelivery', function(req, res) {
    if (req.session.user != null && req.session.user != undefined) {
        //var date = req.params.date;
        AM.getTodayDeliveries({ userID: req.session.user._id }, function(err, obj) {
            if (obj) {
                res.send({ deliveries: obj, roads: RT });
            } else {
                res.send('not-found');
            }
        });
    }


});

router.get('/routesPDF', function(req, res) {
    if (req.session.user == null && req.session.user == undefined) {
        res.redirect('/');
    } else {
        var userId = req.query.userId;
        if (_.isEmpty(userId)) {
            userId = req.session.user._id;
        }

        AM.getDeliveriesForPDF({
            week: req.query.week,
            day: req.query.day,
            userId: userId
        }, function(err, deliveries) {
            if (err) {
                console.log(err);
            } else {
                AM.createPDF(deliveries, function(err, pdf) {
                    pdf.pipe(res);
                    pdf.end();
                });
            }
        });
    }
});



var getObjectId = function(id) {
    if (!IsValidID(id))
        return '000000000000000000000000';

    return new require('mongodb').ObjectID(id);
}

function IsValidID(id) {
    var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
    return checkForHexRegExp.test(id);
}


/***************** Base Structure *********************
 router.get('/', function(req, res){

if(req.session.user!=null && req.session.user!=undefined)
{
res.render('payments',{udata:req.session.user});
}
else
{
res.redirect('/');
}

});
 ******************************************************/


module.exports = router;