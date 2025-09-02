import { createContent } from '@/lib/services/content'

// Helper to create a mock Supabase client
function createMockSupabase() {
  let insertedPayload: any = null

  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
      }),
    },
    from: jest.fn((table: string) => {
      if (table === 'content_items') {
        return {
          insert: (payload: any) => {
            insertedPayload = payload
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: 'content-1', ...payload },
                    error: null,
                  }),
              }),
            }
          },
        }
      }

      // For relational tables we simply resolve successfully
      return {
        insert: () => Promise.resolve({ error: null }),
      }
    }),
    // Expose payload for assertions
    _getInsertedPayload: () => insertedPayload,
  }
}

describe('createContent', () => {
  it('creates a content item and returns it', async () => {
    const supabase = createMockSupabase()

    const data = {
      title: 'Test content',
      description: 'A test description',
      type: 'video',
      ageGroups: ['age-1'],
      categories: ['cat-1'],
      accessTierId: 'tier-1',
      thumbnail: null,
      contentBody: 'Hello world',
      published: true,
      metadata: {},
    }

    const result = await createContent(data as any, supabase as any)

    expect(result).toMatchObject({ id: 'content-1', title: data.title, type: data.type })
    expect(supabase.auth.getSession).toHaveBeenCalled()
    expect(supabase.from).toHaveBeenCalledWith('content_items')
  })
})
