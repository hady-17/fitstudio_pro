/// <reference types="jest" />

import request from 'supertest';
import app from '../src/app.js';

// app.ts transitively imports lib/supabase.ts, which constructs a real
// @supabase/supabase-js client. On Node 20 (CI), that throws at import time
// because @supabase/realtime-js requires a native WebSocket (Node 22+).
// None of the requests below carry an Authorization header, so
// auth.middleware.ts short-circuits with a 401 before supabaseAdmin is ever
// called — a minimal mock avoids constructing the real client entirely.
jest.mock('../src/lib/supabase.js', () => ({
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

const validStudioId = '00000000-0000-0000-0000-000000000001';
const validMemberId = '00000000-0000-0000-0000-000000000002';
const validClientId = '00000000-0000-0000-0000-000000000003';

describe('Backend foundation', () => {
  describe('Health and fallback routes', () => {
    it('GET /api/health returns 200', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });

    it('GET /api/unknown returns 404', async () => {
      const response = await request(app).get('/api/unknown');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Route not found');
    });
  });

  describe('Auth route protection', () => {
    it('GET /api/auth/me without token returns 401', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(
        'Missing or invalid authorization header',
      );
    });
  });

  describe('Studio route protection', () => {
    it('POST /api/studios without token returns 401', async () => {
      const response = await request(app)
        .post('/api/studios')
        .send({
          name: 'Test Studio',
          slug: 'test-studio',
          description: 'Test studio description',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('GET /api/studios/me without token returns 401', async () => {
      const response = await request(app).get('/api/studios/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('GET /api/studios/:studioId without token returns 401', async () => {
      const response = await request(app).get(`/api/studios/${validStudioId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('PATCH /api/studios/:studioId without token returns 401', async () => {
      const response = await request(app)
        .patch(`/api/studios/${validStudioId}`)
        .send({
          name: 'Updated Studio',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('DELETE /api/studios/:studioId without token returns 401', async () => {
      const response = await request(app).delete(
        `/api/studios/${validStudioId}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('GET /api/studios/:studioId/members without token returns 401', async () => {
      const response = await request(app).get(
        `/api/studios/${validStudioId}/members`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('POST /api/studios/:studioId/trainers without token returns 401', async () => {
      const response = await request(app)
        .post(`/api/studios/${validStudioId}/trainers`)
        .send({
          email: 'trainer@example.com',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('DELETE /api/studios/:studioId/members/:memberId without token returns 401', async () => {
      const response = await request(app).delete(
        `/api/studios/${validStudioId}/members/${validMemberId}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  describe('Client route protection', () => {
  it('POST /api/studios/:studioId/clients without token returns 401', async () => {
    const response = await request(app)
      .post(`/api/studios/${validStudioId}/clients`)
      .send({
        fullName: 'Ali Ahmad',
        email: 'ali@example.com',
        goal: 'Build muscle',
        notes: 'Beginner client',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe(
      'Missing or invalid authorization header',
    );
  });

  it('GET /api/studios/:studioId/clients without token returns 401', async () => {
    const response = await request(app).get(
      `/api/studios/${validStudioId}/clients`,
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe(
      'Missing or invalid authorization header',
    );
  });

  it('GET /api/studios/:studioId/clients/:clientId without token returns 401', async () => {
    const response = await request(app).get(
      `/api/studios/${validStudioId}/clients/${validClientId}`,
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe(
      'Missing or invalid authorization header',
    );
  });

  it('PATCH /api/studios/:studioId/clients/:clientId without token returns 401', async () => {
    const response = await request(app)
      .patch(`/api/studios/${validStudioId}/clients/${validClientId}`)
      .send({
        fullName: 'Ali Ahmad Updated',
        status: 'active',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe(
      'Missing or invalid authorization header',
    );
  });

  it('DELETE /api/studios/:studioId/clients/:clientId without token returns 401', async () => {
    const response = await request(app).delete(
      `/api/studios/${validStudioId}/clients/${validClientId}`,
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe(
      'Missing or invalid authorization header',
    );
  });
});
});