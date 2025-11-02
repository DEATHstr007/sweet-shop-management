const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Sweet = require('../models/Sweet');

describe('Sweets API Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sweetshop_test');
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Sweet.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Sweet.deleteMany({});

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = response.body.token;
    userId = response.body.user.id;
  });

  describe('POST /api/sweets', () => {
    it('should create a new sweet with valid token', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Chocolate Bar',
          description: 'Delicious milk chocolate',
          price: 2.5,
          quantity: 100,
          category: 'chocolate'
        });

      expect(response.status).toBe(201);
      expect(response.body.sweet).toHaveProperty('name', 'Chocolate Bar');
      expect(response.body.sweet).toHaveProperty('price', 2.5);
    });

    it('should not create sweet without token', async () => {
      const response = await request(app)
        .post('/api/sweets')
        .send({
          name: 'Chocolate Bar',
          description: 'Delicious milk chocolate',
          price: 2.5,
          quantity: 100,
          category: 'chocolate'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/sweets', () => {
    it('should get all sweets', async () => {
      await Sweet.create({
        name: 'Gummy Bears',
        description: 'Fruity gummy bears',
        price: 1.5,
        quantity: 50,
        category: 'gummy',
        createdBy: userId
      });

      const response = await request(app).get('/api/sweets');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('name', 'Gummy Bears');
    });
  });

  describe('POST /api/sweets/:id/purchase', () => {
    it('should purchase sweet with sufficient stock', async () => {
      const sweet = await Sweet.create({
        name: 'Lollipop',
        description: 'Strawberry lollipop',
        price: 1.0,
        quantity: 20,
        category: 'lollipop',
        createdBy: userId
      });

      const response = await request(app)
        .post(`/api/sweets/${sweet._id}/purchase`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 });

      expect(response.status).toBe(200);
      expect(response.body.sweet.quantity).toBe(15);
      expect(response.body.totalCost).toBe(5.0);
    });

    it('should not purchase with insufficient stock', async () => {
      const sweet = await Sweet.create({
        name: 'Candy',
        description: 'Hard candy',
        price: 0.5,
        quantity: 3,
        category: 'candy',
        createdBy: userId
      });

      const response = await request(app)
        .post(`/api/sweets/${sweet._id}/purchase`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 10 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Insufficient stock');
    });
  });
});
