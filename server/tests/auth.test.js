const request = require("supertest");
const app = require("../app");
const { connectDB, closeDB, clearDB } = require("./setup");

beforeAll(async () => {
  await connectDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});

describe("Authentication & User API Integration Tests", () => {
  const validUser = {
    name: "Dr. Swathi Admin",
    email: "admin@docspot.local",
    phoneNumber: "9876543210",
    password: "Password123!",
  };

  describe("POST /api/v1/users/signup", () => {
    it("should register the first user as an Admin with status 201 and JWT token", async () => {
      const res = await request(app)
        .post("/api/v1/users/signup")
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe("admin@docspot.local");
      expect(res.body.data.user.isAdmin).toBe(true);
      expect(res.body.data.user.password).toBeUndefined(); // password stripped
    });

    it("should register subsequent users with isAdmin: false", async () => {
      // 1) First user -> Admin
      await request(app).post("/api/v1/users/signup").send(validUser);

      // 2) Second user -> Patient
      const secondUser = {
        name: "John Patient",
        email: "john@docspot.local",
        phoneNumber: "9876543211",
        password: "PatientPass123!",
      };
      const res = await request(app)
        .post("/api/v1/users/signup")
        .send(secondUser);

      expect(res.status).toBe(201);
      expect(res.body.data.user.isAdmin).toBe(false);
      expect(res.body.data.user.email).toBe("john@docspot.local");
    });

    it("should fail validation if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/v1/users/signup")
        .send({ email: "incomplete@test.local" });

      expect(res.status).toBe(500); // Mongoose validation error handled by error controller
      expect(res.body.status).toBe("error");
    });

    it("should fail validation if password is shorter than 8 characters", async () => {
      const invalidPassUser = {
        name: "Short Pass",
        email: "short@test.local",
        phoneNumber: "9876543212",
        password: "short",
      };

      const res = await request(app)
        .post("/api/v1/users/signup")
        .send(invalidPassUser);

      expect(res.status).toBe(500);
      expect(res.body.status).toBe("error");
    });
  });

  describe("POST /api/v1/users/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/users/signup").send(validUser);
    });

    it("should successfully log in with correct credentials and return a token", async () => {
      const res = await request(app).post("/api/v1/users/login").send({
        email: "admin@docspot.local",
        password: "Password123!",
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe("admin@docspot.local");
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("should fail login with incorrect password with 401 Unauthorized", async () => {
      const res = await request(app).post("/api/v1/users/login").send({
        email: "admin@docspot.local",
        password: "WrongPassword999!",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Incorrect email or password/i);
    });

    it("should fail login with non-existent email with 401", async () => {
      const res = await request(app).post("/api/v1/users/login").send({
        email: "nonexistent@docspot.local",
        password: "SomePassword123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Incorrect email or password/i);
    });

    it("should return 400 when email or password is missing", async () => {
      const res = await request(app)
        .post("/api/v1/users/login")
        .send({ email: "admin@docspot.local" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Please provide email and password/i);
    });
  });

  describe("Protected Route Middleware (authController.protect)", () => {
    it("should reject requests without authorization header with 401", async () => {
      const res = await request(app).get("/api/v1/users/verify-user/12345");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/You are not logged in/i);
    });

    it("should reject requests with invalid Bearer token with 500/401", async () => {
      const res = await request(app)
        .get("/api/v1/users/verify-user/12345")
        .set("Authorization", "Bearer invalid-garbage-token");

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should allow verified user with valid Bearer token", async () => {
      const signupRes = await request(app)
        .post("/api/v1/users/signup")
        .send(validUser);
      const token = signupRes.body.token;
      const userId = signupRes.body.data.user._id;

      const res = await request(app)
        .get(`/api/v1/users/verify-user/${userId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.email).toBe("admin@docspot.local");
    });
  });
});
