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

describe("Doctor & Appointment Workflow Integration Tests", () => {
  let adminToken, adminId;
  let doctorToken, doctorUserId, doctorDocId;
  let patientToken, patientId;

  beforeEach(async () => {
    // 1) First signup is Admin
    const adminRes = await request(app).post("/api/v1/users/signup").send({
      name: "Admin User",
      email: "admin@docspot.local",
      phoneNumber: "9876543201",
      password: "AdminPassword123!",
    });
    adminToken = adminRes.body.token;
    adminId = adminRes.body.data.user._id;

    // 2) Second signup is Doctor's user account
    const doctorUserRes = await request(app).post("/api/v1/users/signup").send({
      name: "Dr. Gregory House",
      email: "drhouse@docspot.local",
      phoneNumber: "9876543202",
      password: "DoctorPassword123!",
    });
    doctorToken = doctorUserRes.body.token;
    doctorUserId = doctorUserRes.body.data.user._id;

    // 3) Third signup is Patient
    const patientRes = await request(app).post("/api/v1/users/signup").send({
      name: "Jane Doe Patient",
      email: "jane@docspot.local",
      phoneNumber: "9876543203",
      password: "PatientPassword123!",
    });
    patientToken = patientRes.body.token;
    patientId = patientRes.body.data.user._id;
  });

  describe("Doctor Onboarding & Approval Flow", () => {
    it("should allow a logged-in user to apply for a doctor profile with pending status", async () => {
      const doctorData = {
        userId: doctorUserId,
        prefix: "Dr.",
        fullName: "Gregory House",
        email: "drhouse@docspot.local",
        phoneNumber: "9876543202",
        website: "https://housemd.local",
        address: "Princeton-Plainsboro Teaching Hospital",
        specialization: "Diagnostic Medicine",
        experience: "15 years",
        feePerConsultation: 250,
        fromTime: "2026-10-27T09:00:00.000Z",
        toTime: "2026-10-27T17:00:00.000Z",
      };

      const res = await request(app)
        .post("/api/v1/doctors/signup")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send(doctorData);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toMatch(/applied successfully/i);

      // Verify Admin received unseen notification
      const adminCheck = await request(app)
        .get(`/api/v1/users/${adminId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(adminCheck.body.data.unseenNotifications.length).toBeGreaterThan(0);
      expect(adminCheck.body.data.unseenNotifications[0].message).toMatch(/Gregory House has requested to join/i);
    });

    it("should allow admin to approve a doctor and update user.isDoctor to true", async () => {
      // 1) Apply doctor
      await request(app)
        .post("/api/v1/doctors/signup")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          userId: doctorUserId,
          prefix: "Dr.",
          fullName: "Gregory House",
          email: "drhouse@docspot.local",
          phoneNumber: "9876543202",
          address: "Hospital Suite 101",
          specialization: "Diagnostic Medicine",
          experience: "15 years",
          feePerConsultation: 250,
          fromTime: "2026-10-27T09:00:00.000Z",
          toTime: "2026-10-27T17:00:00.000Z",
        });

      // 2) Get doctor profile to get doctor._id
      const doctorProfile = await request(app)
        .get(`/api/v1/doctors/${doctorUserId}`)
        .set("Authorization", `Bearer ${doctorToken}`);
      doctorDocId = doctorProfile.body.data._id;

      // 3) Admin approves doctor
      const approveRes = await request(app)
        .post("/api/v1/users/change-doctor-status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          doctorId: doctorDocId,
          userId: doctorUserId,
          status: "approved",
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.status).toBe(true);

      // 4) Verify user now has isDoctor: true
      const userCheck = await request(app)
        .get(`/api/v1/users/${doctorUserId}`)
        .set("Authorization", `Bearer ${doctorToken}`);
      expect(userCheck.body.data.isDoctor).toBe(true);

      // 5) Verify doctor appears in approved doctors list
      const approvedList = await request(app).get("/api/v1/doctors/approved-doctors");
      expect(approvedList.status).toBe(200);
      expect(approvedList.body.data.length).toBe(1);
      expect(approvedList.body.data[0].fullName).toBe("Gregory House");
    });
  });

  describe("Appointment Availability & Booking Lifecycle", () => {
    beforeEach(async () => {
      // Apply and approve doctor before each appointment test
      await request(app)
        .post("/api/v1/doctors/signup")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          userId: doctorUserId,
          prefix: "Dr.",
          fullName: "Gregory House",
          email: "drhouse@docspot.local",
          phoneNumber: "9876543202",
          address: "Hospital Suite 101",
          specialization: "Diagnostic Medicine",
          experience: "15 years",
          feePerConsultation: 250,
          fromTime: "2026-10-27T09:00:00.000Z",
          toTime: "2026-10-27T17:00:00.000Z",
        });

      const doctorProfile = await request(app)
        .get(`/api/v1/doctors/${doctorUserId}`)
        .set("Authorization", `Bearer ${doctorToken}`);
      doctorDocId = doctorProfile.body.data._id;

      await request(app)
        .post("/api/v1/users/change-doctor-status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          doctorId: doctorDocId,
          userId: doctorUserId,
          status: "approved",
        });
    });

    it("should confirm slot availability within doctor working hours", async () => {
      const res = await request(app)
        .post("/api/v1/doctors/check-booking-availability")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          doctorId: doctorUserId,
          date: "2026-10-27T00:00:00.000Z",
          time: "2026-10-27T11:00:00.000Z",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toMatch(/Appointment available/i);
    });

    it("should reject availability check outside working hours with 400", async () => {
      const res = await request(app)
        .post("/api/v1/doctors/check-booking-availability")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          doctorId: doctorUserId,
          date: "2026-10-27T00:00:00.000Z",
          time: "2026-10-27T22:00:00.000Z", // 10 PM is outside 9 AM - 5 PM
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/within the doctor's working hours/i);
    });

    it("should successfully book an appointment and notify doctor", async () => {
      const appointmentPayload = {
        userId: patientId,
        doctorId: doctorUserId,
        userInfo: { name: "Jane Doe Patient", email: "jane@docspot.local" },
        doctorInfo: { name: "Dr. Gregory House", userId: doctorUserId },
        date: "2026-10-27T00:00:00.000Z",
        time: "2026-10-27T11:00:00.000Z",
      };

      const res = await request(app)
        .post("/api/v1/users/book-appointment")
        .set("Authorization", `Bearer ${patientToken}`)
        .send(appointmentPayload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toMatch(/booked successfully/i);

      // Verify doctor received notification
      const doctorUser = await request(app)
        .get(`/api/v1/users/${doctorUserId}`)
        .set("Authorization", `Bearer ${doctorToken}`);
      const hasPatientNotification = doctorUser.body.data.unseenNotifications.some(
        (n) => /Jane Doe Patient/i.test(n.message)
      );
      expect(hasPatientNotification).toBe(true);
    });

    it("should prevent duplicate booking for the same slot with 400", async () => {
      const appointmentPayload = {
        userId: patientId,
        doctorId: doctorUserId,
        userInfo: { name: "Jane Doe Patient", email: "jane@docspot.local" },
        doctorInfo: { name: "Dr. Gregory House", userId: doctorUserId },
        date: "2026-10-27T00:00:00.000Z",
        time: "2026-10-27T11:00:00.000Z",
      };

      // 1) First booking succeeds
      const firstBooking = await request(app)
        .post("/api/v1/users/book-appointment")
        .set("Authorization", `Bearer ${patientToken}`)
        .send(appointmentPayload);
      expect(firstBooking.status).toBe(200);

      // 2) Second booking for identical slot must be rejected
      const duplicateBooking = await request(app)
        .post("/api/v1/users/book-appointment")
        .set("Authorization", `Bearer ${patientToken}`)
        .send(appointmentPayload);

      expect(duplicateBooking.status).toBe(400);
      expect(duplicateBooking.body.message).toMatch(/already booked/i);
    });

    it("should allow re-booking the same slot if the previous appointment was rejected", async () => {
      const slotPayload = {
        userId: patientId,
        doctorId: doctorUserId,
        userInfo: { name: "Jane Doe Patient", email: "jane@docspot.local" },
        doctorInfo: { name: "Dr. Gregory House", userId: doctorUserId },
        date: "2026-10-27T00:00:00.000Z",
        time: "2026-10-27T15:00:00.000Z",
      };

      // 1) First booking succeeds
      const firstBooking = await request(app)
        .post("/api/v1/users/book-appointment")
        .set("Authorization", `Bearer ${patientToken}`)
        .send(slotPayload);
      expect(firstBooking.status).toBe(200);

      // 2) Get appointment ID and Doctor rejects it
      const userAppointments = await request(app)
        .get(`/api/v1/users/user-appointments/${patientId}`)
        .set("Authorization", `Bearer ${patientToken}`);
      const bookedAppt = userAppointments.body.data[0];
      expect(bookedAppt).toBeDefined();

      const rejectRes = await request(app)
        .post("/api/v1/doctors/change-appointment-status")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          appointmentId: bookedAppt._id,
          status: "rejected",
        });
      expect(rejectRes.status).toBe(200);

      // 3) Re-check availability -> must be available again
      const availCheck = await request(app)
        .post("/api/v1/doctors/check-booking-availability")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          doctorId: doctorUserId,
          date: slotPayload.date,
          time: slotPayload.time,
        });
      expect(availCheck.status).toBe(200);
      expect(availCheck.body.message).toMatch(/Appointment available/i);

      // 4) Re-booking the released slot must now succeed!
      const rebooking = await request(app)
        .post("/api/v1/users/book-appointment")
        .set("Authorization", `Bearer ${patientToken}`)
        .send(slotPayload);
      expect(rebooking.status).toBe(200);
      expect(rebooking.body.message).toMatch(/booked successfully/i);
    });

    it("should allow doctor to change appointment status and update user notification", async () => {
      // 1) Book appointment
      await request(app)
        .post("/api/v1/users/book-appointment")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          userId: patientId,
          doctorId: doctorUserId,
          userInfo: { name: "Jane Doe Patient", email: "jane@docspot.local" },
          doctorInfo: { name: "Dr. Gregory House", userId: doctorUserId },
          date: "2026-10-27T00:00:00.000Z",
          time: "2026-10-27T14:00:00.000Z",
        });

      // 2) Get patient appointments to find appointment ID
      const userAppointments = await request(app)
        .get(`/api/v1/users/user-appointments/${patientId}`)
        .set("Authorization", `Bearer ${patientToken}`);
      expect(userAppointments.body.data.length).toBe(1);
      const appointmentId = userAppointments.body.data[0]._id;

      // 3) Doctor approves the appointment
      const changeRes = await request(app)
        .post("/api/v1/doctors/change-appointment-status")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          appointmentId,
          status: "approved",
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.status).toBe(true);

      // 4) Verify patient received status notification
      const patientCheck = await request(app)
        .get(`/api/v1/users/${patientId}`)
        .set("Authorization", `Bearer ${patientToken}`);
      expect(patientCheck.body.data.unseenNotifications.length).toBeGreaterThan(0);
      expect(patientCheck.body.data.unseenNotifications[0].message).toMatch(/approved/i);
    });
  });

  describe("Notification Management Endpoints", () => {
    beforeEach(async () => {
      // Trigger a notification to admin
      await request(app)
        .post("/api/v1/doctors/signup")
        .set("Authorization", `Bearer ${doctorToken}`)
        .send({
          userId: doctorUserId,
          prefix: "Dr.",
          fullName: "Gregory House",
          email: "drhouse@docspot.local",
          phoneNumber: "9876543202",
          address: "Hospital Suite 101",
          specialization: "Diagnostic Medicine",
          experience: "15 years",
          feePerConsultation: 250,
          fromTime: "2026-10-27T09:00:00.000Z",
          toTime: "2026-10-27T17:00:00.000Z",
        });
    });

    it("should mark unseen notifications as seen", async () => {
      const res = await request(app)
        .post("/api/v1/users/mark-all-notification-as-seen")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unseenNotifications.length).toBe(0);
      expect(res.body.data.seenNotifications.length).toBeGreaterThan(0);
    });

    it("should clear both seen and unseen notifications", async () => {
      const res = await request(app)
        .post("/api/v1/users/delete-all-notifications")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unseenNotifications.length).toBe(0);
      expect(res.body.data.seenNotifications.length).toBe(0);
    });
  });
});
