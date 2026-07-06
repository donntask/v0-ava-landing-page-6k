'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useCurrency } from '@/lib/use-currency'
import type { Product } from '@/lib/types'
import { ImageUpload } from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  X,
  ImageIcon,
  Tag,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  minPrice: '',
  negotiationEnabled: true,
  imageUrl: '',
}

export default function ProductsPage() {
  const { user } = useAuth()
  const { fmt } = useCurrency()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // Load products on mount
  useEffect(() => {
    if (!user) return
    loadProducts()
  }, [user])

  async function loadProducts() {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/products?userId=${user.uid}`)
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('[v0] Error loading products:', err)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      minPrice: String(p.minPrice),
      negotiationEnabled: p.negotiationEnabled,
      imageUrl: p.imageUrl ?? '',
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user) return

      const price = parseFloat(form.price)
      const minPrice = parseFloat(form.minPrice)

      if (!form.name.trim()) {
        toast.error('Product name is required.')
        return
      }
      if (isNaN(price) || price <= 0) {
        toast.error('Enter a valid selling price.')
        return
      }
      if (isNaN(minPrice) || minPrice < 0) {
        toast.error('Enter a valid floor price.')
        return
      }
      if (minPrice > price) {
        toast.error('Floor price cannot exceed selling price.')
        return
      }

      setSaving(true)
      try {
        const payload = {
          userId: user.uid,
          name: form.name.trim(),
          description: form.description.trim(),
          price,
          minPrice,
          negotiationEnabled: form.negotiationEnabled,
          imageUrl: form.imageUrl || '',
        }

        if (editingId) {
          // Update via API
          const res = await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, productId: editingId }),
          })
          if (!res.ok) throw new Error('Failed to update product')
          toast.success('Product updated.')
        } else {
          // Create via API
          const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) throw new Error('Failed to create product')
          toast.success('Product added.')
        }

        closeForm()
        await loadProducts()
      } catch (err) {
        console.error('[v0] Error saving product:', err)
        toast.error('Failed to save product.')
      } finally {
        setSaving(false)
      }
    },
    [user, form, editingId],
  )

  async function handleDelete(id: string) {
    if (!user) return
    setDeleting(id)
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, productId: id }),
      })
      if (!res.ok) throw new Error('Failed to delete product')
      toast.success('Product deleted.')
      await loadProducts()
    } catch (err) {
      console.error('[v0] Error deleting product:', err)
      toast.error('Failed to delete.')
    } finally {
      setDeleting(null)
    }
  }

  async function toggleNegotiation(p: Product) {
    if (!user) return
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          productId: p.id,
          negotiationEnabled: !p.negotiationEnabled,
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      await loadProducts()
    } catch (err) {
      console.error('[v0] Error toggling negotiation:', err)
      toast.error('Failed to update.')
    }
  }

  return (
    <div className="min-h-full bg-background">

      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-4 lg:px-8 lg:pt-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {products.length} product{products.length !== 1 ? 's' : ''} — AroMsg sells these via WhatsApp
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] rounded-xl gap-2 h-9 px-4 text-sm font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      <div className="px-4 lg:px-8 pb-6">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-card border border-border rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
              <Package className="w-7 h-7 text-[var(--aro-green)]" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold">No products yet</p>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                Add your first product so AroMsg knows what to sell on WhatsApp.
              </p>
            </div>
            <Button
              onClick={openNew}
              className="bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] rounded-xl gap-2"
            >
              <Plus className="w-4 h-4" /> Add First Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:border-[var(--aro-green)]/30 transition-all duration-200"
              >
                {/* Image */}
                <div className="relative aspect-video bg-secondary shrink-0">
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="400px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/25" />
                    </div>
                  )}
                  {/* Negotiable badge */}
                  {p.negotiationEnabled && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold bg-[var(--aro-teal)] text-white px-2 py-0.5 rounded-full">
                      NEG
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <p className="text-foreground text-sm font-semibold leading-snug line-clamp-2">{p.name}</p>
                  {p.description && (
                    <p className="text-muted-foreground text-[11px] line-clamp-2 leading-relaxed">{p.description}</p>
                  )}

                  {/* Price row */}
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    <span className="text-[var(--aro-green)] font-bold text-sm">
                      {fmt(p.price)}
                    </span>
                    <span className="flex items-center gap-0.5 text-muted-foreground text-[10px]">
                      <Tag className="w-2.5 h-2.5" />{fmt(p.minPrice)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex border-t border-border">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <div className="w-px bg-border" />
                  <button
                    onClick={() => toggleNegotiation(p)}
                    className="flex-1 flex items-center justify-center py-2.5 transition-colors hover:bg-secondary"
                    aria-label="Toggle negotiation"
                  >
                    {p.negotiationEnabled
                      ? <ToggleRight className="w-4 h-4 text-[var(--aro-teal)]" />
                      : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <div className="w-px bg-border" />
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="flex-1 flex items-center justify-center py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom sheet form (mobile) / slide-in panel (desktop) ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-stretch lg:justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeForm} />

          {/* Sheet / Panel */}
          <div className={cn(
            'relative bg-card w-full overflow-y-auto flex flex-col',
            'rounded-t-2xl max-h-[92vh]',
            'lg:rounded-none lg:max-h-none lg:h-full lg:w-[420px] lg:border-l lg:border-border',
          )}>
            {/* Handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 lg:hidden">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-foreground font-semibold">
                {editingId ? 'Edit Product' : 'New Product'}
              </h2>
              <button
                onClick={closeForm}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-5 p-5 flex-1">
              {/* Image */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Product Image
                </Label>
                <ImageUpload
                  value={form.imageUrl}
                  onChange={(url) => setForm({ ...form, imageUrl: url })}
                  folder="products"
                  variant="rect"
                  label="Tap to upload image"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prod-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Name *
                </Label>
                <Input
                  id="prod-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Nike Air Max 90"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl"
                  required
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="prod-desc" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Description
                </Label>
                <textarea
                  id="prod-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the product..."
                  rows={3}
                  className="bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 rounded-xl px-3 py-2.5 text-sm resize-none outline-none transition-colors leading-relaxed"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prod-price" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Price *
                  </Label>
                  <Input
                    id="prod-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prod-floor" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Floor Price *
                  </Label>
                  <Input
                    id="prod-floor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minPrice}
                    onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                    placeholder="0.00"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-[var(--aro-green)]/60 h-11 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Negotiation */}
              <button
                type="button"
                onClick={() => setForm({ ...form, negotiationEnabled: !form.negotiationEnabled })}
                className={cn(
                  'flex items-center justify-between p-4 rounded-xl border transition-all',
                  form.negotiationEnabled
                    ? 'bg-[var(--aro-green)]/8 border-[var(--aro-green)]/30'
                    : 'bg-secondary border-border',
                )}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Allow Negotiation</p>
                  <p className="text-xs text-muted-foreground mt-0.5">AroMsg negotiates between floor and price</p>
                </div>
                {form.negotiationEnabled
                  ? <ToggleRight className="w-8 h-8 text-[var(--aro-green)] shrink-0" />
                  : <ToggleLeft className="w-8 h-8 text-muted-foreground shrink-0" />}
              </button>

              {/* Submit */}
              <div className="flex gap-3 mt-auto pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  className="flex-1 border-border text-muted-foreground hover:text-foreground rounded-xl h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[var(--aro-green)] hover:bg-[var(--aro-green-dark)] text-[var(--aro-bg)] rounded-xl h-11 font-semibold disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
