const lauchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');
const axios = require('axios');
const e = require('express');


const defaultFlightNumber = 100;

async function getAllLaunches(limit, skip) {
    return await lauchesDatabase.find({}, {
        '_id': 0,
        '__v': 0
    }).sort({ flightNumber: 1 })
        .skip(skip)
        .limit(limit);

}
async function getLatestFlightNumber() {
    const latestLaunch = await lauchesDatabase.findOne().sort('-flightNumber');
    if (!latestLaunch) {
        return defaultFlightNumber;
    }
    return latestLaunch.flightNumber;
}
async function saveLaunch(launch) {

    await lauchesDatabase.findOneAndUpdate({
        flightNumber: launch.flightNumber
    }, launch, {
        upsert: true
    });

}

async function existsLaunchwithId(launchId) {
    return await findLaunch({
        flightNumber: launchId,

    });

}
async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target

    });
    if (!planet) {
        throw new Error('No Matching planet found');
    }
    const newflightNumber = await getLatestFlightNumber() + 1;

    const newLaunch = Object.assign(launch, {
        success: true,
        upcoming: true,
        flightNumber: newflightNumber,
        customer: ['ISRO', 'NASA'],

    });
    await saveLaunch(newLaunch);


}
// function addNewLaunch(launch) {
//     latestFlightNumber++;
//     launches.set(latestFlightNumber, Object.assign(launch, {
//         success: true,
//         flightNumber: latestFlightNumber,
//         upcoming: true,
//         customer: ['ISRO', 'NASA'],


//     }));
// }
async function abortLaunch(id) {


    const aborted = await lauchesDatabase.updateOne({ flightNumber: id }, {
        'upcoming': false,
        'success': false,
    });
    return aborted.matchedCount === 1 && aborted.modifiedCount === 1;



}
async function findLaunch(filter) {
    return await lauchesDatabase.findOne(filter);

}
const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';


async function populateLaunches() {
    console.log('Downloading launch data!');
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [{
                path: 'rocket',
                select: {
                    name: 1
                }
            },
            {
                path: 'payloads',
                select: {
                    customers: 1
                }
            }]
        }
    });
    if (response.status !== 200) {
        console.log('Problem downloading Launch data');
        throw new Error('Problem downloading Launch data');
    }
    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        });
        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers: customers

        }
        console.log(`${launch.flightNumber} ${launch.mission}`);
        await saveLaunch(launch);

    }
}
async function loadLaunchData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat'

    });
    if (firstLaunch) {
        console.log('Launch data already exists!');

    } else {
        await populateLaunches();
    }


}


module.exports = {

    getAllLaunches,
    scheduleNewLaunch,
    existsLaunchwithId,
    abortLaunch,
    loadLaunchData
}