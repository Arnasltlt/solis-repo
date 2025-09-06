import { getContentItems } from '@/lib/services/content'

function createMockClient() {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis()
  }
  return {
    from: jest.fn().mockReturnValue(query)
  } as any
}

describe('getContentItems', () => {
  it('filters out unpublished content by default', async () => {
    const client = createMockClient()
    await getContentItems({ client })
    const query = (client.from as jest.Mock).mock.results[0].value
    expect(query.eq).toHaveBeenCalledWith('published', true)
  })

  it('includes unpublished content when includeUnpublished is true', async () => {
    const client = createMockClient()
    await getContentItems({ client, includeUnpublished: true })
    const query = (client.from as jest.Mock).mock.results[0].value
    expect(query.eq).not.toHaveBeenCalledWith('published', true)
  })
})
