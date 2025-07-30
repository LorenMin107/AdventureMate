// Mock for mongodb module
module.exports = {
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({}),
    close: jest.fn().mockResolvedValue({}),
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      }),
    }),
  })),
  ObjectId: jest.fn().mockImplementation((id) => ({
    toString: () => id || '507f1f77bcf86cd799439011',
    toHexString: () => id || '507f1f77bcf86cd799439011',
  })),
};
