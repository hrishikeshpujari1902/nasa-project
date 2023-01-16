const { getAllLaunches, scheduleNewLaunch, abortLaunch, existsLaunchwithId } = require('../../models/launches.model');
const { getPagination } = require('./../../services/query');


async function httpGetAllLaunches(req, res) {
    const { skip, limit } = getPagination(req.query);


    return res.status(200).json(await getAllLaunches(limit, skip));
}
async function httpAddNewLaunch(req, res) {
    const launch = req.body;
    if (!launch.mission || !launch.launchDate || !launch.rocket || !launch.target) {
        return res.status(400).json({
            error: 'Missing required Launch Property',

        });
    }
    launch.launchDate = new Date(launch.launchDate);
    if (isNaN(launch.launchDate)) {
        return res.status(400).json({
            error: "Invalid launch date.",
        })

    }
    try {
        await scheduleNewLaunch(launch);

    } catch (err) {
        return res.status(400).json({
            error: "Planet not found",
        })
    }

    return res.status(201).json(launch);
}


async function httpDeleteLaunch(req, res) {
    const launchId = Number(req.params.id);
    const existsLaunch = await existsLaunchwithId(launchId);
    if (existsLaunch) {
        const aborted = await abortLaunch(launchId);
        if (!aborted) {
            return res.status(400).json({
                error: 'Launch not aborted'
            });
        }
        return res.status(200).json({
            ok: true
        });

    } else {
        res.status(400).json({
            error: "Launch not found",
        })

    }




}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpDeleteLaunch
}