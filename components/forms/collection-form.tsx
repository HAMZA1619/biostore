"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
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
import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { slugify } from "@/lib/utils"
import { Check, ChevronsUpDown, FolderOpen, Loader2, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react"

const PAGE_SIZE = 20

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [name, setName] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<Map<string, string>>(new Map())
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  // Dropdown product fetching
  const [dropdownProducts, setDropdownProducts] = useState<{ id: string; name: string }[]>([])
  const [dropdownPage, setDropdownPage] = useState(0)
  const [dropdownHasMore, setDropdownHasMore] = useState(true)
  const [dropdownLoading, setDropdownLoading] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const router = useRouter()
  const supabase = createClient()

  const fetchProducts = useCallback(async (page: number, searchQuery: string, reset: boolean) => {
    setDropdownLoading(true)
    let query = supabase
      .from("products")
      .select("id, name")
      .eq("store_id", storeId)
      .order("name")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (searchQuery.trim()) {
      query = query.ilike("name", `%${searchQuery.trim()}%`)
    }

    const { data } = await query
    const items = data || []

    setDropdownProducts((prev) => reset ? items : [...prev, ...items])
    setDropdownHasMore(items.length === PAGE_SIZE)
    setDropdownPage(page)
    setDropdownLoading(false)
  }, [storeId, supabase])

  // Fetch on popover open
  useEffect(() => {
    if (popoverOpen) {
      setDropdownProducts([])
      setDropdownPage(0)
      setDropdownHasMore(true)
      fetchProducts(0, search, true)
    }
  }, [popoverOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  function handleSearchChange(value: string) {
    setSearch(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDropdownProducts([])
      setDropdownPage(0)
      setDropdownHasMore(true)
      fetchProducts(0, value, true)
    }, 300)
  }

  function handleScroll() {
    const el = scrollRef.current
    if (!el || dropdownLoading || !dropdownHasMore) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      fetchProducts(dropdownPage + 1, search, false)
    }
  }

  function toggleProduct(id: string, productName: string) {
    setSelectedProducts((prev) => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id)
      else next.set(id, productName)
      return next
    })
  }

  function removeProduct(id: string) {
    setSelectedProducts((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }

  function openCreate() {
    setEditingCollection(null)
    setName("")
    setSelectedProducts(new Map())
    setSearch("")
    setDialogOpen(true)
  }

  async function openEdit(collection: Collection) {
    setEditingCollection(collection)
    setName(collection.name)
    setSearch("")

    // Fetch products belonging to this collection
    const { data } = await supabase
      .from("products")
      .select("id, name")
      .eq("collection_id", collection.id)
      .order("name")

    const map = new Map<string, string>()
    data?.forEach((p) => map.set(p.id, p.name))
    setSelectedProducts(map)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Collection name is required")
      return
    }

    setLoading(true)
    const selected = Array.from(selectedProducts.keys())

    if (editingCollection) {
      if (name.trim() !== editingCollection.name) {
        const { error } = await supabase
          .from("collections")
          .update({ name: name.trim(), slug: slugify(name) })
          .eq("id", editingCollection.id)
        if (error) {
          toast.error(error.code === "23505" ? "Collection with this name already exists" : error.message)
          setLoading(false)
          return
        }
      }

      // Clear all products from this collection first
      await supabase
        .from("products")
        .update({ collection_id: null })
        .eq("collection_id", editingCollection.id)

      // Set selected products
      if (selected.length > 0) {
        await supabase
          .from("products")
          .update({ collection_id: editingCollection.id })
          .in("id", selected)
      }

      toast.success("Collection updated")
    } else {
      const { data: newCollection, error } = await supabase
        .from("collections")
        .insert({
          store_id: storeId,
          name: name.trim(),
          slug: slugify(name),
          sort_order: initialCollections.length,
        })
        .select("id")
        .single()

      if (error || !newCollection) {
        toast.error(error?.code === "23505" ? "Collection with this name already exists" : error?.message || "Failed")
        setLoading(false)
        return
      }

      if (selected.length > 0) {
        await supabase
          .from("products")
          .update({ collection_id: newCollection.id })
          .in("id", selected)
      }

      toast.success("Collection created")
    }

    setLoading(false)
    setDialogOpen(false)
    router.refresh()
  }

  async function deleteCollection() {
    if (!deleteId) return
    const { error } = await supabase.from("collections").delete().eq("id", deleteId)
    if (error) {
      toast.error(error.message)
      setDeleteId(null)
      return
    }
    toast.success("Collection deleted")
    setDeleteId(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create collection
        </Button>
      </div>

      {initialCollections.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteId(c.id)} className="text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
          <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No collections yet</p>
          <p className="text-sm text-muted-foreground">Collections help organize your products into categories.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? "Edit collection" : "Create collection"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer collection"
              />
            </div>

            <div className="space-y-2">
              <Label>Products</Label>
              <Popover modal open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between font-normal">
                    {selectedProducts.size > 0
                      ? `${selectedProducts.size} product${selectedProducts.size > 1 ? "s" : ""} selected`
                      : "Select products..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="overflow-hidden p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)', maxWidth: 'var(--radix-popover-trigger-width)' }}>
                  <div className="p-2">
                    <Input
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search products..."
                      className="h-8"
                    />
                  </div>
                  <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="max-h-[200px] overflow-x-hidden overflow-y-auto"
                  >
                    {dropdownProducts.map((p) => {
                      const isSelected = selectedProducts.has(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProduct(p.id, p.name)}
                          className="flex w-full min-w-0 items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted"
                        >
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span className="truncate">{p.name}</span>
                        </button>
                      )
                    })}
                    {dropdownLoading && (
                      <div className="flex justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!dropdownLoading && dropdownProducts.length === 0 && (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        {search ? "No products match" : "No products yet"}
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedProducts.size > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedProducts.entries()).map(([id, productName]) => (
                    <Badge key={id} variant="secondary" className="gap-1 pr-1">
                      <span className="max-w-[150px] truncate">{productName}</span>
                      <button
                        type="button"
                        onClick={() => removeProduct(id)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleSave} disabled={loading || !name.trim()} className="w-full">
              {loading ? "Saving..." : editingCollection ? "Update collection" : "Create collection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete collection?</AlertDialogTitle>
            <AlertDialogDescription>
              Products in this collection will become uncategorized. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCollection} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
