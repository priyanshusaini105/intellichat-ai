import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';

// Mock PrismaClient before importing database module
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $connect: jest.fn<any>(),
    $disconnect: jest.fn<any>(),
    $queryRaw: jest.fn<any>(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('Database Configuration', () => {
  let prisma: any;
  let connectDatabase: any;
  let disconnectDatabase: any;

  beforeEach(async () => {
    // Clear module cache to get fresh imports
    jest.resetModules();
    
    // Re-import after mocking
    const dbModule = await import('../database.js');
    prisma = dbModule.prisma;
    connectDatabase = dbModule.connectDatabase;
    disconnectDatabase = dbModule.disconnectDatabase;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up
    const dbModule = await import('../database.js');
    await dbModule.disconnectDatabase();
  });

  describe('Prisma Client', () => {
    it('should create Prisma client instance', () => {
      expect(prisma).toBeDefined();
      expect(prisma.$connect).toBeDefined();
      expect(prisma.$disconnect).toBeDefined();
    });
  });

  describe('connectDatabase', () => {
    it('should connect to database successfully', async () => {
      prisma.$connect.mockResolvedValue(undefined);

      await expect(connectDatabase()).resolves.not.toThrow();
      expect(prisma.$connect).toHaveBeenCalledTimes(1);
    });

    it('should throw error if connection fails', async () => {
      const dbError = new Error('Connection failed');
      prisma.$connect.mockRejectedValue(dbError);

      await expect(connectDatabase()).rejects.toThrow('Connection failed');
      expect(prisma.$connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnectDatabase', () => {
    it('should disconnect gracefully', async () => {
      prisma.$disconnect.mockResolvedValue(undefined);

      await expect(disconnectDatabase()).resolves.not.toThrow();
      expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnection errors gracefully', async () => {
      const dbError = new Error('Disconnection failed');
      prisma.$disconnect.mockRejectedValue(dbError);

      // Should not throw - logs error instead
      await expect(disconnectDatabase()).resolves.not.toThrow();
      expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
