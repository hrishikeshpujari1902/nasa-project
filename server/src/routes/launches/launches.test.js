const request = require('supertest');
const app = require('../../app');
const { mongoConnect, mongoDisconnect } = require('../../services/mongo');


describe('Launches Api', () => {
    beforeAll(async () => {
        await mongoConnect();

    });
    afterAll(async () => {
        await mongoDisconnect();
    })
    describe('Test GET /launches', () => {
        test('It should respond with 200 success', async () => {
            const response = await request(app).get('/v1/launches').expect('Content-Type', /json/).expect(200);


        });
    });

    describe('Test POST /launch', () => {
        const completeLaunchData = {
            mission: 'USS Enterprieses',
            rocket: 'NCC 1701-D',
            target: 'Kepler-62 f',
            launchDate: 'January 4,2028',
        };
        const withoutLaunchDate = {
            mission: 'USS Enterprieses',
            rocket: 'NCC 1701-D',
            target: 'Kepler-62 f',
        }
        test('It should respond with 201 sucess', async () => {


            const response = await request(app).post('/v1/launches').send(completeLaunchData).expect('Content-Type', /json/).expect(201);
            expect(response.body).toMatchObject(withoutLaunchDate);
            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            const reponseDate = new Date(response.body.launchDate).valueOf();
            expect(reponseDate).toBe(requestDate);


        });
        test('It should catch missing required properties', async () => {



            const response = await request(app).post('/v1/launches').send(withoutLaunchDate).expect('Content-Type', /json/).expect(400);
            expect(response.body).toStrictEqual({ error: 'Missing required Launch Property', });



        });
        test('It should catch invalid dates', async () => {
            const response = await request(app).post('/v1/launches').send({

                mission: 'USS Enterprieses',
                rocket: 'NCC 1701-D',
                target: 'Kepler-186 f',
                launchDate: 'Jay 4,2028',
            }).expect('Content-Type', /json/).expect(400);
            expect(response.body).toStrictEqual({ error: "Invalid launch date.", });


        });
    });

});



