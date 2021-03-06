'use strict';
const mongoose = require('mongoose');
const Loc = mongoose.model('Location');
const Res = require('./shared');

let theEarth = (function () {
    let earthRadius = 6371; // miles, km is 6371

    let getDistanceFromRads = function(rads) {
      return parseFloat(rads * earthRadius);
    };

    let getRadsFromDistance = function(distance) {
      return parseFloat(distance / earthRadius);
    };

    return {
      getDistanceFromRads : getDistanceFromRads,
      getRadsFromDistance : getRadsFromDistance
    };
})();

module.exports.locationsCreate = (req, res, next) => {
    Loc.create( getLocationRequestObject(req)
        , (error, location) => {
        if (error) {
            Res.sendJsonResponse(res, 400, error);
        } else {
            Res.sendJsonResponse(res, 201, location);
        }
    })
}

module.exports.locationsListByDistance = (req, res, next) => {
    //http://localhost:4000/api/locations?lng=-104.98653&lat=39.732975&dist=20
    let lng = parseFloat(req.query.lng);
    let lat = parseFloat(req.query.lat);
    let dist = parseFloat(req.query.dist);

    if ((!lng && lng !== 0) || (!lat && lat !== 0)) {
        Res.sendJsonResponse(res, 400, {
            "message" : "[lng] and/or [lat] parameters are missing"
        });
        return;
    } 
    let point = {
        type: 'Point',
        coordinates: [lng, lat]
    };

    Loc.aggregate([{
        $geoNear: {
            near: point,
            spherical: true,
            maxDistance: dist * 1000,
            distanceField: 'distance',
            num: 20
        },
    }, {
        //fields to be returned
        $project:{
            distance: true,
            name: true,
            address: true,
            rating: true,
            facilities: true
        }
    }]).then((results) => {
        if (results.length > 0) {
            Res.sendJsonResponse(res, 200, results);
        } else {
            Res.sendJsonResponse(res, 404, {
                "message" : "No locations were found near your"
            });
        }
    }).catch((error) => {
        Res.sendJsonResponse(res, 404, error);
    });
}

module.exports.locationsReadOne = (req, res, next) => {
    if(!(req.params && req.params.locationId)) { 
        Res.sendJsonResponse(res, 400, {
            "message" : "[locationId] parameter is missing"
        });
        return;
    }
        Loc
        .findById(req.params.locationId)
        .exec((error, location) => {
            if(!location){
                Res.sendJsonResponse(res, 404, {
                    "message" : "Location with provided ID is not found"
                });
                return;
            } else if (error) {
                Res.sendJsonResponse(res, 404, error);
                return;
            }
            Res.sendJsonResponse(res, 200, location);
            return;
        });
}

module.exports.locationsUpdateOne = (req, res, next) => {
    if (!req.params.locationId) {
        Res.sendJsonResponse(res, 400, {
            "message" : "Not found. [locationId] is required"
        });
        return;
    }

    Loc
        .findById(req.params.locationId)
        .select('-reviews -rating')
        .exec((error, location) => {
            if (!location) {
                Res.sendJsonResponse(res, 404, {
                    "message" : "Location not found"
                });
                return;
            } else if (error) {
                Res.sendJsonResponse(res, 400, error);
                return;
            }

            location = getLocationRequestObject(req);

            location.save((error, location) => {
                if (error) {
                    Res.sendJsonResponse(res, 400, err);
                } else {
                    Res.sendJsonResponse(res, 200, location);
                }
            });
        })
}

module.exports.locationsDeleteOne = (req, res, next) => {
    let locationId = req.body.locationId;
    if (!locationId) {
        Res.sendJsonResponse(res, 400, {
            "message" : "[locationId] is required"
        });
        return;
    }

    Loc.
        findById(locationId)
        .exec((error, location) => {
            if (error) {
                Res.sendJsonResponse(res, 404, error);
                return;
            }
            Res.sendJsonResponse(res, 204, null);
        });
}

let getLocationRequestObject = (req) => {
    let location = {};
        location.name = req.body.name,
        location.address = req.body.address,
        location.facilities = req.body.facilities.split(","),
        location.coords = [parseFloat(req.body.lng), parseFloat(req.body.lat)],
        location.openingTimes = [{
            days: req.body.days1,
            opening: req.body.opening1,
            closing: req.body.closing1,
            closed: req.body.closed1
        },{
            days: req.body.days2,
            opening: req.body.opening2,
            closing: req.body.closing2,
            closed: req.body.closed2
        }];
    return location;
}