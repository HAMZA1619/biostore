"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { slugify } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

interface Collection {
  id: string
  name: string
  slug: string
  sort_order: number
  products: { count: number }[] | null
}

export function CollectionsManager({
  storeId,
  initialCollections,
}: {
  storeId: string
  initialCollections: Collection[]
}) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function addCollection() {
    if (!name.trim()) return
    setLoading(true)

    const { error } = await supabase.from("collections").insert({
      store_id: storeId,
      name: name.trim(),
      slug: slugify(name),
      sort_order: initialCollections.length,
    })

    if (error) {
      if (error.code === "23505") {
        toast.error("Collection with this name already exists")
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    toast.success("Collection added")
    setName("")
    setLoading(false)
    router.refresh()
  }

  async function deleteCollection(id: string) {
    if (!confirm("Delete this collection? Products in it will become uncategorized.")) return

    const { error } = await supabase.from("collections").delete().eq("id", id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Collection deleted")
    router.refresh()
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex gap-3">
        <Input
          placeholder="Collection name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCollection()}
        />
        <Button onClick={addCollection} disabled={loading || !name.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      {initialCollections.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialCollections.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  {c.products?.[0] && "count" in c.products[0]
                    ? c.products[0].count
                    : 0}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteCollection(c.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">
          No collections yet. Collections help organize your products.
        </p>
      )}
    </div>
  )
}
