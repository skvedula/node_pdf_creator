var crypto = require('crypto');
var MongoDB = require('mongodb').Db;
var Server = require('mongodb').Server;
var moment = require('moment');
var mongo = require('mongodb');
var statusEnum = require('../Constant/enum');
var gDistance = require('google-distance');
var _ = require('lodash');
var async = require('async');
var emailUtil = require('../Utils/emailUtil');
var helperUtil = require('../Utils/helperUtil');
var moment = require('moment');
const objectAssign = require('object-assign');
var currentWeekNumber = require('current-week-number');
var dbPort = 27017;
var dbHost = 'localhost';
var dbName = 'findacargo';
var distance = require('google-distance');
var scheduleDeliveryApi = require('../../api/scheduled_delivery_api');
var rad = function(x) {
    return x * Math.PI / 180;
};

var PdfTable = require('voilab-pdf-table');
var PdfDocument = require('pdfkit');


var getDistance = function(p1, p2) {

    var R = 6378137; // Earthâ€™s mean radius in meter
    var dLat = rad(p2[0] - p1[0]);
    var dLong = rad(p2[1] - p1[1]);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1[0])) * Math.cos(rad(p2[0])) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return Math.round(d); // returns the distance in meter
};
var CM = require('./contacts_model');

/* establish the database connection */

var db = new MongoDB(dbName, new Server(dbHost, dbPort, { auto_reconnect: true }), { w: 1 });
db.open(function(e, d) {
    if (e) {
        console.log(e);
    } else {
        console.log('connected to database :: ' + dbName);
    }
});
var accounts = db.collection('accounts');

var trip = db.collection('trip');
var loads = db.collection('cargo');
var truck = db.collection('truck');
var addresses = db.collection('addresses');
var locations = db.collection('location');
var cargoTrips = db.collection('cargoTrips');
var fleetTrips = db.collection('fleetTrips');
var vehicles = db.collection('vehicletypes');
var rates = db.collection('rates');
var bank = db.collection('bankDetails');
var profileSettings = db.collection('profileSettings');

var deliveries = db.collection('deliveries');
var countryRates = db.collection('countryrates');
var accountStatement = db.collection('accountstatement');
var payments = db.collection('payments');
var alerts = db.collection('alerts');
var helpFindLoad = db.collection('helpfindloads');
var scheduledDeliveries = db.collection('scheduleddeliveries');
var routes = db.collection('routes');
var filelogs = db.collection('filelogs');
var contacts = db.collection('contacts');



/* Index Creation*/

loads.createIndex({ originLatLng: "2dsphere" }, function(e, s) {
    if (e) {
        console.log(e)
    } else {
        console.log('Origin Index creation successfull');
    }
});
loads.createIndex({ destLatLng: "2dsphere" }, function(e, s) {
    if (e) {
        console.log(e)
    } else {
        console.log('Destination Index creation successfull');
    }

});

/*Index Creation End*/

/* login validation methods */

exports.autoLogin = function(user, pass, callback) {
    accounts.findOne({ user: user }, function(e, o) {
        if (o) {
            o.pass == pass ? callback(o) : callback(null);
        } else {
            callback(null);
        }
    });
}

exports.manualLogin = function(email, pass, callback) {
    var query = { email: email, softDelete: { $ne: '1' } };
    accounts.findOne(query, function(e, o) {
        if (o == null) {
            callback('email-not-found');
        } else {
            if (o.softDelete && o.softDelete == "1") {
                callback('account-disabled');
            } else {

                validatePassword(pass, o.pass, function(err, res) {
                    if (res) {
                        //                  if(!o.token){
                        //                  callback(null, o);
                        //                  }
                        //                  else{
                        //                  callback('Please verify your email');
                        //                  }
                        callback(null, o);
                    } else {
                        callback('invalid-password');
                    }
                });
            }
        }
    });
}
exports.manualLoginM = function(email, pass, callback) {
    var query = { email: email, softDelete: { $ne: '1' } };
    accounts.findOne(query, function(e, o) {
        if (o == null) {
            callback('email-not-found');
        } else {
            if (o.softDelete && o.softDelete == "1") {
                callback('account-disabled');
            } else {
                validatePassword(pass, o.pass, function(err, res) {
                    if (res) {
                        if (!o.token) {
                            callback(null, JSON.stringify(o));
                        } else {
                            callback('Please verify your email');
                        }
                    } else {
                        callback('invalid-password');
                    }
                });
            }
        }
    });
}

exports.addNewAccount = function(newData, callback) {
    console.log(newData);

    var query = { email: newData && newData.email, softDelete: { $ne: '1' } };
    accounts.findOne(query, function(e, o) {
        if (o) {
            if (o.facebookRegistration == "0") {
                callback("email_used")
            } else {
                callback('email-taken');
            }
        } else {
            saltAndHash(newData && newData.pass, function(hash) {
                newData.pass = hash;
                // append date stamp when record was created //
                console.log(new Date());
                newData.date = new Date();
                accounts.insert(newData, { safe: true }, function(err, o) {
                    callback(null, o.ops[0]);
                });
            });

        }
    });
}
exports.addNewAccountM = function(newData, callback) {
    console.log(newData);
    var query = { email: newData.email, softDelete: { $ne: '1' } };
    accounts.findOne(query, function(e, o) {
        if (o) {

            callback('email-taken');
        } else {
            saltAndHash(newData.pass, function(hash) {
                newData.pass = hash;
                // append date stamp when record was created //

                newData.date = new Date();
                accounts.insert(newData, { safe: true }, function(err, o) {
                    console.log(o.ops[0]);
                    callback(null, JSON.stringify(o.ops[0]));
                });
            });

        }
    });
}

exports.getClientsDriver = function(userId, callback) {
    var query = { "company": getObjectId(userId) };


    accounts.find(query).toArray(function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            callback(null, o);
        }
    });
}

exports.getTeamMembers = function(id, groupId, callback) {
    var query = {};
    if (groupId == undefined || groupId == null || groupId == "") {
        //query.company = getObjectId(id);
        query = { "$or": [{ "_id": getObjectId(id) }, { "company": getObjectId(id) }] };
    } else {
        query.groupId = groupId;
        query["$or"] = [{ "_id": { $eq: getObjectId(groupId) } }, { type: { $exists: true } }];
    }
    accounts.find(query).toArray(function(e, o) {

        if (e) {
            callback(null);
        } else {
            console.log(o);
            callback(null, o);
        }


    });
}

exports.userAddressM = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {

            newData.date = new Date();
            newData.userID = getObjectId(newData.userID);
            addresses.insert(newData, { safe: true }, function(err, objInserted) {
                callback(null, objInserted);
            });
        }
    });

}

exports.userAddressUpdate = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            addresses.findOne({ userID: getObjectId(newData.userID) }, function(er, ob) {
                if (ob) {
                    ob.address = newData.address
                    //newData.date = new Date();
                    addresses.save(ob, { safe: true }, function(err, objInserted) {
                        callback(null, ob);
                    });
                } else {
                    newData.date = new Date();
                    newData.userID = getObjectId(newData.userID);
                    addresses.insert(newData, { safe: true }, function(err, objInserted) {
                        callback(null, objInserted);
                    });
                }
            });

        }
    });

}

exports.setProfileSettings = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {

        if (!o) {
            callback("{'status':'details-not-found'}");
        } else {
            profileSettings.findOne({ userID: getObjectId(newData.userID) }, function(err, obj) {
                if (obj) {
                    obj.enabled = newData.enabled;
                    obj.messageFromOtherUsers = newData.messageFromOtherUsers;
                    obj.reservationUpdates = newData.reservationUpdates;
                    obj.confirmationUpdates = newData.confirmationUpdates;
                    obj.recommendations = newData.recommendations;
                    obj.generalNotifications = newData.generalNotifications;
                    obj.reminders = newData.reminders;

                    obj.scheduledDailyReport = newData.scheduledDailyReport;
                    obj.scheduledDailyOverview = newData.scheduledDailyOverview;
                    obj.scheduledWeeklyOverview = newData.scheduledWeeklyOverview;

                    profileSettings.save(obj, { safe: true }, function(err, objInserted) {
                        callback(null, obj);
                    });

                } else {

                    newData.date = new Date();
                    newData.userID = getObjectId(newData.userID);
                    profileSettings.insert(newData, { safe: true }, function(err, objInserted) {
                        callback(null, objInserted);
                    });

                }
            });
        }
    });
}

exports.getProfileSettings = function(id, callback) {
    profileSettings.findOne({ userID: getObjectId(id) }, function(e, o) {

        if (!o) {
            callback("{'status':'details-not-found'}");
        } else {
            callback(null, o);
        }

    });

}

exports.carrierBankDetailsUpdate = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            bank.findOne({ userID: getObjectId(newData.userID) }, function(er, ob) {
                if (ob) {
                    ob.accountNumber = newData.accountNumber;
                    ob.holderName = newData.holderName;
                    ob.bankName = newData.bankName;
                    ob.swift_iban = newData.swift_iban;
                    ob.international = newData.international;
                    ob.address = newData.address;
                    ob.nationality = newData.nationality;
                    //newData.date = new Date();
                    bank.save(ob, { safe: true }, function(err, objInserted) {
                        callback(null, ob);
                    });
                } else {
                    newData.date = new Date();
                    newData.userID = getObjectId(newData.userID);
                    bank.insert(newData, { safe: true }, function(err, objInserted) {
                        callback(null, objInserted);
                    });
                }
            });

        }
    });

}

exports.getUserAddress = function(id, callback) {
    accounts.findOne({ _id: getObjectId(id) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {

            //newData.date = new Date();
            addresses.findOne({ userID: getObjectId(id) }, function(err, obj) {
                if (obj) {
                    callback(null, obj);
                } else {
                    callback(err, null);
                }
            });
        }
    });

}

exports.getUserBank = function(id, callback) {
    accounts.findOne({ _id: getObjectId(id) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {

            //newData.date = new Date();
            bank.findOne({ userID: getObjectId(id) }, function(err, obj) {
                if (obj) {
                    callback(null, obj);
                } else {
                    callback(err, null);
                }
            });
        }
    });

}

exports.driverAvailable = function(user, driver, callback) {
    trip.find({ userID: getObjectId(user._id), driver: driver }).toArray(function(err, res) {
        if (res) {
            if (res.length > 0)
                callback(null, false);
            else
                callback(null, true);
        } else {
            callback(err);
        }
    });
}
exports.getTrips = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (!o) {
            callback("{'status':'details-not-found'}");
        } else {
            //var regex = RegExp("/.*" + newData.sdate + ".*/")
            //, startDateTime:new RegExp('^' + newData.sdate)
            var query = {};
            if (newData.groupId == undefined || newData.groupId == null || newData.groupId == "") {
                query.userID = getObjectId(newData.userID);
            } else {
                query.groupId = newData.groupId;
            }
            trip.find(query).toArray(function(err, res) {
                if (res) {
                    callback(null, res);
                } else {
                    callback(err, null);
                }
            });
        }
    });
}
exports.getDrivers = function(data, callback) {
    var query = { carrier: '1' };
    if (data.groupId == undefined || data.groupId == null || data.groupId == "") {
        query.company = getObjectId(data.company);
    } else {
        query.groupId = data.groupId;
    }
    accounts.find(query).toArray(function(e, o) {
        if (e) {
            callback({}, null);
        } else {
            callback(null, o);
        }
    });
};

exports.getDriver = function(data, callback) {

    accounts.findOne({ _id: getObjectId(data._id) }, function(e, o) {
        if (e) {
            callback({}, null);
        } else {
            callback(null, o);
        }
    });
};

exports.getTrip = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (!o) {
            callback("{'status':'details-not-found'}");
        } else {
            var regex = RegExp("/.*" + newData.sdate + ".*/")
            //, startDateTime:new RegExp('^' + newData.sdate)
            trip.findOne({ _id: getObjectId(newData.tripID) }, function(err, res) {
                if (res) {
                    callback(null, res);
                } else {
                    callback(err);
                }
            });
        }
    });
}

exports.assignTrip = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (!o) {
            callback("{'status':'details-not-found'}");
        } else {
            //          var regex = RegExp("/.*" + newData.sdate + ".*/")
            //, startDateTime:new RegExp('^' + newData.sdate)
            console.log(newData.cargoID);
            cargoTrips.findOne({ cargoID: getObjectId(newData.cargoID) }, function(e, o) {
                if (!o) {
                    console.log('Running 1');
                    newData.date = new Date();
                    cargoTrips.insert(newData, { safe: true }, function(err, objInserted) {
                        callback(null, objInserted);
                    });
                } else {
                    console.log('Running 2');
                    o.tripID = newData.tripID;

                    cargoTrips.save(o, { safe: true }, function(err) {
                        if (err) callback(err);
                        else callback(null, o);
                    });

                }

            });


        }
    });
}

exports.assignTripInline = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (!o) {
            callback("{'status':'details-not-found'}");
        } else {
            //          var regex = RegExp("/.*" + newData.sdate + ".*/")
            //, startDateTime:new RegExp('^' + newData.sdate)
            console.log(newData.cargoID);
            cargoTrips.findOne({ cargoID: getObjectId(newData.cargoID) }, function(e, o) {
                if (!o) {
                    console.log('Running 1');
                    newData.date = new Date();
                    cargoTrips.insert(newData, { safe: true }, function(err, objInserted) {
                        //                      callback(null,objInserted);
                    });
                } else {
                    console.log('Running 2');
                    o.tripID = newData.tripID;

                    cargoTrips.save(o, { safe: true }, function(err) {
                        //                      if (err) callback(err);
                        //                      else callback(null, o);
                    });

                }

            });


        }
    });
}

exports.getTrucks = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            var query = {};
            if (newData.groupId == undefined || newData.groupId == null || newData.groupId == "") {
                query.userID = getObjectId(newData.userID);
            } else {
                query.groupId = newData.groupId;
            }
            truck.find(query).toArray(function(err, res) {
                if (res) {
                    callback(null, res);
                } else {
                    callback(err, null);
                }
            });
        }
    });
}

exports.getTruck = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            truck.findOne({ _id: getObjectId(newData.truckID) }, function(err, res) {
                if (res) {
                    callback(null, res);
                } else {
                    callback(err);
                }
            });
        }
    });
}


exports.assignDriver = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (!o) {
            callback("{'status':'details-not-found'}");
        } else {
            //                     var regex = RegExp("/.*" + newData.sdate + ".*/")
            //, startDateTime:new RegExp('^' + newData.sdate)
            //console.log(newData.cargoID);
            trip.findOne({ _id: getObjectId(newData.tripID) }, function(error, object) {
                if (object) {


                    truck.findOne({ _id: getObjectId(newData.truckID) }, function(err, res) {
                        if (res) {

                            object.assigned_vehicle = res;
                            trip.save(object, { safe: true }, function(err) {
                                if (err) callback(err);
                                else callback(null, object);
                            });
                        } else {
                            object.assigned_vehicle = {};
                            trip.save(object, { safe: true }, function(err) {
                                if (err) callback(err);
                                else callback(null, object);
                            });
                        }
                    });


                }


            });


        }
    });
}

//livetracking page endpoind. 
exports.getOverviewForDay = function(week, day, callback) {
    routes.aggregate([{ $match: { $and: [{ creator: getObjectId(userId) }, { routeDate: { $gte: new Date() } }] } }, {
        $group: {
            _id: '$livetracking',
            data: {
                $push: {
                    routes: '$solution.routes',
                    week: '$weekNo',
                    day: '$weekDay',
                    routeDate: '$routeDate',
                    deliveries: '$deliveries',
                    deliverTimeFrom: '$deliverTimeFrom',
                    deliverTimeTo: '$deliverTimeTo',
                    livetracking: 'livetracking',
                    vehicleType: 'vehicleType',
                    Location: 'Location',
                    dropOff: 'dropOff',
                    pickUp: 'pickUp',
                    delayed: 'Delayed'


                }
            }


        }
    }]);
};

exports.assignTruck = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (!o) {
            callback("{'status':'details-not-found'}");
        } else {
            //                     var regex = RegExp("/.*" + newData.sdate + ".*/")
            //, startDateTime:new RegExp('^' + newData.sdate)
            //console.log(newData.cargoID);
            trip.findOne({ _id: getObjectId(newData.tripID) }, function(error, object) {
                if (object) {


                    truck.findOne({ _id: getObjectId(newData.truckID) }, function(err, res) {
                        if (res) {

                            object.assigned_vehicle = res;
                            trip.save(object, { safe: true }, function(err) {
                                if (err) callback(err);
                                else callback(null, object);
                            });
                        } else {
                            object.assigned_vehicle = {};
                            trip.save(object, { safe: true }, function(err) {
                                if (err) callback(err);
                                else callback(null, object);
                            });
                        }
                    });


                }


            });


        }
    });
};

exports.getLoads = function(newData, callback) {
    var count = 0;
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o === null) {
            callback("{'status':'details-not-found'}");
        } else {
            var regex = RegExp("/.*" + newData.sdate + ".*/");
            console.log(regex);
            //,deliveryDate:new RegExp('^' + newData.sdate)
            var query = {};
            if (newData.groupId === undefined || newData.groupId === null || newData.groupId === "") {
                query.userID = getObjectId(newData.userID);
            } else {
                query.groupId = newData.groupId;
            }

            loads.find(query).toArray(function(err, res) {
                if (res) {
                    if (res.length > 0) {

                        res.forEach(function(e) {


                            cargoTrips.findOne({ cargoID: getObjectId(e._id) }, function(error, object) {



                                if (!object) {
                                    count++;
                                    e.trip = { "name": "No Trip Assigned" };
                                    if (count == res.length) {

                                        callback(null, res);
                                    }
                                } else {

                                    trip.findOne({ _id: getObjectId(object.tripID) }, function(err, obj) {

                                        count++;
                                        if (!obj) {
                                            e.trip = { "name": "No Trip Assigned" };
                                        } else {
                                            e.trip = obj;

                                        }
                                        if (count == res.length) {

                                            callback(null, res);
                                        }

                                    });

                                }




                            });

                        });
                    } else {
                        callback(null, res);
                    }

                } else {
                    callback(err);
                }
            });
        }
    });
};

exports.getLoad = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o === null) {
            callback("{'status':'details-not-found'}");
        } else {
            var regex = RegExp("/.*" + newData.sdate + ".*/");
            console.log(regex);
            //,deliveryDate:new RegExp('^' + newData.sdate)
            loads.findOne({ _id: getObjectId(newData.loadID) }, function(err, res) {
                if (res) {



                    callback(null, res);
                } else {
                    callback(err);
                }
            });
        }
    });
};

exports.getLoadsM = function(newData, callback) {
    var counter = 0;
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            var regex = RegExp("/.*" + newData.sdate + ".*/")
            //console.log(regex);
            //,pickupDate:new RegExp('^' + newData.sdate)
            loads.find({ userID: getObjectId(o._id), deliveryDate: new RegExp('^' + newData.sdate) }).toArray(function(err, res) {
                if (res) {
                    console.log(res);
                    if (res.length > 0) {
                        for (var i = 0; i < res.length; i++) {


                            CM.getContact({ user_id: newData.userID, contact_id: res[i].ClientID }, function(e, o) {
                                counter++;

                                if (o) {
                                    //console.log(i-1);
                                    res[i - 1].ClientDetails = o;


                                } else {
                                    res[i - 1].ClientDetails = {};


                                }
                                console.log(counter);
                                if (counter == res.length) {
                                    callback(null, JSON.stringify(res));
                                }
                            });

                        }

                    } else {
                        callback(null, JSON.stringify(res));
                    }
                } else {
                    callback(err);
                }
            });
        }
    });
}

exports.todaysDeliveries = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            var regex = RegExp("/.*" + newData.sdate + ".*/")
            //console.log(regex);
            //,pickupDate:new RegExp('^' + newData.sdate)
            loads.find({ userID: getObjectId(o._id), deliveryDate: new RegExp('^' + newData.sdate) }).toArray(function(err, res) {
                console.log(res);
                if (res) {
                    if (res.length > 0) {
                        for (var i = 0; i < res.length; i++) {

                            CM.getContact({ user_id: newData.userID, contact_id: res[i].ClientID }, function(e, o) {


                                if (o) {
                                    //console.log(i-1);
                                    res[i - 1].ClientDetails = o;


                                } else {
                                    res[i - 1].ClientDetails = {};


                                }
                            });

                        }
                        callback(null, res);
                    } else {
                        callback(null, res);
                    }
                } else {
                    callback(err);
                }
            });
        }
    });
}

exports.plannedTrips = function(newData, callback) {
    var count = 0;
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            var regex = RegExp("/.*" + newData.sdate + ".*/")
            //console.log(regex);
            //,pickupDate:new RegExp('^' + newData.sdate)
            var query = { deliveryDate: new RegExp('^' + newData.sdate) };
            if (newData.groupId == undefined || newData.groupId == null || newData.groupId == "") {
                query.userID = getObjectId(newData.userID);
            } else {
                query.groupId = newData.groupId;
            }
            loads.find(query).toArray(function(err, res) {

                if (res) {
                    if (res.length > 0) {
                        res.forEach(function(value) {

                            CM.getContact({ user_id: newData.userID, contact_id: value.ClientID }, function(e, o) {


                                if (o) {
                                    //console.log(i-1);
                                    value.ClientDetails = o;


                                } else {
                                    value.ClientDetails = {};


                                }
                            });

                        });
                        res.forEach(function(e) {


                            cargoTrips.findOne({ cargoID: getObjectId(e._id) }, function(error, object) {

                                if (!object) {
                                    count++;

                                    e.trip = { "name": "No Trip Assigned", assigned_vehicle: {} };
                                    if (count == res.length) {
                                        callback(null, res);
                                    }
                                } else {

                                    trip.findOne({ _id: getObjectId(object.tripID) }, function(err, obj) {
                                        count++;

                                        if (!obj) {
                                            e.trip = { "name": "No Trip Assigned", assigned_vehicle: {} };
                                        } else {
                                            e.trip = obj;

                                        }
                                        if (count == res.length) {
                                            callback(null, res);
                                        }


                                    });

                                }

                            });

                        });

                    } else {
                        res.trip = { "name": "No Trip Assigned", assigned_vehicle: {} };
                        callback(null, res);
                    }
                } else {
                    callback(err);
                }
            });
        }
    });
}


exports.plannedTripsVehicleWise = function(newData, callback) {
    var count = 0;
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {

            truck.findOne({ _id: getObjectId(newData.vehicle) }, function(er, truck) {

                trip.findOne({ assigned_vehicle: truck }, function(errors, trips) {
                    if (!trips) {
                        var response = [];

                        callback(null, response);
                    } else

                    {
                        cargoTrips.find({ tripID: trips._id }).toArray(function(erors, cargo) {

                            if (!cargo) {

                                var response = [];

                                callback(null, response);
                            } else {

                                if (cargo.length > 0) {

                                    var response = [];

                                    var regex = RegExp("/.*" + newData.sdate + ".*/")

                                    //,pickupDate:new RegExp('^' + newData.sdate)

                                    cargo.forEach(function(value) {

                                        console.log(getObjectId(o._id) + " - - " + new RegExp('^' + newData.sdate) + " - - " + value.cargoID);

                                        loads.findOne({ userID: getObjectId(o._id), deliveryDate: new RegExp('^' + newData.sdate), _id: value.cargoID }, function(err, res) {

                                            if (res) {



                                                CM.getContact({ user_id: newData.userID, contact_id: res.ClientID }, function(e, o) {


                                                    if (o) {
                                                        //console.log(i-1);
                                                        res.ClientDetails = o;


                                                    } else {
                                                        res.ClientDetails = {};


                                                    }
                                                });





                                                cargoTrips.findOne({ cargoID: getObjectId(res._id) }, function(error, objects) {

                                                    if (!objects) {
                                                        count++;

                                                        res.trip = { "name": "No Trip Assigned", assigned_vehicle: {} };
                                                        response.push(res);
                                                        if (count == cargo.length) {
                                                            callback(null, response);
                                                        }
                                                    } else {

                                                        trip.findOne({ _id: getObjectId(objects.tripID) }, function(err, obj) {
                                                            count++;

                                                            if (!obj) {
                                                                res.trip = { "name": "No Trip Assigned", assigned_vehicle: {} };
                                                                response.push(res);
                                                            } else {
                                                                res.trip = obj;
                                                                response.push(res);

                                                            }

                                                            if (count == cargo.length) {
                                                                console.log(response);

                                                                callback(null, response);
                                                            }


                                                        });

                                                    }

                                                });




                                            } else {
                                                callback(err);
                                            }
                                        });
                                    });
                                } else {


                                    var response = [];

                                    callback(null, response);

                                }



                            }

                        });

                    }
                });
            });

        }
    });
}

exports.createTrip = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {

            newData.date = new Date();
            trip.insert(newData, { safe: true }, function(err, objInserted) {
                callback(null, objInserted);
            });
        }
    });
}



exports.createLoad = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {

            newData.date = new Date();
            newData.userID = getObjectId(newData.userID);
            gDistance.get({
                    origin: newData.origin,
                    destination: newData.destination
                },
                function(err, data) {
                    if (err) {
                        newData.distance = {};
                        newData.distance.distance = Math.round(getDistance(newData.originLatLng.coordinates, newData.destLatLng.coordinates) / 1000) + ' km';
                        newData.distance.distanceValue = getDistance(newData.originLatLng.coordinates, newData.destLatLng.coordinates);
                        loads.insert(newData, { safe: true }, function(err, objInserted) {
                            callback(null, objInserted);
                        });
                    } else {
                        newData.distance = data;
                        loads.insert(newData, { safe: true }, function(err, objInserted) {
                            callback(null, objInserted);
                        });
                    }
                });

        }
    });
}

exports.createTruck = function(newData, callback) {

    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {

            newData.date = new Date();
            truck.insert(newData, { safe: true }, function(err, objInserted) {
                callback(null, objInserted);
            });
        }
    });
}

exports.createFileLogs = function(newData, callback) {

    newData.submissionDate = new Date();
    newData.author = getObjectId(newData && newData.author);
    filelogs.insert(newData, { safe: true }, function(err, objInserted) {
        if (!err) {
            callback(null, objInserted);
        } else {
            callback(err, null);
        }
    });
}

exports.createFleets = function(newData, callback) {

    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {

            console.log(newData);
            try {
                truck.insertMany(newData.data, { safe: true }, function(err, objInserted) {
                    callback(null, objInserted);
                });

                //truck.insertMany( newData );
            } catch (e) {
                print(e);
            }
        }
    });
}

exports.updateTrip = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            trip.findOne({ _id: getObjectId(newData.tripID) }, function(err, res) {
                res.name = newData.name;
                res.origin = newData.origin;
                res.destination = newData.destination;
                res.startDateTime = newData.startDateTime;
                res.endDateTime = newData.endDateTime;
                res.scheduled = newData.scheduled;
                res.userType = newData.userType;
                res.driver = newData.driver;
                if (res.scheduled == 1) {
                    res.onDays = newData.onDays;
                    res.interval = newData.interval;
                    res.repeats = newData.repeats;
                    res.startsOn = newData.startsOn;
                    res.endsOn = newData.endsOn;
                    res.occur = newData.occur;
                    res.endDate = newData.endDate;
                }
                trip.save(res, { safe: true }, function(err) {
                    if (err) callback(err);
                    else callback(null, o);
                });
            });
        }
    });
}

exports.updateLoad = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            loads.findOne({ _id: getObjectId(newData.loadID) }, function(err, res) {
                res.name = newData.name;
                res.ClientID = newData.ClientID;
                res.deliveryId = newData.deliveryId;
                res.origin = newData.origin;
                res.destination = newData.destination;
                res.pickup_from_time = newData.pickup_from_time;
                res.pickup_to_time = newData.pickup_to_time;
                res.delivery_from_time = newData.delivery_from_time;
                res.delivery_to_time = newData.delivery_to_time;
                res.pickupDate = newData.pickupDate;
                res.deliveryDate = newData.deliveryDate;
                res.typeLoad = newData.typeLoad;
                res.otherDetails = newData.otherDetails;
                res.status = newData.status;
                //res.mobile = newData.mobile;
                //res.distance = newData.distance;
                loads.save(res, { safe: true }, function(err) {
                    if (err) callback(err);
                    else callback(null, o);
                });
            });
        }
    });
}

exports.updateTruckImage = function(filePath, truckID, callback) {

    truck.findOne({ _id: getObjectId(truckID) }, function(err, res) {
        var newImgUrls = res.imageUrls;
        for (var i = 0; i < newImgUrls.length; i++) {
            if (filePath == newImgUrls[i]) {
                newImgUrls.splice(i, 1);
            }
        }
        res.imageUrls = newImgUrls;
        truck.save(res, { safe: true }, function(err) {
            if (err) callback(err);
            else callback(null, res);
        });
    });
}

exports.updateOraganizeFile = function(filePath, user, callback) {
    accounts.findOne({ _id: getObjectId(user._id) }, function(err, res) {
        var licenceDocUrl = res.licenceDocUrl;

        for (var i = 0; i < licenceDocUrl.length; i++) {
            if (filePath == licenceDocUrl[i]) {
                licenceDocUrl.splice(i, 1);
            }
        }
        res.licenceDocUrl = licenceDocUrl;
        /////// 
        var insuranceDocUrl = res.insuranceDocUrl;

        for (var i = 0; i < insuranceDocUrl.length; i++) {
            if (filePath == insuranceDocUrl[i]) {
                insuranceDocUrl.splice(i, 1);
            }
        }
        res.insuranceDocUrl = insuranceDocUrl;
        /////
        var haulageDocUrl = res.haulageDocUrl;

        for (var i = 0; i < haulageDocUrl.length; i++) {
            if (filePath == haulageDocUrl[i]) {
                haulageDocUrl.splice(i, 1);
            }
        }
        res.haulageDocUrl = haulageDocUrl;
        ////
        var specialDocUrl = res.specialDocUrl;

        for (var i = 0; i < specialDocUrl.length; i++) {
            if (filePath == specialDocUrl[i]) {
                specialDocUrl.splice(i, 1);
            }
        }
        res.specialDocUrl = specialDocUrl;
        /////
        var commercialDocUrl = res.commercialDocUrl;

        for (var i = 0; i < commercialDocUrl.length; i++) {
            if (filePath == commercialDocUrl[i]) {
                commercialDocUrl.splice(i, 1);
            }
        }
        res.commercialDocUrl = commercialDocUrl;

        var railwayDocUrl = res.railwayDocUrl;

        for (var i = 0; i < railwayDocUrl.length; i++) {
            if (filePath == railwayDocUrl[i]) {
                railwayDocUrl.splice(i, 1);
            }
        }
        res.railwayDocUrl = railwayDocUrl;

        var airDocUrl = res.airDocUrl;

        for (var i = 0; i < airDocUrl.length; i++) {
            if (filePath == airDocUrl[i]) {
                airDocUrl.splice(i, 1);
            }
        }
        res.airDocUrl = airDocUrl;

        var shipDocUrl = res.shipDocUrl;

        for (var i = 0; i < shipDocUrl.length; i++) {
            if (filePath == shipDocUrl[i]) {
                shipDocUrl.splice(i, 1);
            }
        }
        res.shipDocUrl = shipDocUrl;




        accounts.save(res, { safe: true }, function(err) {
            if (err) callback(err);
            else callback(null, res);
        });
    });
}

exports.updateTruck = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            truck.findOne({ _id: getObjectId(newData.truckID) }, function(err, res) {
                res.identifier = newData.identifier;
                res.vehicalType = newData.vehicalType;
                res.type = newData.type;
                res.allowCargo = newData.allowCargo;
                res.associatedDriver = newData.associatedDriver;
                res.driver = newData.driver;
                res.registrationNo = newData.registrationNo;
                res.volume = newData.volume;
                res.weight = newData.weight;
                res.area = newData.area;
                res.length = newData.length;
                res.width = newData.width;
                res.height = newData.height;
                res.color = newData.color;
                res.brand = newData.brand;
                res.model = newData.model;
                res.refrigerated = newData.refrigerated;
                if (res.imageUrls === undefined || res.imageUrls === "" || res.imageUrls === null) {
                    res.imageUrls = newData.imageUrls;
                } else {
                    res.imageUrls = res.imageUrls.concat(newData.imageUrls);
                }

                truck.save(res, { safe: true }, function(err) {
                    if (err) callback(err);
                    else callback(null, res);
                });
            });
        }
    });
}

exports.deleteTrip = function(id, callback) {
    trip.remove({ _id: getObjectId(id) }, callback);
}

exports.removeAdminDelivery = function(id, callback) {
    deliveries.remove({ _id: getObjectId(id) }, callback);
}


exports.deleteLoad = function(id, callback) {
    loads.remove({ _id: getObjectId(id) });
    cargoTrips.remove({ cargoID: getObjectId(id) }, callback);
}

exports.deleteTruck = function(id, callback) {
    truck.remove({ _id: getObjectId(id) }, callback);
}
exports.removeCountryRate = function(id, callback) {
    countryRates.remove({ _id: getObjectId(id) }, callback);
}


exports.removeFileLog = function(id, callback) {
    var query = { _id: getObjectId(id) };
    filelogs.remove(query, function(err, obj) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, obj);
        }
    });
}

exports.markCargoDelivered = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            loads.findOne({ _id: getObjectId(newData.cargoID) }, function(err, res) {
                if (res) {
                    res.status = newData.status;
                    //res.mobile = newData.mobile;
                    //res.distance = newData.distance;
                    loads.save(res, { safe: true }, function(err) {
                        if (err) callback(err);
                        else callback(null, o);
                    });
                } else {
                    callback("{'status':'details-not-found'}");
                }
            });
        }
    });
}

exports.updateLocation = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            locations.findOne({ _id: getObjectId(newData.userID) }, function(err, res) {
                if (!res) {
                    newData.date = new Date();
                    locations.insert(newData, { safe: true }, function(err, objInserted) {
                        callback(null, objInserted);
                    });

                } else {
                    res.lat = newData.lat;
                    res.lng = newData.lng;
                    //res.mobile = newData.mobile;
                    //res.distance = newData.distance;
                    locations.save(res, { safe: true }, function(err) {
                        if (err) callback(err);
                        else callback(null, o);
                    });

                }

            });
        }
    });
}




/* record insertion, update & deletion methods */


exports.updateAccount = function(newData, callback) {
    accounts.findOne({ user: newData.user }, function(e, o) {
        o.name = newData.name;
        o.email = newData.email;
        o.country = newData.country;
        if (newData.pass == '') {
            accounts.save(o, { safe: true }, function(err) {
                if (err) callback(err);
                else callback(null, o);
            });
        } else {
            saltAndHash(newData.pass, function(hash) {
                o.pass = hash;
                accounts.save(o, { safe: true }, function(err) {
                    if (err) callback(err);
                    else callback(null, o);
                });
            });
        }
    });
}
exports.changePassword = function(id, oldPass, newPass, callback) {

    accounts.findOne({ _id: getObjectId(id) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            validatePassword(oldPass, o.pass, function(err, res) {
                if (res) {
                    saltAndHash(newPass, function(hash) {
                        o.pass = hash;
                        accounts.save(o, { safe: true }, function(err1, objIns) {
                            callback(null, o);
                        });
                    });
                } else {
                    callback('invalid-password');
                }
            });
        }
    });

}
exports.updatePassword = function(id, newPass, callback) {
    accounts.findOne({ _id: getObjectId(id) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            saltAndHash(newPass, function(hash) {
                if (o != null) {
                    o.pass = hash;
                    accounts.save(o, { safe: true }, callback);
                } else {
                    callback("Unable to update password", null);
                }
            });
        }
    });
}

exports.updateUserByAdmin = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userId) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            o.name = newData.name;
            o.email = newData.email;
            o.ccode = newData.ccode;
            o.phone = newData.phone;
            o.cpr = newData.cpr;
            o.shortName = newData.shortName;
            o.companyDetails = { companyName: newData.companyName, taxId: newData.taxId, companyAddress: newData.companyAddress }

            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, o);
            });

        }
    });
}

exports.updateUserNameAndEmail = function(newData, callback) {
    accounts.findOneAndUpdate({ _id: getObjectId(newData && newData.userId) }, { $set: { 'name': newData && newData.name, 'email': newData && newData.email } }, function(err, obj) {
        if (obj) {
            callback(null, obj);
        } else {
            callback(err, null);
        }
    });
}

exports.createAccountStatement = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userId) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            newData.date = new Date();
            accountStatement.save(newData, { safe: true }, function(err, objInserted) {
                callback(null, objInserted);
            });
        }
    });
}

exports.getAllFileLogs = function(callback) {
    filelogs.find({}).toArray(
        function(e, res) {
            if (e) {
                callback(e, null)
            } else {
                callback(null, res);
            }
        });
};



exports.getAllCountryRates = function(callback) {
    countryRates.find().toArray(
        function(e, res) {
            if (e) {
                callback(e, null)
            } else {
                callback(null, res);
            }
        });
};

exports.assignCarrierToRoute = function(newData, callback) {

    //validate if driver has vehicle or not

    vehicles.find({}, { typeId: 1, _id: 0 }).toArray(function(err, typeIds) {
        var allTypeIds = [];
        _.forEach(typeIds, function(type) {
            allTypeIds.push(type.typeId.toString());
        });

        var truckQuery = { userID: getObjectId(newData && newData.driverId), type: { $in: allTypeIds } };

        truck.find(truckQuery).toArray(function(error, truck) {
            if (error) {
                callback(error, null);
            } else {
                if (truck && truck.length) {
                    var updateQuery = {
                        _id: getObjectId(newData && newData.routeId),
                        "solution.routes.vehicle_id": newData && newData.routeName
                    };

                    var assignDriver = { $set: { "solution.routes.$.driverId": getObjectId(newData && newData.driverId) } };
                    routes.update(updateQuery, assignDriver, function(err, obj) {
                        if (err) {
                            callback(err, null);
                        } else {
                            callback(null, obj);
                        }
                    });
                } else {
                    callback("vehicle_not_found", null);
                }
            }
        });
    });
};

exports.assignRouteToCarrierManully = function(newData, callback) {

    var vehicleObj = {
        vehicleId: getObjectId(newData && newData.vehicleId),
        identifier: newData && newData.identifier,
        type: newData && newData.type
    };

    var updateQuery = {
        _id: getObjectId(newData && newData.routeId),
        "solution.routes.vehicle_id": newData && newData.routeName
    };
    var assignDriver = { $set: { "solution.routes.$.driverId": getObjectId(newData && newData.driverId), "solution.routes.$.vehicle": vehicleObj } };

    routes.update(updateQuery, assignDriver, function(err, obj) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, obj);
        }
    });
};


exports.createCountryRates = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userId) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            newData.date = new Date();
            countryRates.save(newData, { safe: true }, function(err, objInserted) {
                callback(null, objInserted);
            });
        }
    });
}


exports.updateUser = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            o.name = newData.name;
            o.email = newData.email;
            o.ccode = newData.ccode;
            o.phone = newData.phone;
            o.mobile = newData.mobile;
            o.mobile1 = newData.mobile1;
            o.mobile2 = newData.mobile2;
            o.mobile3 = newData.mobile3;
            o.shortName = newData.shortName;

            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, o);
            });

        }
    });
}

exports.addGroupId = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData._id) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            if (newData.groupId == undefined) {
                o.groupId = (newData._id).toString();
            } else {
                o.groupId = newData.groupId;
            }

            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, o);
            });
        }
    });
}

exports.updateBuyerUserOrganization = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            o.companyDetails = newData.companyDetails,
                o.name = newData.name,
                o.userType = newData.userType,
                o.cpr = newData.cpr,
                o.hasOrganized = newData.hasOrganized
            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, o);
            });

        }
    });
}

exports.updateUserOrganization = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {

            o.licenceDocUrl = newData.licenceDocUrl
            o.insuranceDocUrl = newData.insuranceDocUrl,
                o.haulageDocUrl = newData.haulageDocUrl,
                o.specialDocUrl = newData.specialDocUrl,
                o.commercialDocUrl = newData.commercialDocUrl,
                o.railwayDocUrl = newData.railwayDocUrl,
                o.airDocUrl = newData.airDocUrl,
                o.shipDocUrl = newData.shipDocUrl,
                o.companyDetails = newData.companyDetails,
                o.name = newData.name,
                o.userType = newData.userType,
                o.cpr = newData.cpr,
                o.hasInsurance = newData.hasInsurance,
                o.hasHaulageLicense = newData.hasHaulageLicense,
                o.hasSpecialTransport = newData.hasSpecialTransport,
                o.hasCommercialLicence = newData.hasCommercialLicence,
                o.hasRailwayService = newData.hasRailwayService,
                o.hasAirService = newData.hasAirService,
                o.hasShipService = newData.hasShipService,
                o.hasOrganized = newData.hasOrganized,

                accounts.save(o, { safe: true }, function(err, objInserted) {
                    callback(null, o);
                });

        }
    });
}

exports.updateUserOrganizationEdit = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {

            o.licenceDocUrl = o.licenceDocUrl.concat(newData.licenceDocUrl);
            o.insuranceDocUrl = o.insuranceDocUrl.concat(newData.insuranceDocUrl);
            o.haulageDocUrl = o.haulageDocUrl.concat(newData.haulageDocUrl);
            o.specialDocUrl = o.specialDocUrl.concat(newData.specialDocUrl);
            o.commercialDocUrl = o.commercialDocUrl.concat(newData.commercialDocUrl);
            o.railwayDocUrl = o.railwayDocUrl.concat(newData.railwayDocUrl);
            o.airDocUrl = o.airDocUrl.concat(newData.airDocUrl);
            o.shipDocUrl = o.shipDocUrl.concat(newData.shipDocUrl);

            o.companyDetails = newData.companyDetails;
            o.name = newData.name;
            o.userType = newData.userType;
            o.cpr = newData.cpr;
            o.hasInsurance = newData.hasInsurance;
            o.hasHaulageLicense = newData.hasHaulageLicense;
            o.hasSpecialTransport = newData.hasSpecialTransport;
            o.hasCommercialLicence = newData.hasCommercialLicence;
            o.hasRailwayService = newData.hasRailwayService;
            o.hasAirService = newData.hasAirService;
            o.hasShipService = newData.hasShipService;

            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, o);
            });

        }
    });
}

exports.updatePhoto = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            o.imagePath = newData.imagePath;
            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, o);
            });

        }
    });
}
exports.updateUserBaap = function(user, callback) {

    user._id = require('mongodb').ObjectID(user._id);
    accounts.save(user, { safe: true }, function(err, objInserted) {
        if (!err)
            callback(null, objInserted);
        else
            callback('Error updaing user ' + JSON.stringify(err))
    });

}

exports.updateCountryRate = function(rate, callback) {

    rate._id = require('mongodb').ObjectID(rate._id);
    countryRates.save(rate, { safe: true }, function(err, objInserted) {
        if (!err)
            callback(null, objInserted);
        else
            callback('Error updaing user ' + JSON.stringify(err))
    });

}

exports.getCountryRate = function(id, callback) {
    countryRates.findOne({ _id: getObjectId(id) },
        function(e, res) {
            if (e) callback(e)
            else callback(null, res)
        });
};


exports.updateUserInfo = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {

            o.ccode = newData.ccode;
            o.mobile = newData.mobile;
            o.mobile1 = newData.mobile1;
            o.mobile2 = newData.mobile2;
            o.mobile3 = newData.mobile3;
            o.buyer = newData.buyer;
            o.freightForwarder = newData.freightForwarder;
            o.carrier = newData.carrier;

            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, o);
            });

        }
    });
}

exports.updateManager = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {

            o.approved = newData.permit;
            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, objInserted);
            });

        }
    });
}


exports.updateBuyerDiscount = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            if (newData.discount != '') {
                o.fixedDiscount = newData.discount;
            }
            if (newData.fixedPrice5k != '') {
                o.fixedPrice5k = newData.fixedPrice5k;
            }
            if (newData.fixedPrice15k != '') {
                o.fixedPrice15k = newData.fixedPrice15k;
            }
            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, objInserted);
            });

        }
    });
}


exports.updateClientByAdmin = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            var scheduledDrivers = o && o.scheduledCarriers || [];

            _.forEach(newData && newData.carriers, function(user) {
                var result = _.filter(scheduledDrivers, function(item) {
                    return (user.driver == item.driver);
                });
                if (!(result && result.length)) {
                    scheduledDrivers.push(user);
                }
            });

            o.scheduledCarriers = scheduledDrivers;

            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, o);
            });
        }
    });
};


exports.addZipCodes = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData && newData.userId) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            o.zipCodes = newData && newData.zipCodes;
            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, o);
            });
        }
    });
};


exports.getAssignDriver = function(userIds, callback) {
    userIds = [].concat(userIds);
    var userObjIds = [];
    for (var i = 0; i < userIds.length; i++) {
        userObjIds.push(getObjectId(userIds[i]));
    }

    var query = { _id: { $in: userObjIds } };
    accounts.find(query).toArray(
        function(e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
};

exports.getAccountStatement = function(userId, callback) {

    var query = { userId: getObjectId(userId) };
    accountStatement.find(query).toArray(
        function(e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
};
exports.updateDriversForClient = function(newData, callback) {

    accounts.findOne({ _id: getObjectId(newData.clientId) }, function(e, o) {
        if (o) {
            if (o.scheduledCarriers) {
                for (var i = 0; i < o.scheduledCarriers.length; i++) {
                    if (o.scheduledCarriers[i].driver == newData.userId) {
                        o.scheduledCarriers.splice(i, 1);
                    }
                }
            }
            accounts.save(o, { safe: true }, function(err) {
                if (err) callback(err);
                else callback(null, o);
            });
        } else {
            callback(e, null);
        }
    });
};

exports.markClientScheduled = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            o.scheduledClient = newData.mark;
            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, objInserted);
            });
        }
    });
}

exports.updateBuyer = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {

            o.monthlyInvoice = newData.mark;
            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, objInserted);
            });

        }
    });
}

exports.updateCarrier = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {

            o.activeCarrier = newData.mark;
            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, objInserted);
            });

        }
    });
}

/* account lookup methods */

exports.deleteAccount = function(id, callback) {
    accounts.remove({ _id: getObjectId(id) }, callback);
}

exports.getAccountByEmail = function(email, callback) {

    accounts.findOne({ email: email, softDelete: { $ne: '1' } }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            callback(null, o);
        }
    });
}

exports.validateResetLink = function(email, passHash, callback) {
    accounts.find({ $and: [{ email: email, pass: passHash }] }, function(e, o) {
        callback(o ? 'ok' : null);
    });
}

exports.getAccountByUserId = function(userId, callback) {
    accounts.findOne({ _id: getObjectId(userId) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            callback(null, o);
        }
    });
}

exports.getLiveStatus = function(id, callback) {
    scheduledDeliveries.findOne({ _id: getObjectId(id) }, function(e, o) {
        console.log('scheduledelivery---', o);
        if (e) {
            callback(e, null);
        } else {
            callback(null, o);
        }
    });
};


exports.getTeam = function(data, callback) {

    var query = {};
    if (data.groupId == undefined || data.groupId == null || data.groupId == "") {
        query = { "$or": [{ "_id": getObjectId(data.company) }, { "company": getObjectId(data.company) }] };


        //query.company = getObjectId(data.company);
        //query._id = getObjectId(data.company);
        //query["$or"] = [{_id:getObjectId(data.company)},{company:getObjectId(data.company)}];
    } else {
        query.groupId = data.groupId;
        query["$or"] = [{ "_id": { $eq: getObjectId(data.groupId) } }, { type: { $exists: true } }];

        //query = {$and: [{groupId:data.groupId},{company:{$exists:true}}],_id: {$eq : getObjectId(data.groupId)}}
        //query = {"$or":[{"_id":getObjectId(data.company)},{"company":getObjectId(data.company)}]};
    }
    accounts.find(query).toArray(
        function(e, res) {
            if (e) callback(e)
            else callback(null, res)
        });
}

exports.softDeleteUser = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userId) }, function(e, o) {
        if (e) {
            callback(e, null);
        } else {
            o.softDelete = "1";
            accounts.save(o, { safe: true }, function(err, objInserted) {
                callback(null, o);
            });
        }
    });
};


exports.getAllRecords = function(newData, callback) {
    if (newData.softDelete == '' || newData.softDelete == undefined) {
        if (newData.ccode == '') {
            accounts.find({ date: { $gte: new Date(newData.sdate) } }).toArray(
                function(e, res) {
                    if (e) callback(e)
                    else callback(null, res)
                });
        } else {
            accounts.find({ ccode: newData.ccode, date: { $gte: new Date(newData.sdate) } }).toArray(
                function(e, res) {
                    if (e) callback(e)
                    else callback(null, res)
                });
        }
    } else {

        var query = {};
        if (newData.ccode == '') {
            query.date = { $gte: new Date(newData.sdate) };
        } else {
            query.date = { $gte: new Date(newData.sdate) };
            query.ccode = newData.ccode;
        }
        if (newData.softDelete == '1') {
            query.softDelete = '1';
        } else {
            query.softDelete = { $ne: '1' };
        }
        console.log(query);
        accounts.find(query).toArray(
            function(e, res) {
                if (e) callback(e)
                else callback(null, res)
            });

    }
};
exports.getAllManagers = function(callback) {
    accounts.find({ manager: '1' }).toArray(
        function(e, res) {
            if (e) callback(e)
            else callback(null, res)
        });
};

// exports.getAllAdminDeliveries = function (callback) {
//  deliveries.find({}).toArray(
//      function (e, res) {
//          if (e) callback(e)
//          else callback(null, res)
//      });
// };

exports.getAllAdminDeliveries = function(callback) {
    var deliveryQuery = {};

    deliveries.find(deliveryQuery).toArray(
        function(e, res) {
            if (e) {
                callback(e);
            } else {
                var allDeliveries = res;
                var deliveryIds = [];
                for (var i = 0; i < allDeliveries.length; i++) {
                    deliveryIds.push(allDeliveries[i]._id);
                }
                var query = { deliveryId: { $in: deliveryIds } };

                payments.find(query).toArray(
                    function(err, data) {
                        if (err) {
                            callback(err, null);
                        } else {
                            for (var i = 0; i < allDeliveries.length; i++) {
                                for (var j = 0; j < data.length; j++) {
                                    if ((allDeliveries[i]._id).toString() == (data[j].deliveryId).toString()) {
                                        allDeliveries[i]["paymentStatus"] = data[j];
                                    }
                                }
                            }
                            callback(null, allDeliveries);
                        }
                    });
            }
        });
};

exports.getAllLiveVehicles = function(callback) {
    accounts.find({ carrier: '1' }).toArray(
        function(e, res) {
            if (e) {
                callback(e);
            } else {
                var allCarriers = res;
                var query = { 'liveDelivery.available': true };
                //get All truck with liveDelivery
                truck.find(query).toArray(
                    function(err, o) {
                        if (err) {
                            callback(e);
                        } else {
                            for (var i = 0; i < o.length; i++) {
                                for (var j = 0; j < allCarriers.length; j++) {
                                    if ((o[i].userID).toString() == (allCarriers[j]._id).toString()) {
                                        o[i].name = allCarriers[j].name;
                                        o[i].email = allCarriers[j].email;
                                        o[i].phone = allCarriers[j].phone;
                                    }
                                }
                            }
                        }
                        callback(null, o);
                    });
            }
        });
};

exports.getAllBuyers = function(payBy, callback) {
    var query = { buyer: '1', carrier: { $ne: '1' }, softDelete: { $ne: '1' } };
    if (payBy != 'all') {
        query.monthlyInvoice = payBy;
    }
    accounts.find(query).sort({ "date": -1 }).toArray(
        function(e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
};

exports.getAllScheduledClients = function(callback) {
    var query = { buyer: '1', scheduledClient: '1' };
    query.carrier = { $ne: '1' };
    query.softDelete = { $ne: '1' };

    var asyncFunArray = [];

    accounts.find(query).toArray(
        function(e, res) {
            if (e) {
                callback(e);
            } else {
                _.forEach(res, function(client) {

                    var asynFun = function(cb) {
                        var date = new Date();
                        var todayDate = new Date(date.setHours(0, 0, 0, 0));
                        routes.find({ creator: getObjectId(client._id), routeDate: { $gte: todayDate } }).toArray(function(error, routeResult) {
                            var totalCount = 0;
                            if (routeResult) {
                                totalCount = routeResult.length;
                            }
                            client.routeCount = totalCount;
                            cb();
                        });
                    }
                    asyncFunArray.push(asynFun);
                });
                async.parallel(asyncFunArray, function(err, allDone) {
                    callback(null, res);
                });
            }
        });
};



exports.getCarriersByVehicle = function(typeId, callback) {
    var truckQuery = { type: typeId }
    var carrierQuery = { carrier: '1', softDelete: { $ne: '1' } };
    var resultArr = [];

    truck.find(truckQuery).toArray(function(err, trucks) {

        accounts.find(carrierQuery).sort({ name: 1 }).toArray(function(err, users) {
            if (err) {
                callback(err, []);
            } else {
                _.forEach(users, function(user) {
                    var result = _.filter(trucks, function(truck) {
                        return (truck.userID).toString() == (user._id).toString();
                    });

                    if (result.length) {
                        resultArr.push(user)
                    }
                });
                callback(null, resultArr);
            }
        });
    });
};

exports.getAllCarriersASC = function(callback) {
    var query = { carrier: '1', softDelete: { $ne: '1' } };

    accounts.find(query).sort({ name: 1 }).toArray(function(err, users) {
        if (err) {
            callback(err, []);
        } else {
            console.log(users);
            callback(null, users);
        }
    });
};

exports.getAllCarriers = function(callback) {
    var query = { carrier: '1', softDelete: { $ne: '1' } };

    accounts.find(query).toArray(function(err, users) {
        addresses.find({}).toArray(function(err, addresses) {
            for (var i = 0; i < users.length; i++) {
                for (var j = 0; j < addresses.length; j++) {
                    if ((addresses[j].userID).toString() == (users[i]._id).toString()) {
                        users[i].address = addresses[j].address;
                    }
                }
            }
            callback(null, users);

        });
    });

    //Old Query
    /*var query = {carrier: '1', softDelete: {$ne: '1'}};
    accounts.find(query).toArray(
        function (e, res) {
            if (e) callback(e);
            else callback(null, res);
        });*/

    //code for mongo 3.2 version with join operation
    /*accounts.aggregate([
        {
            $lookup: {
                from: "addresses",
                localField: "_id",
                foreignField: "userID",
                as: "address_detail"
            }
        }
    ]).toArray(
        function (e, res) {
            if (e) {
                console.log(e,'EEEEEEEEEEEEEEEEEEEEEEEEEEE');
                callback(e);
            }
            else {
                console.log(res,'LLLLLLLLLLLLLLLLLLLLLLLLL');
                callback(null, res);
            }
        });*/
};

exports.getAllCarrierForClients = function(callback) {
    var query = { carrier: '1', softDelete: { $ne: '1' }, parent: { $exists: false } };
    accounts.find(query).toArray(
        function(e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
};

exports.getAllDriversofCarrier = function(userId, callback) {

    var query = { carrier: '1', parent: getObjectId(userId) };
    accounts.find(query).toArray(
        function(e, res) {
            if (e) callback(e);
            else callback(null, res);
        });
};


exports.delAllRecords = function(callback) {
    accounts.remove({}, callback); // reset accounts collection for testing //
}

exports.changeDateFormat = function(callback) {



    accounts.find().toArray(
        function(e, res) {
            if (e) callback(e)
            else {
                res.forEach(function(value) {
                    accounts.findOne({ _id: value._id }, function(e, o) {
                        var date = moment(o.date, 'MM-DD-YYYY').format('MM-DD-YYYY');

                        o.date = new Date(date);
                        accounts.save(o, { safe: true }, function(err, objInserted) {
                            callback(null, objInserted);
                        });
                    });
                });

                callback(null, res)
            }
        });

}

exports.addDistance = function(callback) {
    loads.find().toArray(function(e, res) {

        if (e) callback(e)
        else {
            res.forEach(function(value) {
                loads.findOne({ _id: value._id }, function(e, o) {
                    gDistance.get({
                            origin: o.origin,
                            destination: o.destination
                        },
                        function(err, data) {
                            if (err) {
                                o.distance = {};
                                o.distance.distance = getDistance(o.originLatLng.coordinates, o.destLatLng.coordinates)
                                loads.save(o, { safe: true }, function(err, objInserted) {
                                    //callback(null,objInserted);
                                });
                            } else {
                                o.distance = data;
                                loads.save(o, { safe: true }, function(err, objInserted) {
                                    //callback(null,objInserted);
                                });
                            }
                        });
                });
            });
        }
    });

}

exports.addISO = function(data, callback) {
    accounts.find().toArray(function(e, res) {

        if (e) callback(e)
        else {
            res.forEach(function(value) {
                accounts.findOne({ _id: value._id }, function(e, o) {

                    var code1 = data.filter(function(item) {
                        return item.dial_code == o.ccode;
                    });
                    console.log(o.ccode);
                    o.codeISO = code1[0].code;

                    accounts.save(o, { safe: true }, function(err, objInserted) {
                        //callback(null,objInserted);
                    });


                    //                  gDistance.get(
                    //                  {
                    //                  origin: o.origin,
                    //                  destination: o.destination
                    //                  },
                    //                  function(err, data) {
                    //                  if (err) 
                    //                  {
                    //                  o.distance = {};
                    //                  o.distance.distance = getDistance(o.originLatLng.coordinates,o.destLatLng.coordinates)
                    //                  loads.save(o, {safe:true}, function(err, objInserted){
                    //                  //callback(null,objInserted);
                    //                  });
                    //                  }
                    //                  else
                    //                  {
                    //                  o.distance = data;
                    //                  loads.save(o, {safe:true}, function(err, objInserted){
                    //                  //callback(null,objInserted);
                    //                  });
                    //                  }
                    //                  });
                });
            });
        }
    });

}

/*****

Vehicle CRUD

 *****/

exports.getVehicles = function(callback) {

    vehicles.find().toArray(function(err, obj) {

        if (!obj) {
            callback(err, null);
        } else {
            callback(null, obj);
        }
    });
}

exports.getVehiclesDescription = function(typeId, callback) {

    var id = parseInt(typeId, 10);
    vehicles.findOne({ 'typeId': id }, function(err, res) {
        if (res) {
            callback(null, res);
        } else {
            callback(err);
        }
    });


};


exports.addVehicle = function(data, callback)

{

    vehicles.insert(data, { safe: true }, function(err, o) {
        callback(null, o.ops[0]);
    });


}

exports.saveRate = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {

        if (e) {
            callback('User Not Available');
        } else {

            rates.findOne({
                userID: getObjectId(newData.userID),
                vehicleID: getObjectId(newData.vehicleID)

            }, function(err, res) {



                if (!res) {
                    rates.insert(newData, { safe: true }, function(error, obj) { callback(null, obj) });
                } else {

                    res.basePrice = newData.basePrice;
                    res.pricePerKm = newData.pricePerKm;
                    rates.save(res, { safe: true }, function(error, obj) { callback(null, obj) });
                }


            });

        }

    });

}


exports.getAllOrganizations = function(callback) {
    var resultArr = [];
    accounts.find({ type: { $exists: false, $eq: null } }).toArray(function(err, users) {
        if (err) {
            callback(err, null);
        } else {
            contacts.find({}).toArray(function(e, contacts) {
                _.forEach(users, function(user) {
                    var skipUser = _.filter(contacts, function(contact) {
                        return contact && contact.contact_user_id && (contact.contact_user_id).toString() == user && (user._id).toString();
                    });
                    if (!(skipUser && skipUser.length)) {
                        resultArr.push(user);
                    }
                })
                callback(null, resultArr);
            });
        }
    });
}

exports.getSubscribers_Type = function(type, callback) {

    var query = { type: { $exists: true, $ne: null } };
    if (type != 'all') {
        query = { type: type };
    }
    accounts.find(query).toArray(function(err, obj) {

        if (err) {
            callback(err, null);
        } else {
            callback(null, obj);
        }

    });

};

exports.getSubscribers_Org = function(id, country, userType, callback) {

    var query = { company: { $exists: true, $ne: null }, softDelete: { $ne: '1' } };
    if (id != 'all') {
        query = { parent: getObjectId(id) };
    }
    if (country && country != 'all') {
        query.ccode = country;
    }
    if (userType && userType != 'all') {
        if (userType == 'buyer') {
            query.buyer = '1';
        } else if (userType == 'carrier') {
            query.carrier = '1';
        } else {
            query.freightForwarder = '1';
        }
    }

    accounts.find(query).toArray(function(err, obj) {
        if (err) {
            callback(err, null);
        } else {
            accounts.find({}).toArray(function(err, users) {
                addresses.find({}).toArray(function(err, addresses) {
                    for (var i = 0; i < addresses.length; i++) {
                        for (var j = 0; j < users.length; j++) {
                            if ((addresses[i].userID).toString() == (users[j]._id).toString()) {
                                users[j].address = addresses[i].address;
                            }
                        }
                    }
                    for (var i = 0; i < users.length; i++) {
                        for (var j = 0; j < obj.length; j++) {
                            if ((users[i]._id).toString() == obj[j].company) {
                                obj[j].creatorDetails = { name: users[i].name, email: users[i].email, phone: users[i].phone, address: users[i].address }
                            }
                        }
                    }
                    callback(null, obj);
                });
            });
        }
    });
};

exports.getAllActiveCarriers = function(country, callback) {

    //code for mongo version less than 3.2
    var query = { carrier: "1", activeCarrier: "1", softDelete: { $ne: "1" } };
    if (country != 'all') {
        query.ccode = country;
    }

    accounts.find(query).sort({ "date": -1 }).toArray(function(err, users) {
        if (err) {
            callback(err, null);
        } else {
            addresses.find({}).toArray(function(e, addresses) {
                for (var i = 0; i < users.length; i++) {
                    for (var j = 0; j < addresses.length; j++) {
                        if ((addresses[j].userID).toString() == (users[i]._id).toString()) {
                            users[i].address = addresses[j].address;
                        }
                    }
                }
                callback(null, users);
            });
        }
    });

    //code for mongo 3.2 version with join operation
    /*accounts.aggregate([
     { $match: { carrier: "1" , activeCarrier: "1" ,softDelete: {$ne: '1'}}},
     {
     $lookup: {
     from: "addresses",
     localField: "_id",
     foreignField: "userID",
     as: "address_detail"
     }
     }
     ]).toArray(
     function (e, res) {
     if (e) {
     callback(e,null);
     }
     else {
     callback(null, res);
     }
     });*/
};


exports.getRate = function(groupId, vehicleID, callback) {

    rates.findOne({
        groupId: groupId,
        vehicleID: getObjectId(vehicleID)

    }, function(err, res) {
        console.log(err);
        console.log(res);
        if (!res) {
            callback(null);
        } else {

            callback(null, res);
        }

    });
}

/********/




exports.getCSV = function(callback) {
    accounts.find().toArray(function(e, res) {

        if (res) {
            callback(null, res);
        }

    });
};


exports.FindAccount = function(id, callback) {
    accounts.findOne({ _id: getObjectId(id) },
        function(e, res) {
            if (e) callback(e)
            else callback(null, res)
        });
};

exports.getLoadsCount = function(id, groupId, callback) {
    var query = {};
    if (groupId == undefined || groupId == null || groupId == "") {
        query.userID = getObjectId(id);
    } else {
        query.groupId = groupId;
    }
    loads.find(query).count(function(error, nbDocs) {
        callback(null, nbDocs); // Do what you need the count for here.
    });

}


/**
 * get data of today's deliveries with carrier pending(3) and scheduled(8) status
 * @param newData: login UserId
 * @param callback: error and success callbacks
 */
exports.getTodayDeliveries = function(newData, callback) {
    var startDateLimit = new Date();
    startDateLimit.setHours(0, 0, 0, 0);
    var endDateLimit = new Date();
    endDateLimit.setDate(endDateLimit.getDate() + 1);
    endDateLimit.setHours(0, 0, 0, 0);
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(e, o) {
        if (o == null) {
            callback("{'status':'details-not-found'}");
        } else {
            deliveries.find({
                'pickUp.pickupDate': {
                    $gte: startDateLimit,
                    $lt: endDateLimit
                },
                'status': { $in: [statusEnum.STATUS_CODE.CARRIER_PENDING, statusEnum.STATUS_CODE.MOVED] },
                'carriers': { $ne: { 'accountId': getObjectId(newData.userID), 'status': 3 } }
            }).toArray(function(error, nbDocs) {
                if (error) {
                    callback(null);
                } else {

                    callback(null, nbDocs);
                }
            });
        }
    });
};

/**
 * accept delivery
 * @param newData: login UserId
 * @param callback: error and success callbacks
 */

exports.acceptDelivery = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(error, user) {
        if (error != null) {
            callback("{'status':'details-not-found'}");
        } else {
            var updated = {
                status: statusEnum.STATUS_CODE.CARRIER_APPROVED
            };
            var carrier = {
                "accountId": getObjectId(newData.userID),
                "status": statusEnum.CARRIER_STATUS_CODE.ACCEPTED
            };
            deliveries.update({ _id: getObjectId(newData.deliveryId) }, { $set: updated, $push: { carriers: carrier } }, function(err, res) {
                if (err || (res && res.result && res.result.nModified == 0)) callback(err);
                else callback(null, res);
            });
        }
    });
}

/**
 * reject delivery
 * @param newData: login UserId
 * @param callback: error and success callbacks
 */

exports.rejectDelivery = function(newData, callback) {
    accounts.findOne({ _id: getObjectId(newData.userID) }, function(error, user) {
        if (error != null) {
            callback("{'status':'details-not-found'}");
        } else {
            var carrier = {
                "accountId": getObjectId(newData.userID),
                "status": statusEnum.CARRIER_STATUS_CODE.REJECTED
            };
            deliveries.update({ _id: getObjectId(newData.deliveryId) }, { $push: { carriers: carrier } }, function(err, res) {
                if (err || (res && res.result && res.result.nModified == 0)) callback(err);
                else callback(null, res);
            });
        }
    });
}

exports.scheduleDealEmails = function() {
    console.log('The answer to life, the universe, and everything!');
    var now = new Date();
    async.parallel([function(callback) {
        alerts.find({ 'isBuyer': true, 'isAlertDailyDigest': true }).toArray(function(error, alert) {
            if (error) {
                callback(null);
            } else {
                callback(null, alert);
            }
        });

    }, function(callback) {
        helpFindLoad.aggregate([{ $match: { when: { $gte: new Date() } } }, {
                $group: {
                    _id: { week: { $week: '$when' } },
                    data: { $push: { origin: '$originreadable', destination: '$destinationreadable', when: '$when', price: '$price', vehicle: '$vehicle.description' } }
                }
            }])
            .toArray(function(error, weekhelpfindload) {
                if (error) {
                    callback(null);
                } else {
                    var weekData = _.sortBy(weekhelpfindload, function(obj) {
                        return obj._id.week;
                    })
                    callback(null, weekData[0]);
                }
            })
    }, function(callback) {
        helpFindLoad.aggregate([{ $match: { when: { $gte: new Date() } } }, { $group: { _id: { month: { $month: '$when' } }, data: { $push: { origin: '$originreadable', destination: '$destinationreadable', when: '$when', price: '$price', vehicle: '$vehicle.description' } } } }])
            .toArray(function(error, monthhelpfindload) {
                if (error) {
                    callback(null);
                } else {
                    callback(null, monthhelpfindload);
                }
            })
    }], function done(err, results) {
        if (err) {

        } else {
            var currentMonth = (new Date().getMonth()) + 1;
            var currentMonthDeals = _.filter(results[2], function(item) {
                return item._id.month == currentMonth;
            });
            var nextMonthDeals = _.filter(results[2], function(item) {
                return item._id.month == currentMonth + 1;
            });
            var buyers = _.uniqBy(results[0], function(o) {
                return (o.creator).toString();
            });
            var asyncCallArray = [];
            _.forEach(buyers, function(buyer) {
                var f = function(callback) {
                    accounts.findOne({ _id: getObjectId(buyer.creator) }, function(error, user) {
                        if (error != null) {
                            callback("{'status':'details-not-found'}");
                        } else {
                            if (user && (results[1] || results[2].length)) {
                                var locals = {
                                    username: user && user.name,
                                    weekData: (results[1] && results[1].data) || [],
                                    currentMonthData: (currentMonthDeals && currentMonthDeals[0] && currentMonthDeals[0].data) || [],
                                    nextMonthData: (nextMonthDeals && nextMonthDeals[0] && nextMonthDeals[0].data) || [],
                                    moment: moment
                                };
                                var emailDetails = {
                                    templateName: 'daily_deal',
                                    email: user.email,
                                    dealData: locals,
                                    subject: "a new deal was just published on Nemlevering.dk "
                                };
                                emailUtil.sendMail(emailDetails, function(errorSendingMail, successSendingMail) {
                                    console.log('sending scheduleDealEmails email', errorSendingMail, successSendingMail);
                                    callback();
                                });
                            }
                        }
                    });

                }
                asyncCallArray.push(f);
            });
            async.parallel(asyncCallArray, function(err, done) {
                if (err) {
                    console.log('error sending mail')
                } else {
                    console.log('mail send successfully');
                }
            })
        }
    });
};


// For daily reports at 20:00 copenhagen time
exports.dailyOverviewEmail = function() {
    var startDateLimit = new Date();
    startDateLimit.setHours(0, 0, 0, 0);
    var endDateLimit = new Date();
    endDateLimit.setDate(endDateLimit.getDate() + 1);
    endDateLimit.setHours(0, 0, 0, 0);
    scheduledDeliveries.aggregate([{ $match: { deliverydate: { $gte: startDateLimit, $lt: endDateLimit } } }, {
            $group: {
                _id: '$creator',
                data: {
                    $push: {
                        clientId: '$recipientclientid',
                        deliveryId: '$deliveryid',
                        clientName: '$recipientname',
                        clientPhone: '$recipientphone',
                        pickupAddress: '$pickupaddress',
                        address: '$deliveryaddress',
                        deliverywindowstart: '$deliverywindowstart',
                        deliverywindowend: '$deliverywindowend',
                        date: '$deliverydate',
                        status: '$carrier.status',
                        progressLog: '$carrier.progressLog'
                    }
                }
            }
        }])
        .toArray(function(error, scheduledDeliveries) {
            if (error) {} else {
                var asyncArray = [];
                _.forEach(scheduledDeliveries, function(deliveries) {
                    var asyncFunction = function(callback) {
                        var creator = deliveries._id;
                        findById(creator, function(e, account) {
                            if (e) {
                                callback(e, null);
                            } else {
                                if (account) {
                                    var nonDeliveredDeliveries = [];
                                    var deliveredDeliveries = [];
                                    _.forEach(deliveries.data, function(delivery) {
                                        if (delivery.status == 7) {
                                            deliveredDeliveries.push(delivery);
                                            var deliveryTime = _.filter(delivery.progressLog, function(progress) {
                                                return progress.toStatus == 7;
                                            });

                                            if (deliveryTime && deliveryTime.length) {
                                                delivery.deliveryTime = moment(deliveryTime[0].when).format("hh:mm");
                                                var startTime = '';
                                                var endTime = '';
                                                var status = '';
                                                delivery.deliveryTime = moment(deliveryTime[0].when).format("hh:mm A");
                                                if (moment(delivery.deliverywindowend, 'HH:mm A') < moment(delivery.deliveryTime, 'HH:mm A')) {
                                                    status = 'behind';
                                                    startTime = moment(delivery.deliverywindowend, 'HH:mm A');
                                                    endTime = moment(delivery.deliveryTime, 'HH:mm A');
                                                } else {
                                                    status = 'ahead';
                                                    startTime = moment(delivery.deliveryTime, 'HH:mm A');
                                                    endTime = moment(delivery.deliverywindowend, 'HH:mm A');
                                                }
                                                var duration = moment.duration(endTime.diff(startTime));
                                                var hours = parseInt(duration.asHours());
                                                var minutes = parseInt(duration.asMinutes()) - hours * 60;
                                                delivery.statusTime = (hours > 0 ? hours + ' hr ' : '') + (minutes > 0 ? minutes + ' mins ' : '') + status;
                                                delivery.minutes = hours * 60 + minutes;
                                            }
                                        } else {
                                            nonDeliveredDeliveries.push(delivery);
                                        }
                                        delivery.statusDescription = statusEnum.SCHEDULED_DELIVERY_STATUS[delivery.status];
                                    });
                                    var localData = {
                                        username: account && account.name,
                                        scheduledDeliveries: (deliveries && deliveries.data) || [],
                                        plannedDelivery: deliveries && deliveries.data && deliveries.data.length,
                                        delayDelivery: nonDeliveredDeliveries.length,
                                        delivered: deliveredDeliveries.length,
                                        deliveredPercent: Math.floor((deliveredDeliveries.length / deliveries.data.length) * 100),
                                        delayPercent: Math.floor((nonDeliveredDeliveries.length / deliveries.data.length) * 100),
                                        statusEnum: statusEnum.SCHEDULED_DELIVERY_STATUS,
                                        moment: moment
                                    };
                                    var emailDetails = {
                                        templateName: 'dailyscheduledroutereport',
                                        email: account.email,
                                        dealData: localData,
                                        subject: 'NemLevering.dk: Daily Overview'
                                    };
                                    emailUtil.sendMail(emailDetails, function(errorSendingMail, successSendingMail) {
                                        console.log('sending daily overview email', errorSendingMail, successSendingMail);
                                        callback();
                                    });
                                }
                            }
                        })
                    };
                    asyncArray.push(asyncFunction);
                });
                async.parallel(asyncArray, function(err, results) {

                });
            }
        })
};


// weekly reports of scheduled deliveries.
exports.weeklyOverviewEmail = function() {
    var currentWeek = currentWeekNumber(new Date());
    scheduledDeliveries.aggregate([{ $match: { weekno: currentWeek } }, {
            $group: {
                _id: '$creator',
                data: {
                    $push: {
                        clientId: '$recipientclientid',
                        deliveryId: '$deliveryid',
                        clientName: '$recipientname',
                        clientPhone: '$recipientphone',
                        pickupAddress: '$pickupaddress',
                        address: '$deliveryaddress',
                        deliverywindowstart: '$deliverywindowstart',
                        deliverywindowend: '$deliverywindowend',
                        date: '$deliverydate',
                        status: '$carrier.status',
                        progressLog: '$carrier.progressLog'
                    }
                }
            }
        }])
        .toArray(function(error, scheduledDeliveries) {
            if (error) {} else {
                var asyncArray = [];
                _.forEach(scheduledDeliveries, function(deliveries) {
                    var asyncFunction = function(callback) {
                        var creator = deliveries._id;
                        findById(creator, function(e, account) {
                            if (e) {
                                callback(e, null);
                            } else {
                                if (account) {
                                    var nonDeliveredDeliveries = [];
                                    var deliveredDeliveries = [];
                                    _.forEach(deliveries.data, function(delivery) {
                                        if (delivery.status == 7) {
                                            deliveredDeliveries.push(delivery);
                                            var deliveryTime = _.filter(delivery.progressLog, function(progress) {
                                                return progress.toStatus == 7;
                                            });

                                            if (deliveryTime && deliveryTime.length) {
                                                delivery.deliveryTime = moment(deliveryTime[0].when).format("hh:mm");
                                                var startTime = '';
                                                var endTime = '';
                                                var status = '';
                                                delivery.deliveryTime = moment(deliveryTime[0].when).format("hh:mm A");
                                                if (moment(delivery.deliverywindowend, 'HH:mm A') < moment(delivery.deliveryTime, 'HH:mm A')) {
                                                    status = 'behind';
                                                    startTime = moment(delivery.deliverywindowend, 'HH:mm A');
                                                    endTime = moment(delivery.deliveryTime, 'HH:mm A');
                                                } else {
                                                    status = 'ahead';
                                                    startTime = moment(delivery.deliveryTime, 'HH:mm A');
                                                    endTime = moment(delivery.deliverywindowend, 'HH:mm A');
                                                }
                                                var duration = moment.duration(endTime.diff(startTime));
                                                var hours = parseInt(duration.asHours());
                                                var minutes = parseInt(duration.asMinutes()) - hours * 60;
                                                delivery.statusTime = (hours > 0 ? hours + ' hr ' : '') + (minutes > 0 ? minutes + ' mins ' : '') + status;
                                                delivery.minutes = hours * 60 + minutes;
                                            }
                                        } else {
                                            nonDeliveredDeliveries.push(delivery);
                                        }
                                        delivery.statusDescription = statusEnum.SCHEDULED_DELIVERY_STATUS[delivery.status];
                                    });
                                    var localData = {
                                        username: account && account.name,
                                        scheduledDeliveries: (deliveries && deliveries.data) || [],
                                        plannedDelivery: deliveries && deliveries.data && deliveries.data.length,
                                        delayDelivery: nonDeliveredDeliveries.length,
                                        delivered: deliveredDeliveries.length,
                                        deliveredPercent: Math.floor((deliveredDeliveries.length / deliveries.data.length) * 100),
                                        delayPercent: Math.floor((nonDeliveredDeliveries.length / deliveries.data.length) * 100),
                                        statusEnum: statusEnum.SCHEDULED_DELIVERY_STATUS,
                                        moment: moment,
                                        currentWeek: currentWeek
                                    };
                                    var emailDetails = {
                                        templateName: 'weeklyscheduledroutereport',
                                        email: account.email,
                                        dealData: localData,
                                        subject: 'NemLevering.dk: Weekly Overview'
                                    };
                                    emailUtil.sendMail(emailDetails, function(errorSendingMail, successSendingMail) {
                                        console.log('sending weekly overview email', errorSendingMail, successSendingMail);
                                        callback();
                                    });
                                }
                            }
                        })
                    };
                    asyncArray.push(asyncFunction);
                });
                async.parallel(asyncArray, function(err, results) {

                });
            }
        })
};


exports.scheduleRoutesEmail = function() {
    var startDateLimit = new Date();
    startDateLimit.setHours(0, 0, 0, 0);
    var endDateLimit = new Date();
    endDateLimit.setDate(endDateLimit.getDate() + 1);
    endDateLimit.setHours(0, 0, 0, 0);
    scheduledDeliveries.aggregate([{ $match: { deliverydate: { $gte: startDateLimit, $lt: endDateLimit } } }, {
            $group: {
                _id: '$creator',
                data: {
                    $push: {
                        clientId: '$recipientclientid',
                        clientName: '$recipientname',
                        clientPhone: '$recipientphone',
                        pickupAddress: '$pickupaddress',
                        address: '$deliveryaddress',
                        deliverywindowstart: '$deliverywindowstart',
                        date: '$deliverydate',
                        status: '$carrier.status',
                        progressLog: '$carrier.progressLog'
                    }
                }
            }
        }])
        .toArray(function(error, scheduledDeliveries) {
            if (error) {} else {
                var asyncArray = [];
                _.forEach(scheduledDeliveries, function(deliveries) {
                    var asyncFunction = function(callback) {
                        var creator = deliveries._id;
                        findById(creator, function(e, account) {
                            if (e) {
                                callback(e, null);
                            } else {
                                if (account) {
                                    var nonDeliveredDeliveries = [];
                                    var deliveredCount = _.filter(deliveries.data, function(delivery) {
                                        if (delivery.status == 7)
                                            return delivery;
                                    }).length;

                                    _.forEach(deliveries.data, function(delivery) {
                                        if (!(delivery.status) || delivery.status != 7) {
                                            nonDeliveredDeliveries.push(delivery);
                                        }
                                        delivery.statusDescription = statusEnum.SCHEDULED_DELIVERY_STATUS[delivery.status];
                                    });
                                    var etaFuns = [];
                                    _.forEach(nonDeliveredDeliveries, function(nonDeliver) {

                                        var etaAsync = function(etaCallback) {
                                            var etarequest = {};
                                            etarequest.origin = nonDeliver && nonDeliver.pickupAddress;
                                            etarequest.destination = nonDeliver && nonDeliver.address;

                                            helperUtil.getDeliveriesETA(etarequest, function(etaError, etaSuccess) {
                                                if (etaError) {
                                                    etaCallback();
                                                } else {
                                                    nonDeliver.eta = etaSuccess && etaSuccess.eta;
                                                    etaCallback();
                                                }
                                            });
                                        }
                                        etaFuns.push(etaAsync);
                                    });
                                    async.parallel(etaFuns, function(ETAerr, ETAresults) {
                                        _.forEach(nonDeliveredDeliveries, function(delivery) {

                                            var now = new Date();
                                            var currentTime = moment(now).format('HH:mm A');
                                            if (moment(currentTime, 'HH:mm A') < moment(delivery.deliverywindowstart, 'HH:mm A')) {
                                                var t = moment(delivery.deliverywindowstart, 'HH:mm A');
                                                now.setHours(t.get('hour'), t.get('minute'), 0, 0);
                                            }
                                            var deliveryDate = new Date(now.setSeconds(now.getSeconds() + (5 * 60 + (delivery.eta && delivery.eta.arrivingInSeconds ? delivery.eta.arrivingInSeconds : 0))));
                                            delivery.expactedDeliveryTime = moment(deliveryDate).format('hh:mm A');

                                        });

                                        var localData = {
                                            username: account && account.name,
                                            scheduledDeliveries: nonDeliveredDeliveries || [],
                                            nonDelivered: nonDeliveredDeliveries.length,
                                            delivered: deliveredCount,
                                            statusEnum: statusEnum.SCHEDULED_DELIVERY_STATUS,
                                            moment: moment
                                        };
                                        var emailDetails = {
                                            templateName: 'scheduledroutes',
                                            email: account.email,
                                            dealData: localData,
                                            subject: account.name + " : 15:00 report  " + moment(startDateLimit).format('YYYY/MM/DD')
                                        };
                                        emailUtil.sendMail(emailDetails, function(errorSendingMail, successSendingMail) {
                                            console.log('sending email', errorSendingMail, successSendingMail);
                                            callback();
                                        });
                                    });
                                }
                            }
                        })
                    };
                    asyncArray.push(asyncFunction);
                });
                async.parallel(asyncArray, function(err, results) {

                });
            }
        })
};

/*Get weekly scheduled deliveries created by upload file*/
exports.getWeeklyPlan = function(userId, callback) {
    // scheduledDeliveries.aggregate([{ $match: { creator: getObjectId(userId) } }, {
    //             $group: {
    //                 _id: '$weekno',
    //                 data: {
    //                     $push: {
    //                         _id: '$_id',
    //                         deliveryId: '$deliveryid',
    //                         date: '$deliverydate',
    //                         recipientname: '$recipientname',
    //                         recipientemail: '$recipientemail',
    //                         recipientphone: '$recipientphone',
    //                         pickupaddress: '$pickupaddress',
    //                         deliveryaddress: '$deliveryaddress',
    //                         weekno: '$weekno',
    //                         day: '$deliverydayofweek'
    //                     }
    //                 }
    //             }
    //         },
    //         { $sort: { _id: 1 } }
    //     ])
    //     .toArray(function(error, weekPlan) {
    //         if (error) {
    //             callback(null);
    //         } else {
    //             callback(null, weekPlan);
    //         }
    //     })

    routes.find({ creator: getObjectId(userId) }).toArray(function(err, rt) {
        if (err) {
            callback(null);
        } else {
            callback(null, rt);
        }
    })
};

/**
 *save optimize routes into routes collection
 * @param data: routes array
 */
exports.saveRoutes = function(data, callback) {
    routes.insert(data, function(err, o) {
        if (err) {
            callback(err, o);
        } else {
            callback(null, o);
        }
    });
};

/**
 * @param userId
 * get Routes of particular user
 * */

exports.getRoutes = function(userId, callback) {
    var date = new Date();
    var todayDate = new Date(date.setHours(0, 0, 0, 0));
    routes.aggregate([{ $match: { $and: [{ creator: getObjectId(userId) }, { routeDate: { $gte: todayDate } }] } }, {
            $group: {
                _id: '$weekNo',
                data: {
                    $push: {
                        routes: '$solution.routes',
                        week: '$weekNo',
                        day: '$weekDay',
                        routeDate: '$routeDate',
                        routeId: '$_id'

                    }
                }
            }
        }])
        .toArray(function(error, routes) {
            if (error) {
                callback(null);
            } else {
                callback(null, routes);
            }
        });
};

exports.deleteRoutes = function(routeId, routeDate, vehicleId, deliveryIds, callback) {

    var routesQuery = { _id: getObjectId(routeId) };
    routes.findOne(routesQuery, function(error, route) {
        if (error) {
            callback(error, null);
        } else {
            var index = _.findIndex(route && route.solution && route.solution.routes, function(entry) {
                return entry.vehicle_id == vehicleId;
            });

            //removing that particular route
            route && route.solution && route.solution.routes && route.solution.routes.splice(index, 1);

            routes.save(route, { safe: true }, function(err, objInserted) {
                if (err) {
                    callback(err, null);
                } else {

                    //now to remove deliveries from deliveries collection.
                    for (var i = 0; i < deliveryIds.length; i++) {
                        deliveryIds[i] = getObjectId(deliveryIds[i]);
                    }
                    var deliveryQuery = { '_id': { $in: deliveryIds } };

                    scheduledDeliveries.remove(deliveryQuery, function(delErr, delObj) {
                        if (delErr) {
                            callback(delErr, null);
                        } else {
                            callback(null, delObj);
                        }
                    });
                }
            });
        }
    });
};


/**
 * @param userId
 * @param date
 * get Routes of particular user
 * */

exports.getAllRoutesByDay = function(date, userId, callback) {

    var selectedDate = new Date(date);

    var startDateLimit = new Date(selectedDate.getTime());

    var endDateLimit = new Date(selectedDate.getTime());
    endDateLimit.setDate(endDateLimit.getDate() + 1);

    async.parallel([function(callback) {
        var routesQuery = { creator: getObjectId(userId), routeDate: { $gte: startDateLimit, $lt: endDateLimit } };
        routes.find(routesQuery)
            .toArray(function(error, routes) {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, routes);
                }
            });
    }, function(callback) {
        var deliveryQuery = { creator: getObjectId(userId), deliverydate: { $gte: startDateLimit, $lt: endDateLimit } };
        scheduledDeliveries.find(deliveryQuery).toArray(function(error, deliveries) {
            if (error) {
                callback(error, null);
            } else {
                callback(null, deliveries);
            }
        });

    }, function(callback) {
        var userQuery = { carrier: '1', softDelete: { $ne: '1' } };
        accounts.find(userQuery).sort({ name: 1 }).toArray(function(err, users) {
            if (err) {
                callback(err, []);
            } else {
                callback(null, users);
            }
        });
    }], function done(err, result) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else {
            var routes = result && result[0];
            routes = routes && routes[0];
            var deliveries = result && result[1];
            var users = result && result[2];

            if (routes) {
                _.forEach(routes && routes.solution && routes.solution.routes, function(route) {
                    var driver = _.filter(users, function(user) {
                        return route.driverId && (route.driverId).toString() == (user._id).toString();
                    });
                    if (driver && driver.length) {
                        route.driverName = driver[0].name;
                    }
                    route && route.activities.splice(0, 1);
                    route && route.activities.splice((route && route.activities.length - 1), 1);

                    _.forEach(route && route.activities, function(dayRoutes) {

                        var delivery = _.filter(deliveries, function(data) {
                            return dayRoutes.location_id == data.deliveryid;
                        })[0];
                        objectAssign(dayRoutes, delivery);
                    });
                });
                callback(null, routes)
            } else {
                callback(null, []);
            }
        }
    });
};


/**
 * @param userId
 * get Routes of particular user
 * */

exports.getRoutesWeekPlan = function(userId, callback) {
    routes.aggregate([{ $match: { creator: getObjectId(userId) } }, {
            $group: {
                _id: '$weekNo',
                data: {
                    $push: {
                        routes: '$solution.routes',
                        week: '$weekNo',
                        day: '$weekDay',
                        routeDate: '$routeDate'

                    }
                }
            }
        }])
        .toArray(function(error, routes) {
            if (error) {
                callback(null);
            } else {
                callback(null, routes);
            }
        });

    // routes.find({creator: apikey}).exec(function(err, rt) {
    //     console.log(rt);
    // })
};

/**
 * get routes of a day of week
 * @param request: weekNo, day, userId
 */
exports.getDayRoutes = function(request, callback) {
    var query = { weekNo: request.week, creator: getObjectId(request.userId) };
    if (!_.isEmpty(request.day)) {
        query.weekDay = { $in: [request.day, request.day.toLowerCase()] };
    }
    routes.find(query).toArray(function(error, routes) {
        if (error) {
            callback(error, null);
        } else {

            callback(null, routes);
        }
    });
};

/**
 * get scheduled deliveries ofa day of week
 * @param request: weekNo, day, userId
 */
exports.getWeekDaysScheduledDeliveries = function(request, callback) {

    var query = { weekno: parseInt(request.week, 10), creator: getObjectId(request.userId) };
    if (!_.isEmpty(request.day)) {
        query.deliverydayofweek = { $in: [request.day, request.day.toLowerCase()] };
    }
    scheduledDeliveries.find(query).toArray(function(error, deliveries) {
        if (error) {
            callback(error, null);
        } else {
            var asyncArray = [];
            _.forEach(request.routes, function(dayRoute) {
                _.forEach(dayRoute && dayRoute.solution && dayRoute.solution.routes, function(route) {
                    _.forEach(route.activities, function(delivery, index) {
                        var asyncFunction = function(cb) {
                            var eta = {};
                            var origin = '';
                            var etarequest = {};
                            if (index != 0 && index != route.activities.length) {
                                if (index == 1) {
                                    var routeFirstDelivery = _.filter(deliveries, function(scheduledDelivery) {
                                        return scheduledDelivery.deliveryid == delivery.location_id;
                                    });
                                    if (routeFirstDelivery && routeFirstDelivery.length && routeFirstDelivery[0].carrier) {
                                        if (routeFirstDelivery[0].carrier.status == 7) {
                                            cb();
                                        } else {
                                            module.exports.getTruck({ userID: request.userId, truckID: routeFirstDelivery[0].carrier.vehicle && routeFirstDelivery[0].carrier.vehicle.id }, function(error, truck) {
                                                if (truck && truck.liveDelivery) {
                                                    etarequest.origin = (truck.liveDelivery.location && truck.liveDelivery.location.coordinates) ? ('' + truck.liveDelivery.location.coordinates[1] + ',' + truck.liveDelivery.location.coordinates[0]) : routeFirstDelivery[0].pickupaddress;
                                                    etarequest.destination = routeFirstDelivery[0].deliveryaddress;
                                                    etarequest.status = 8;
                                                    helperUtil.getDeliveriesETA(etarequest, function(etaError, etaSuccess) {
                                                        if (etaError) {
                                                            cb();
                                                        } else {
                                                            delivery.eta = etaSuccess && etaSuccess.eta;
                                                            cb();
                                                        }
                                                    });
                                                } else {
                                                    cb();
                                                }
                                            });
                                        }
                                    } else {
                                        //routeFirstDelivery[0].carrier = {};
                                        etarequest.origin = routeFirstDelivery[0] && routeFirstDelivery[0].pickupaddress;
                                        etarequest.destination = routeFirstDelivery[0] && routeFirstDelivery[0].deliveryaddress;
                                        etarequest.pickupdeadline = routeFirstDelivery[0] && routeFirstDelivery[0].pickupdeadline;
                                        etarequest.deliverydate = routeFirstDelivery[0] && routeFirstDelivery[0].deliverydate;
                                        etarequest.status = 0;
                                        helperUtil.getDeliveriesETA(etarequest, function(etaError, etaSuccess) {
                                            if (etaError) {
                                                cb();
                                            } else {
                                                delivery.eta = etaSuccess && etaSuccess.eta;
                                                //routeFirstDelivery[0].carrier.status = 0;
                                                cb();
                                            }
                                        });
                                    }
                                } else {
                                    etarequest.origin = route.activities[index - 1].address && ('' + route.activities[index - 1].address.lat + ',' + route.activities[index - 1].address.lon);
                                    etarequest.destination = delivery.address && ('' + delivery.address.lat + ',' + delivery.address.lon);
                                    helperUtil.getDeliveriesETA(etarequest, function(etaError, etaSuccess) {
                                        if (etaError) {
                                            cb();
                                        } else {
                                            delivery.eta = etaSuccess && etaSuccess.eta;
                                            cb();
                                        }
                                    });
                                }
                            } else {
                                cb();
                            }

                        };
                        asyncArray.push(asyncFunction);
                    });
                });
            })

            async.parallel(asyncArray, function(error, success) {
                callback(null, deliveries, request.routes);
            });
        }
    });
};

//Get all routes for that week.
exports.processRoutesForReplace = function(newPlannedRoutes, clientId, weekNos, callback) {
    //get for all weeks in weekNos array.
    var query = { weekNo: weekNos };
    query.creator = getObjectId(clientId);
    routes.find(query).toArray(function(error, existingRoutes) {
        addPlannedRoutes(newPlannedRoutes, existingRoutes, function(err, finalResult) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, finalResult);
            }
        });
    });
};

exports.searchDeliveries = function(searchText, date, userId, callback) {
    var startDateLimit = new Date(date);
    startDateLimit.setUTCHours(0);
    startDateLimit.setUTCMinutes(0);
    startDateLimit.setUTCSeconds(0);
    startDateLimit.setUTCMilliseconds(0);
    var endDateLimit = new Date(date);
    endDateLimit.setUTCDate(endDateLimit.getUTCDate() + 1);
    endDateLimit.setUTCHours(0);
    endDateLimit.setUTCMinutes(0);
    endDateLimit.setUTCSeconds(0);
    endDateLimit.setUTCMilliseconds(0);
    var query = { creator: getObjectId(userId), deliverydate: { $gte: startDateLimit, $lt: endDateLimit }, $text: { $search: '\"' + searchText + '\"' } }
    scheduledDeliveries.find(query).toArray(function(error, response) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, response);
        }
    })
};

var addPlannedRoutes = function(newRoutes, existingRoutes, callback) {
    var asyncParllel = [];
    var newRoute = [];

    _.forEach(newRoutes, function(route) {
        var result = _.findIndex(existingRoutes, function(o) {
            return (o.weekDay.toLowerCase() == route.weekDay.toLowerCase() && o.weekNo == route.weekNo);
        });
        if (result != -1) {
            //callbacks to update the records
            var updateFunction = function(cb) {
                routes.findOne({ _id: existingRoutes[result]._id }, function(err, obj) {
                    console.log('find route-----', obj);
                    if (obj && obj.solution && obj.solution.routes) {
                        _.forEach(route && route.solution && route.solution.routes, function(item) {
                            obj.solution.routes.push(item);
                        });
                        routes.update({ _id: existingRoutes[result]._id }, obj, function(error, updated) {
                            if (updated) {
                                cb();
                            } else {
                                cb();
                            }
                        })
                    } else {
                        cb();
                    }
                });
            };
            asyncParllel.push(updateFunction);
        } else {
            newRoute.push(route);
        }

    });

    if (newRoute && newRoute.length) {
        //callbacks to create new entries  in file.
        var insertFuntion = function(cb) {
            routes.insert(newRoute, function(err, o) {
                cb();
            });
        }
        asyncParllel.push(insertFuntion);
    }

    //This is the final callback
    async.parallel(asyncParllel, function(err, done) {
        if (!err) {
            callback(null, done);
        } else {
            callback(err, null);
        }

    });
};

//delete routes and scheduled deliveries of a particular week

exports.removeWeekPlan = function(week, userId, callback) {
    routes.remove({ weekNo: week, creator: getObjectId(userId) }, function(err, success) {
        if (success) {
            scheduledDeliveries.remove({ weekno: parseInt(week, 10), creator: getObjectId(userId) }, function(error, deleted) {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, deleted);
                }
            });
        } else {
            callback(err, null);
        }
    });
};

exports.checkDeliveryStarted = function(week, userId, currentWeek, callback) {
    var deliveryQuery = { creator: getObjectId(userId), weekno: parseInt(week), carrier: { $exists: false } };
    if (parseInt(week) <= parseInt(currentWeek)) {
        scheduledDeliveries.find(deliveryQuery).count(function(error, deliveriesCount) {
            if (error) {
                callback(error, null);
            } else {
                if (deliveriesCount > 0) {
                    callback('delvieries_not_started', null);
                } else {
                    callback(null, null);
                }
            }
        });
    } else {
        callback(null, null);
    }
};

//Add or update scheduled setting to a particular client
exports.updateScheduledSetting = function(clientId, scheduledSetting, callback) {
    accounts.findOneAndUpdate({ _id: clientId }, { $set: { 'scheduledSetting': scheduledSetting } }, function(err, obj) {
        if (obj) {
            callback(null, obj);
        } else {
            callback(err, null);
        }
    });
};

//Add a new Scheduled delivery on a specified position of given route
exports.addScheduledDeliveryOnPosition = function(clientId, payload, callback) {
    var query = {
        _id: getObjectId(payload.routeDetails.routeId),
        'solution.routes.vehicle_id': payload.routeDetails.routeName
    };
    payload.delivery.location_id = payload.delivery.deliveryid;
    payload.delivery.address = {
        location_id: payload.delivery.location_id,
        lat: payload.delivery.deliverycoordinates[1],
        lon: payload.delivery.deliverycoordinates[0]
    };
    payload.delivery.creator = clientId;
    payload.delivery.deliverydate = new Date(payload.delivery.deliverydate);
    routes.update(query, {
        $push: {
            'solution.routes.$.activities': {
                $each: [payload.delivery],
                $position: parseInt(payload.deliveryOrder, 10)
            }
        }
    }, function(err, obj) {
        if (obj) {
            scheduledDeliveries.save(payload.delivery, { safe: true }, function(error, objInserted) {
                callback(null, objInserted);
            });
        } else {
            callback(err, null);
        }
    });
};

exports.getRoutesByName = function(routeDetails, callback) {
    var query = {
        _id: getObjectId(routeDetails.routeId),
        'solution.routes.vehicle_id': routeDetails.routeName
    };
    routes.findOne(query, { 'solution.routes.$': 1 }, function(err, route) {
        if (route) {
            callback(null, route);
        } else {
            callback(err, null);
        }
    })
};

//get scheduledSetting of particular client
exports.getScheduledSetting = function(userId, callback) {
    accounts.findOne({ _id: userId }, { 'scheduledSetting': 1 }, function(e, o) {
        if (o) {
            callback(null, o);
        } else {
            callback(e, null);
        }
    });
};

exports.getDeliveriesForPDF = function(request, callback) {

    var query = { weekno: parseInt(request.week, 10), creator: getObjectId(request.userId) };
    if (!_.isEmpty(request.day)) {
        query.deliverydayofweek = { $in: [request.day, request.day.toLowerCase()] };
    }

    scheduledDeliveries.find(query).toArray(function(error, deliveries) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, deliveries);
        }
    });
};



exports.createPDF = function(deliveries, callback) {
    var pdfDeliveries = [];

    _.forEach(deliveries, function(delivery) {
        pdfDeliveries.push({
            deliveryid: delivery.deliveryid,
            recipientclientid: delivery.recipientclientid,
            recipientname: delivery.recipientname,
            recipientemail: delivery.recipientemail || 'N/A',
            recipientphone: delivery.recipientphone,
            deliveryaddress: delivery.deliveryaddress
        });
    });

    var pdf = new PdfDocument({
            autoFirstPage: false
        }),
        table = new PdfTable(pdf, {
            bottomMargin: 30
        });
    table.setNewPageFn(function(table, row) {
        // do something like
        table.pdf.addPage();
    });

    table.addPlugin(new(require('voilab-pdf-table/plugins/fitcolumn'))({
            column: 'deliveryid'

        }))
        .setColumnsDefaults({
            headerBorder: 'B',
            align: 'right'
        })
        .addColumns([{
            id: 'deliveryid',
            header: 'DeliveryId',
            align: 'left',
            width: 70
        }, {
            id: 'recipientclientid',
            header: 'ClientId',
            align: 'left',
            width: 70
        }, {
            id: 'recipientname',
            header: 'Client Name',
            align: 'left',
            width: 80
        }, {
            id: 'recipientemail',
            header: 'Client Email',
            align: 'left',
            width: 60
        }, {
            id: 'recipientphone',
            header: 'Client Phone',
            align: 'left',
            width: 80
        }, {
            id: 'deliveryaddress',
            header: 'Delivery Address',
            align: 'left',
            width: 80
        }])
        .onPageAdded(function(tb) {
            tb.addHeader();
        });

    pdf.addPage();


    table.addBody(pdfDeliveries);

    callback(null, pdf)
};

/* private encryption & validation methods */


var generateSalt = function() {
    var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
    var salt = '';
    for (var i = 0; i < 10; i++) {
        var p = Math.floor(Math.random() * set.length);
        salt += set[p];
    }
    return salt;
}

var md5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback) {
    var salt = generateSalt();
    callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback) {
    var salt = hashedPass && hashedPass.substr(0, 10);
    var validHash = salt + md5(plainPass + salt);
    callback(null, hashedPass === validHash);
}

/* auxiliary methods */

var getObjectId = function(id) {
    if (!IsValidID(id))
        return '000000000000000000000000';

    return new require('mongodb').ObjectID(id);
}

function IsValidID(id) {
    var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
    return checkForHexRegExp.test(id);
}

var findById = function(id, callback) {
    accounts.findOne({ _id: getObjectId(id) },
        function(e, res) {
            if (e) callback(e)
            else callback(null, res)
        });
};


var findByMultipleFields = function(a, callback) {
    //  this takes an array of name/val pairs to search against {fieldName : 'value'} //
    accounts.find({ $or: a }).toArray(
        function(e, results) {
            if (e) callback(e)
            else callback(null, results)
        });
};