import { z } from "zod"

export const faqSchema = z.object({
  question: z.string().min(1, "validation.faqQuestionRequired"),
  answer: z.string().min(1, "validation.faqAnswerRequired"),
})

export type FaqFormData = z.infer<typeof faqSchema>
