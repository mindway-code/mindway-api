import { prisma } from "../prisma/client.js";

export type RefreshTokenRecord = {
	id: string;
	userId: string;
	tokenHash: string;
	expiresAt: Date;
	revokedAt?: Date | null;
	createdAt?: Date;
	updatedAt?: Date;
};

export async function createRefreshToken(input: {
	userId: string;
	tokenHash: string;
	expiresAt: Date;
}) {
	return prisma.refreshToken.create({ data: input }) as Promise<RefreshTokenRecord>;
}

export async function findActiveByUserId(userId: string) {
	return prisma.refreshToken.findMany({
		where: {
			userId,
			revokedAt: null,
			expiresAt: { gt: new Date() },
		},
		orderBy: { createdAt: 'desc' },
	}) as Promise<RefreshTokenRecord[]>;
}

export async function findById(id: string) {
	return prisma.refreshToken.findUnique({ where: { id } }) as Promise<RefreshTokenRecord | null>;
}

export async function revokeById(id: string) {
	return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } }) as Promise<RefreshTokenRecord>;
}

export async function revokeAllByUser(userId: string) {
	return prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function deleteExpired() {
	return prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

export default {
	createRefreshToken,
	findActiveByUserId,
	findById,
	revokeById,
	revokeAllByUser,
	deleteExpired,
};
