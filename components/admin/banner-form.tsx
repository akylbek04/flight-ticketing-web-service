"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"
import { doc, addDoc, updateDoc, deleteDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Banner } from "@/types"

interface BannerFormProps {
  banners: Banner[]
  onBannerChange: () => void
}

export function BannerForm({ banners, onBannerChange }: BannerFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    link: "",
    active: true,
    order: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBanner) {
        // Update existing banner
        await updateDoc(doc(db, "banners", editingBanner.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        })
      } else {
        // Create new banner
        await addDoc(collection(db, "banners"), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
      onBannerChange()
      setIsOpen(false)
      setEditingBanner(null)
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        link: "",
        active: true,
        order: 0,
      })
    } catch (error) {
      console.error("Error saving banner:", error)
    }
  }

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      link: banner.link || "",
      active: banner.active,
      order: banner.order,
    })
    setIsOpen(true)
  }

  const handleDelete = async (bannerId: string) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      try {
        await deleteDoc(doc(db, "banners", bannerId))
        onBannerChange()
      } catch (error) {
        console.error("Error deleting banner:", error)
      }
    }
  }

  const handleOpen = () => {
    setEditingBanner(null)
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      link: "",
      active: true,
      order: banners.length,
    })
    setIsOpen(true)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleOpen} className="mb-2">
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="link">Link (optional)</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingBanner ? "Update" : "Create"} Banner
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {banners.map((banner) => (
          <div key={banner.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold">{banner.title}</p>
                <span className={`px-2 py-1 text-xs rounded-full ${banner.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                  {banner.active ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-muted-foreground">Order: {banner.order}</span>
              </div>
              <p className="text-sm text-muted-foreground">{banner.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(banner)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(banner.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
