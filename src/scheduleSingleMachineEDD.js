const fs = require('fs');

function loadJobs(path) {
    /*
    reads a json file that needs to have the structure
        {
            "jobs": [
                {
                    "jobId": 0,
                    "duration": 4,
                    "deadline": 6
                },
                {
                    "jobId": 1,
                    "duration": 2,
                    "deadline": 21
                }, ...
            ]
        }
    returns the jobs array
    */

    let raw = fs.readFileSync(path);
    let jsonObj = JSON.parse(raw);
    return jsonObj.jobs;
}

function calculateFinishingTimeAndDelay(jobs) {
    /*
    takes the given job order and assumes the jobs are done in this order by one machine


    Input:
    - array of jobs
        [
            {
                "jobId": 0,
                "duration": 4,
                "deadline": 6
            },
            {
                "jobId": 1,
                "duration": 2,
                "deadline": 21
            }, ...
        ]

    Output:
    - array of jobs with finishing time and delay
        [
            {
                "job": {
                    "jobId": 0,
                    "duration": 4,
                    "deadline": 6
                },
                "finishingTime": 5,
                "delay": 0
            },
            {
                "job": {
                    "jobId": 1,
                    "duration": 4,
                    "deadline": 6
                },
                "finishingTime": 34,
                "delay": 13
            }, ...
        ]

    */
    finishingTimes = [0];
    jobsWithFinishingTimeAndDelay = [];
    for (let i = 0; i < jobs.length; i++) {
        let job = jobs[i];
        let finishingTime = finishingTimes[i] + job.duration;
        let delay = finishingTime - job.deadline
        delay = delay < 0 ? 0 : delay;

        finishingTimes.push(finishingTime);
        jobsWithFinishingTimeAndDelay.push({
            "job": job,
            "finishingTime": finishingTime,
            "delay": delay
        });
    }
    return jobsWithFinishingTimeAndDelay;
}



function scheduleSingleMachineEDD(jobs) {
    /*
    Single Machine EDD Scheduling Algorithm
    optimization for 
        1. least delay
        2. earliest finish of all jobs

    Sources:
        https://www.youtube.com/watch?v=rp-Yi49bUVs
        https://youtu.be/c3nJkznb8zg


    Input:
    - array of jobs
        [
            {
                "jobId": 0,
                "duration": 4,
                "deadline": 6
            },
            {
                "jobId": 1,
                "duration": 2,
                "deadline": 21
            }, ...
        ]

    Output:
    - array of jobs with finishing time and delay (scheduled)
        [
            {
                "job": {
                    "jobId": 0,
                    "duration": 4,
                    "deadline": 6
                },
                "finishingTime": 5,
                "delay": 0
            },
            {
                "job": {
                    "jobId": 1,
                    "duration": 4,
                    "deadline": 6
                },
                "finishingTime": 34,
                "delay": 13
            }, ...
        ]
    */
    
    // EDD (sort for earlies due date)
    jobs.sort((a, b) => {
        return a.deadline - b.deadline;
    });

    let scheduledjobsWithFinishAndDelay = calculateFinishingTimeAndDelay(jobs); // our main list
    discardedJobs = [];
    let thereAreDelays = jobsWithFinishingTimeAndDelay => jobsWithFinishingTimeAndDelay.filter(job => job.delay > 0).length > 0;
    let getJobsTillFirstDelayedJob = jobsWithFinishingTimeAndDelay => {
        let jobsTillFirstDelayedJob = [];
        for (let i = 0; i < jobsWithFinishingTimeAndDelay.length; i++) {
            let jobWithFinishingTimeAndDelay = jobsWithFinishingTimeAndDelay[i];
            jobsTillFirstDelayedJob.push(jobWithFinishingTimeAndDelay.job);
            if (jobWithFinishingTimeAndDelay.delay > 0) {
                break;
            }
        }
        return jobsTillFirstDelayedJob;
    }
    let getJobWithLongestDuration = jobs => jobs.reduce((current_max, new_obj) => new_obj.duration > current_max.duration ? new_obj : current_max)

    while (thereAreDelays(scheduledjobsWithFinishAndDelay) && scheduledjobsWithFinishAndDelay.length > 0) {
        let jobsTillDelayed = getJobsTillFirstDelayedJob(scheduledjobsWithFinishAndDelay);
        let jobLongestDuration = getJobWithLongestDuration(jobsTillDelayed);

        // will be added to main list later
        discardedJobs.push(jobLongestDuration);

        // remove from our main list
        let scheduledJobs = scheduledjobsWithFinishAndDelay.map(scheduledJob => scheduledJob.job)
        scheduledJobs.splice(scheduledJobs.indexOf(jobLongestDuration), 1);
        scheduledjobsWithFinishAndDelay = calculateFinishingTimeAndDelay(scheduledJobs);
    }

    let scheduledJobs = scheduledjobsWithFinishAndDelay.map(scheduledJob => scheduledJob.job);
    scheduledJobs = scheduledJobs.concat(discardedJobs);
    return calculateFinishingTimeAndDelay(scheduledJobs);
}


// Main -------------------------------------------------------------
let jobs = loadJobs('data/exampleJobs.json')

let scheduledjobsWithFinishAndDelay = scheduleSingleMachineEDD(jobs);
console.log("Scheduled Jobs: ");
console.log(scheduledjobsWithFinishAndDelay);

console.log("Total Delay: ", scheduledjobsWithFinishAndDelay.reduce((total, jobWithFinishAndDelay) => total + jobWithFinishAndDelay.delay, 0));
