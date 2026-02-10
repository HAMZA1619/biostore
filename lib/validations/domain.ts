import { z } from "zod"

export const domainSchema = z.object({
  domain: z
    .string()
    .min(3, "domain.invalidDomain")
    .max(253, "domain.invalidDomain")
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
      "domain.invalidDomain"
    )
    .transform((d) => d.toLowerCase()),
})

export type DomainFormData = z.infer<typeof domainSchema>
