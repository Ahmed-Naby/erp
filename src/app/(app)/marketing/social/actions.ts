"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { socialPostSchema, socialStatuses } from "@/lib/validations/marketing"

function toData(data: ReturnType<typeof socialPostSchema.parse>) {
  return {
    content: data.content,
    platform: data.platform,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
  }
}

export async function createSocialPost(input: unknown) {
  const data = socialPostSchema.parse(input)
  await prisma.socialPost.create({ data: toData(data) })
  revalidatePath("/marketing/social")
}

export async function updateSocialPost(id: string, input: unknown) {
  const data = socialPostSchema.parse(input)
  await prisma.socialPost.update({ where: { id }, data: toData(data) })
  revalidatePath("/marketing/social")
}

export async function deleteSocialPost(id: string) {
  await prisma.socialPost.delete({ where: { id } })
  revalidatePath("/marketing/social")
}

export async function setSocialPostStatus(id: string, status: string) {
  if (!(socialStatuses as readonly string[]).includes(status)) {
    throw new Error("Invalid status")
  }

  if (status === "SCHEDULED") {
    const post = await prisma.socialPost.findUniqueOrThrow({ where: { id } })
    if (!post.scheduledAt) {
      throw new Error("Set a scheduled date before scheduling this post")
    }
    await prisma.socialPost.update({ where: { id }, data: { status } })
  } else if (status === "PUBLISHED") {
    await prisma.socialPost.update({
      where: { id },
      data: { status, publishedAt: new Date() },
    })
  } else {
    await prisma.socialPost.update({ where: { id }, data: { status } })
  }
  revalidatePath("/marketing/social")
}
