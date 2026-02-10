"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MessageCircle, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

interface Faq {
  id: string
  question: string
  answer: string
  sort_order: number
}

export function FaqManager({
  storeId,
  initialFaqs,
}: {
  storeId: string
  initialFaqs: Faq[]
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation()

  function openCreate() {
    setEditingFaq(null)
    setQuestion("")
    setAnswer("")
    setDialogOpen(true)
  }

  function openEdit(faq: Faq) {
    setEditingFaq(faq)
    setQuestion(faq.question)
    setAnswer(faq.answer)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!question.trim() || !answer.trim()) {
      toast.error(!question.trim() ? t("validation.faqQuestionRequired") : t("validation.faqAnswerRequired"))
      return
    }

    setLoading(true)

    if (editingFaq) {
      const { error } = await supabase
        .from("store_faqs")
        .update({
          question: question.trim(),
          answer: answer.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingFaq.id)

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      toast.success(t("faqs.faqUpdated"))
    } else {
      const { error } = await supabase.from("store_faqs").insert({
        store_id: storeId,
        question: question.trim(),
        answer: answer.trim(),
        sort_order: initialFaqs.length,
      })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      toast.success(t("faqs.faqCreated"))
    }

    setLoading(false)
    setDialogOpen(false)
    router.refresh()
  }

  async function deleteFaq() {
    if (!deleteId) return
    const { error } = await supabase
      .from("store_faqs")
      .delete()
      .eq("id", deleteId)

    if (error) {
      toast.error(error.message)
      setDeleteId(null)
      return
    }

    toast.success(t("faqs.faqDeleted"))
    setDeleteId(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("faqs.title")}</h1>
        <Button onClick={openCreate}>
          <Plus className="me-2 h-4 w-4" />
          {t("faqs.addFaq")}
        </Button>
      </div>

      {initialFaqs.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("faqs.columns.question")}</TableHead>
                <TableHead>{t("faqs.columns.answer")}</TableHead>
                <TableHead className="w-[100px] text-end">
                  {t("faqs.columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialFaqs.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="font-medium">{faq.question}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {faq.answer}
                  </TableCell>
                  <TableCell className="text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(faq)}>
                          <Pencil className="me-2 h-4 w-4" />
                          {t("faqs.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(faq.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t("faqs.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t("faqs.empty")}</p>
          <p className="text-sm text-muted-foreground">{t("faqs.emptyHint")}</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFaq ? t("faqs.editFaq") : t("faqs.addFaq")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("faqs.questionLabel")}</Label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("faqs.questionPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("faqs.answerLabel")}</Label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={t("faqs.answerPlaceholder")}
                rows={4}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={loading || !question.trim() || !answer.trim()}
              className="w-full"
            >
              {loading
                ? t("faqs.saving")
                : editingFaq
                  ? t("faqs.updateFaq")
                  : t("faqs.addFaq")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("faqs.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("faqs.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("faqs.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteFaq}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("faqs.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
